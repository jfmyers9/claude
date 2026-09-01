import { writeDebugArtifact } from "./debug";
import type { NativeCompactionRuntime } from "./runtime";
import type { NativeCompactionRequestBody } from "./serializer";
import type { ArtifactContext, ExtensionSettings } from "./types";

const JSON_CONTENT_TYPE = "application/json";
const SSE_CONTENT_TYPE = "text/event-stream";
const RETAINED_MESSAGE_TOKEN_BUDGET = 64_000;
const MAX_RETAINED_ASSISTANT_MESSAGE_TOKENS = 10_000;
const MAX_STREAM_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 250;
const STREAM_IDLE_TIMEOUT_MS = 300_000;

type NativeCompactionClientFailureReason =
	| "aborted"
	| "network-error"
	| "non-2xx"
	| "empty-body"
	| "invalid-event"
	| "incomplete-stream"
	| "stream-timeout"
	| "invalid-compaction-output";

type NativeCompactionClientSuccess = {
	ok: true;
	status: number;
	compactedWindow: unknown[];
	compactResponseId?: string;
	createdAt?: string;
	estimatedTokensAfter?: number;
};

type NativeCompactionClientFailure = {
	ok: false;
	reason: NativeCompactionClientFailureReason;
	status?: number;
	errorMessage?: string;
	responseText?: string;
	responseJson?: unknown;
};

type NativeCompactionClientResult = NativeCompactionClientSuccess | NativeCompactionClientFailure;

type ExecuteNativeCompactionOptions = {
	runtime: NativeCompactionRuntime;
	request: NativeCompactionRequestBody;
	signal?: AbortSignal;
	streamIdleTimeoutMs?: number;
	retryDelayMs?: number;
	settings?: ExtensionSettings;
	context?: ArtifactContext;
};

type CollectedCompaction = {
	compactionOutput: Record<string, unknown>;
	responseId?: string;
	createdAt?: string;
	outputTokens?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
	return (
		(error instanceof DOMException && error.name === "AbortError") ||
		(error instanceof Error && (error.name === "AbortError" || error.name === "ABORT_ERR"))
	);
}
function isRetryableFailure(failure: NativeCompactionClientFailure): boolean {
	if (
		failure.reason === "network-error" ||
		failure.reason === "empty-body" ||
		failure.reason === "invalid-event" ||
		failure.reason === "incomplete-stream" ||
		failure.reason === "stream-timeout"
	) {
		return true;
	}
	return (
		failure.reason === "non-2xx" &&
		failure.status !== undefined &&
		(failure.status === 408 ||
			failure.status === 409 ||
			failure.status === 425 ||
			failure.status === 429 ||
			failure.status >= 500)
	);
}

async function waitForRetry(retry: number, signal?: AbortSignal, delayMs = INITIAL_RETRY_DELAY_MS): Promise<void> {
	if (signal?.aborted) return;
	await new Promise<void>((resolve) => {
		const timeout = setTimeout(finish, delayMs * 2 ** (retry - 1));
		function finish() {
			clearTimeout(timeout);
			signal?.removeEventListener("abort", finish);
			resolve();
		}
		signal?.addEventListener("abort", finish, { once: true });
	});
}
function createAttemptAbort(signal?: AbortSignal): {
	controller: AbortController;
	dispose: () => void;
} {
	const controller = new AbortController();
	const abort = () => controller.abort(signal?.reason);
	if (signal?.aborted) abort();
	else signal?.addEventListener("abort", abort, { once: true });
	return {
		controller,
		dispose: () => signal?.removeEventListener("abort", abort),
	};
}

async function withIdleAbort<T>(
	controller: AbortController,
	timeoutMs: number,
	operation: () => Promise<T>,
): Promise<T> {
	const timeout = setTimeout(
		() => controller.abort(new DOMException("Responses request idle timeout", "TimeoutError")),
		timeoutMs,
	);
	try {
		return await operation();
	} finally {
		clearTimeout(timeout);
	}
}

function normalizeResponseTimestamp(value: unknown): string | undefined {
	if (typeof value === "number" && Number.isFinite(value)) {
		const milliseconds = value > 1_000_000_000_000 ? value : value * 1000;
		return new Date(milliseconds).toISOString();
	}
	if (typeof value !== "string" || !value.trim()) return undefined;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? value.trim() : new Date(parsed).toISOString();
}

function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
	const parts = token.split(".");
	if (parts.length !== 3) return undefined;
	try {
		const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8"));
		return isRecord(payload) ? payload : undefined;
	} catch {
		return undefined;
	}
}

function extractCodexAccountId(token: string): string | undefined {
	const authClaims = decodeJwtPayload(token)?.["https://api.openai.com/auth"];
	if (!isRecord(authClaims)) return undefined;
	const accountId = authClaims.chatgpt_account_id;
	return typeof accountId === "string" && accountId.trim() ? accountId.trim() : undefined;
}

function buildCodexUserAgent(): string {
	const platform = typeof process !== "undefined" ? process.platform : "browser";
	const arch = typeof process !== "undefined" ? process.arch : "unknown";
	return `pi (${platform}; ${arch})`;
}
function applyCodexMetadataHeaders(headers: Headers, body: Record<string, unknown>): void {
	if (!isRecord(body.client_metadata)) return;
	for (const key of ["x-codex-turn-metadata", "x-codex-window-id", "x-codex-parent-thread-id", "x-openai-subagent"]) {
		const value = body.client_metadata[key];
		if (typeof value === "string" && value) headers.set(key, value);
	}
}

function headersToRecord(headers: Headers): Record<string, string> {
	const result: Record<string, string> = {};
	headers.forEach((value, key) => {
		result[key] = value;
	});
	return result;
}

function toHeaders(runtime: NativeCompactionRuntime, body: Record<string, unknown>): Record<string, string> {
	const headers = new Headers(runtime.currentModel.headers ?? {});
	for (const [key, value] of Object.entries(runtime.headers ?? {})) {
		if (value === null) headers.delete(key);
		else headers.set(key, value);
	}
	headers.set("accept", SSE_CONTENT_TYPE);
	headers.set("content-type", JSON_CONTENT_TYPE);
	if (!headers.has("authorization")) headers.set("authorization", `Bearer ${runtime.apiKey}`);

	if (runtime.provider === "openai-codex") {
		const accountId = extractCodexAccountId(runtime.apiKey);
		if (accountId) headers.set("chatgpt-account-id", accountId);
		headers.set("originator", "pi");
		headers.set("user-agent", buildCodexUserAgent());
		headers.set("openai-beta", "responses=experimental");
		applyCodexMetadataHeaders(headers, body);
	}

	return headersToRecord(headers);
}

function writeCompactArtifact(
	data: unknown,
	settings: ExtensionSettings | undefined,
	context: ArtifactContext | undefined,
): void {
	if (settings && context) writeDebugArtifact("compact-response", data, settings, context);
}

function approximateTextTokens(text: string): number {
	return Math.ceil(Buffer.byteLength(text, "utf8") / 4);
}

function truncateText(text: string, maxTokens: number): string {
	const maxBytes = maxTokens * 4;
	const bytes = Buffer.from(text, "utf8");
	if (bytes.length <= maxBytes) return text;
	const prefixBytes = Math.floor(maxBytes / 2);
	const suffixBytes = maxBytes - prefixBytes;
	const prefix = bytes
		.subarray(0, prefixBytes)
		.toString("utf8")
		.replace(/\uFFFD$/, "");
	const suffix = bytes
		.subarray(bytes.length - suffixBytes)
		.toString("utf8")
		.replace(/^\uFFFD/, "");
	return prefix + suffix;
}

function isRetainedMessage(item: Record<string, unknown>): boolean {
	return item.role === "user" || (item.role === "assistant" && item.phase === "commentary");
}

function truncateRetainedMessage(
	item: Record<string, unknown>,
	maxTokens: number,
): { item: Record<string, unknown>; consumedTokens: number } | undefined {
	if (!isRetainedMessage(item)) return undefined;
	const messageBudget =
		item.role === "assistant" ? Math.min(maxTokens, MAX_RETAINED_ASSISTANT_MESSAGE_TOKENS) : maxTokens;
	if (typeof item.content === "string") {
		const content = truncateText(item.content, messageBudget);
		return content
			? {
					item: { ...structuredClone(item), content },
					consumedTokens: Math.max(1, approximateTextTokens(content)),
				}
			: undefined;
	}
	if (!Array.isArray(item.content)) return undefined;

	let remaining = messageBudget;
	const content: unknown[] = [];
	for (const value of item.content) {
		if (isRecord(value) && typeof value.text === "string") {
			if (remaining === 0) continue;
			const text = truncateText(value.text, remaining);
			if (!text) continue;
			content.push({ ...structuredClone(value), text });
			remaining -= Math.max(1, approximateTextTokens(text));
			continue;
		}
		content.push(structuredClone(value));
	}
	if (content.length === 0) return undefined;
	return {
		item: { ...structuredClone(item), content },
		consumedTokens: Math.max(1, messageBudget - remaining),
	};
}

function retainedMessages(input: readonly unknown[]): unknown[] {
	let remaining = RETAINED_MESSAGE_TOKEN_BUDGET;
	const retained: unknown[] = [];
	for (let index = input.length - 1; index >= 0 && remaining > 0; index -= 1) {
		const item = input[index];
		if (!isRecord(item)) continue;
		const truncated = truncateRetainedMessage(item, remaining);
		if (!truncated) continue;
		retained.push(truncated.item);
		remaining -= truncated.consumedTokens;
	}
	return retained.reverse();
}

function retainedMessageTokens(item: unknown): number {
	if (!isRecord(item)) return 0;
	if (typeof item.content === "string") return Math.max(1, approximateTextTokens(item.content));
	if (!Array.isArray(item.content)) return 1;
	const textTokens = item.content.reduce(
		(total, value) =>
			total + (isRecord(value) && typeof value.text === "string" ? approximateTextTokens(value.text) : 0),
		0,
	);
	return Math.max(1, textTokens);
}

function buildV2Request(request: NativeCompactionRequestBody): Record<string, unknown> {
	return {
		...request,
		input: [...request.input, { type: "compaction_trigger" }],
		store: false,
		stream: true,
	};
}

function parseSseData(block: string): string | undefined {
	const data = block
		.split(/\r?\n/)
		.filter((line) => line.startsWith("data:"))
		.map((line) => line.slice("data:".length).trimStart())
		.join("\n");
	return data || undefined;
}

function isCompactionOutput(value: unknown): value is Record<string, unknown> {
	return (
		isRecord(value) &&
		value.type === "compaction" &&
		typeof value.encrypted_content === "string" &&
		value.encrypted_content.length > 0
	);
}
async function readStreamChunk(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	timeoutMs: number,
	onTimeout: () => void,
): Promise<ReadableStreamReadResult<Uint8Array> | undefined> {
	let timeout: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			reader.read(),
			new Promise<undefined>((resolve) => {
				timeout = setTimeout(() => {
					onTimeout();
					resolve(undefined);
				}, timeoutMs);
			}),
		]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}

async function collectCompactionOutput(
	response: Response,
	streamIdleTimeoutMs: number,
	onTimeout: () => void,
): Promise<CollectedCompaction | NativeCompactionClientFailure> {
	if (!response.body) return { ok: false, reason: "empty-body", status: response.status };

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let streamDone = false;
	let sawCompleted = false;
	let responseId: string | undefined;
	let createdAt: string | undefined;
	let outputTokens: number | undefined;
	const compactionOutputs: Record<string, unknown>[] = [];

	const consume = (block: string): NativeCompactionClientFailure | undefined => {
		const data = parseSseData(block);
		if (!data || data === "[DONE]") return undefined;
		let event: unknown;
		try {
			event = JSON.parse(data);
		} catch (error) {
			return {
				ok: false,
				reason: "invalid-event",
				status: response.status,
				errorMessage: error instanceof Error ? error.message : String(error),
				responseText: data,
			};
		}
		if (!isRecord(event)) return undefined;

		if (event.type === "response.output_item.done" && isCompactionOutput(event.item)) {
			compactionOutputs.push(event.item);
		}
		if (event.type === "response.completed") {
			sawCompleted = true;
			const completedResponse = isRecord(event.response) ? event.response : undefined;
			responseId =
				typeof completedResponse?.id === "string"
					? completedResponse.id
					: typeof event.response_id === "string"
						? event.response_id
						: undefined;
			createdAt = normalizeResponseTimestamp(completedResponse?.created_at);
			const usage = isRecord(completedResponse?.usage) ? completedResponse.usage : undefined;
			outputTokens =
				typeof usage?.output_tokens === "number" && Number.isFinite(usage.output_tokens)
					? Math.max(0, usage.output_tokens)
					: undefined;
		}
		return undefined;
	};

	try {
		while (!sawCompleted) {
			const chunk = await readStreamChunk(reader, streamIdleTimeoutMs, onTimeout);
			if (!chunk) return { ok: false, reason: "stream-timeout", status: response.status };
			const { done, value } = chunk;
			streamDone = done;
			if (value) buffer += decoder.decode(value, { stream: !done });
			const blocks = buffer.split(/\r?\n\r?\n/);
			buffer = blocks.pop() ?? "";
			for (const block of blocks) {
				const failure = consume(block);
				if (failure) return failure;
				if (sawCompleted) break;
			}
			if (done) {
				const failure = consume(buffer);
				if (failure) return failure;
				break;
			}
		}

		if (!sawCompleted) return { ok: false, reason: "incomplete-stream", status: response.status };
		if (compactionOutputs.length !== 1) {
			return {
				ok: false,
				reason: "invalid-compaction-output",
				status: response.status,
				errorMessage: `Expected exactly one compaction output item, got ${compactionOutputs.length}`,
			};
		}
		return { compactionOutput: compactionOutputs[0]!, responseId, createdAt, outputTokens };
	} finally {
		if (!streamDone) await reader.cancel().catch(() => undefined);
		reader.releaseLock();
	}
}

async function executeNativeCompactionAttempt(
	options: ExecuteNativeCompactionOptions,
): Promise<NativeCompactionClientResult> {
	const { runtime, request, signal, settings, context, streamIdleTimeoutMs = STREAM_IDLE_TIMEOUT_MS } = options;
	const body = buildV2Request(request);
	const headers = toHeaders(runtime, body);
	const artifactRequest = { url: runtime.responsesUrl, headers, body };

	if (signal?.aborted) {
		const failure: NativeCompactionClientFailure = { ok: false, reason: "aborted" };
		writeCompactArtifact({ request: artifactRequest, outcome: failure }, settings, context);
		return failure;
	}

	const attemptAbort = createAttemptAbort(signal);
	try {
		const response = await withIdleAbort(attemptAbort.controller, streamIdleTimeoutMs, () =>
			fetch(runtime.responsesUrl, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
				signal: attemptAbort.controller.signal,
			}),
		);
		const responseHeaders = headersToRecord(response.headers);

		if (!response.ok) {
			const responseText = await withIdleAbort(attemptAbort.controller, streamIdleTimeoutMs, () => response.text());
			let responseJson: unknown;
			try {
				responseJson = responseText ? JSON.parse(responseText) : undefined;
			} catch {
				responseJson = undefined;
			}
			const failure: NativeCompactionClientFailure = {
				ok: false,
				reason: "non-2xx",
				status: response.status,
				responseText: responseText || undefined,
				responseJson,
			};
			writeCompactArtifact(
				{
					request: artifactRequest,
					response: { status: response.status, headers: responseHeaders, body: responseJson ?? responseText },
					outcome: failure,
				},
				settings,
				context,
			);
			return failure;
		}

		const collected = await collectCompactionOutput(response, streamIdleTimeoutMs, () =>
			attemptAbort.controller.abort(new DOMException("Responses stream idle timeout", "TimeoutError")),
		);
		if ("ok" in collected) {
			writeCompactArtifact(
				{
					request: artifactRequest,
					response: { status: response.status, headers: responseHeaders },
					outcome: collected,
				},
				settings,
				context,
			);
			return collected;
		}

		const retained = retainedMessages(request.input);
		const compactedWindow = [...retained, collected.compactionOutput];
		const estimatedTokensAfter =
			collected.outputTokens === undefined
				? undefined
				: retained.reduce<number>((total, item) => total + retainedMessageTokens(item), 0) + collected.outputTokens;
		const success: NativeCompactionClientSuccess = {
			ok: true,
			status: response.status,
			compactedWindow,
			compactResponseId: collected.responseId,
			createdAt: collected.createdAt,
			estimatedTokensAfter,
		};
		writeCompactArtifact(
			{
				request: artifactRequest,
				response: {
					status: response.status,
					headers: responseHeaders,
					body: {
						id: collected.responseId,
						created_at: collected.createdAt,
						output: [collected.compactionOutput],
					},
				},
				outcome: {
					ok: true,
					status: success.status,
					compactResponseId: success.compactResponseId,
					createdAt: success.createdAt,
					compactedItems: success.compactedWindow.length,
					estimatedTokensAfter: success.estimatedTokensAfter,
				},
			},
			settings,
			context,
		);
		return success;
	} catch (error) {
		const failure: NativeCompactionClientFailure =
			signal?.aborted || isAbortError(error)
				? { ok: false, reason: "aborted" }
				: {
						ok: false,
						reason: "network-error",
						errorMessage: error instanceof Error ? error.message : String(error),
					};
		writeCompactArtifact({ request: artifactRequest, outcome: failure }, settings, context);
		return failure;
	} finally {
		attemptAbort.dispose();
	}
}

export async function executeNativeCompaction(
	options: ExecuteNativeCompactionOptions,
): Promise<NativeCompactionClientResult> {
	let result = await executeNativeCompactionAttempt(options);
	for (let retry = 1; retry <= MAX_STREAM_RETRIES && !result.ok && isRetryableFailure(result); retry += 1) {
		await waitForRetry(retry, options.signal, options.retryDelayMs);
		result = await executeNativeCompactionAttempt(options);
	}
	return result;
}
