import { afterEach, expect, mock, test } from "bun:test";
import { executeNativeCompaction } from "./compact-client";
import { buildResponsesUrl } from "./runtime";
import { createNativeCompactionDetails, isNativeCompactionDetails } from "./types";

const baseModel = {
	provider: "openai",
	api: "openai-responses",
	id: "gpt-5-mini",
	name: "gpt-5-mini",
	baseUrl: "https://api.openai.com/v1",
	reasoning: true,
	input: ["text"],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	contextWindow: 100000,
	maxTokens: 1000,
};

let serializerImportCounter = 0;

async function loadSerializerModule() {
	mock.module("@earendil-works/pi-coding-agent", () => ({
		convertToLlm: (messages: unknown[]) => messages,
	}));
	return import(`./serializer.ts?unit=${serializerImportCounter++}`);
}

function createJwtWithAccountId(accountId: string): string {
	const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
	const payload = Buffer.from(
		JSON.stringify({
			"https://api.openai.com/auth": {
				chatgpt_account_id: accountId,
			},
		}),
	).toString("base64url");
	return `${header}.${payload}.signature`;
}

afterEach(() => {
	serializerImportCounter = 0;
	mock.restore();
});

test("buildResponsesUrl uses the normal Responses endpoint", () => {
	expect(buildResponsesUrl("https://api.openai.com/v1", "openai-responses")).toBe(
		"https://api.openai.com/v1/responses",
	);
	expect(buildResponsesUrl("https://chatgpt.com/backend-api", "openai-codex-responses")).toBe(
		"https://chatgpt.com/backend-api/codex/responses",
	);
	expect(buildResponsesUrl("https://chatgpt.com/backend-api/codex", "openai-codex-responses")).toBe(
		"https://chatgpt.com/backend-api/codex/responses",
	);
	expect(buildResponsesUrl("https://chatgpt.com/backend-api/codex/responses", "openai-codex-responses")).toBe(
		"https://chatgpt.com/backend-api/codex/responses",
	);
});

test("executeNativeCompaction uses streamed V2 compaction and Codex auth headers", async () => {
	const token = createJwtWithAccountId("acct_123");
	let fetchArgs: { url?: string; init?: RequestInit } = {};
	globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
		fetchArgs = { url: String(url), init };
		return new Response(
			[
				`data: ${JSON.stringify({
					type: "response.output_item.done",
					item: { type: "compaction", encrypted_content: "opaque" },
				})}`,
				`data: ${JSON.stringify({
					type: "response.completed",
					response: { id: "resp_compact", created_at: 1_700_000_000, usage: { output_tokens: 320 } },
				})}`,
				"data: [DONE]",
				"",
			].join("\n\n"),
			{
				status: 200,
				headers: { "content-type": "text/event-stream" },
			},
		);
	}) as typeof fetch;

	const userItem = { role: "user", content: [{ type: "input_text", text: "hello" }] };
	const result = await executeNativeCompaction({
		runtime: {
			provider: "openai-codex",
			api: "openai-codex-responses",
			apiFamily: "openai-codex-responses",
			model: "gpt-5.1",
			baseUrl: "https://chatgpt.com/backend-api",
			apiKey: token,
			headers: {
				"x-test-model-header": "present",
				"x-test-runtime-header": "resolved",
				"x-delete-me": null,
			},
			responsesPath: "codex/responses",
			responsesUrl: buildResponsesUrl("https://chatgpt.com/backend-api", "openai-codex-responses"),
			currentModel: {
				...baseModel,
				provider: "openai-codex",
				api: "openai-codex-responses",
				id: "gpt-5.1",
				name: "gpt-5.1",
				baseUrl: "https://chatgpt.com/backend-api",
				headers: {
					"x-delete-me": "model default",
				},
			},
		},
		request: {
			model: "gpt-5.1",
			instructions: "compact this",
			input: [userItem],
			include: ["reasoning.encrypted_content"],
			client_metadata: {
				"x-codex-window-id": "window_123",
				"x-codex-turn-metadata": '{"request_kind":"compaction"}',
			},
		},
	});

	expect(result.ok).toBe(true);
	if (!result.ok) throw new Error(`Unexpected compaction failure: ${result.reason}`);
	expect(result.compactedWindow).toEqual([userItem, { type: "compaction", encrypted_content: "opaque" }]);
	expect(result.compactResponseId).toBe("resp_compact");
	expect(result.createdAt).toBe("2023-11-14T22:13:20.000Z");
	expect(result.estimatedTokensAfter).toBe(322);
	expect(fetchArgs.url).toBe("https://chatgpt.com/backend-api/codex/responses");
	const headers = new Headers(fetchArgs.init?.headers);
	expect(headers.get("x-test-model-header")).toBe("present");
	expect(headers.get("x-test-runtime-header")).toBe("resolved");
	expect(headers.has("x-delete-me")).toBe(false);
	expect(headers.get("authorization")).toBe(`Bearer ${token}`);
	expect(headers.get("chatgpt-account-id")).toBe("acct_123");
	expect(headers.get("originator")).toBe("pi");
	expect(headers.get("openai-beta")).toBe("responses=experimental");
	expect(headers.get("accept")).toBe("text/event-stream");
	expect(headers.get("content-type")).toBe("application/json");
	expect(headers.get("x-codex-window-id")).toBe("window_123");
	expect(headers.get("x-codex-turn-metadata")).toBe('{"request_kind":"compaction"}');
	expect(JSON.parse(String(fetchArgs.init?.body))).toEqual({
		model: "gpt-5.1",
		instructions: "compact this",
		input: [userItem, { type: "compaction_trigger" }],
		include: ["reasoning.encrypted_content"],
		client_metadata: {
			"x-codex-window-id": "window_123",
			"x-codex-turn-metadata": '{"request_kind":"compaction"}',
		},
		store: false,
		stream: true,
	});
});

test("V2 replacement history keeps latest user context within the retained-message budget", async () => {
	globalThis.fetch = mock(
		async () =>
			new Response(
				[
					`data: ${JSON.stringify({
						type: "response.output_item.done",
						item: { type: "compaction", encrypted_content: "opaque" },
					})}`,
					`data: ${JSON.stringify({
						type: "response.completed",
						response: { id: "resp_retention" },
					})}`,
					"",
				].join("\n\n"),
				{ status: 200, headers: { "content-type": "text/event-stream" } },
			),
	) as typeof fetch;

	const latestText = `START${"x".repeat(300_000)}END`;
	const commentaryText = `COMMENTARY_START${"y".repeat(50_000)}COMMENTARY_END`;
	const result = await executeNativeCompaction({
		runtime: {
			provider: "openai",
			api: "openai-responses",
			apiFamily: "openai-responses",
			model: baseModel.id,
			baseUrl: baseModel.baseUrl,
			apiKey: "sk-test",
			responsesPath: "responses",
			responsesUrl: buildResponsesUrl(baseModel.baseUrl, "openai-responses"),
			currentModel: baseModel,
		},
		request: {
			model: baseModel.id,
			instructions: "fresh instructions",
			input: [
				{ role: "developer", content: "stale instructions" },
				{ role: "user", content: "older user context" },
				{ role: "user", content: latestText },
				{
					type: "message",
					role: "assistant",
					phase: "commentary",
					content: [{ type: "output_text", text: commentaryText, annotations: [] }],
				},
				{
					type: "message",
					role: "assistant",
					phase: "final_answer",
					content: [{ type: "output_text", text: "final answer", annotations: [] }],
				},
			],
		},
	});

	expect(result.ok).toBe(true);
	if (!result.ok) throw new Error(`Unexpected compaction failure: ${result.reason}`);
	expect(result.compactedWindow).toHaveLength(3);
	expect(result.compactedWindow[0]).toMatchObject({ role: "user" });
	expect(result.compactedWindow[1]).toMatchObject({ role: "assistant", phase: "commentary" });
	expect(JSON.stringify(result.compactedWindow)).not.toContain("stale instructions");
	expect(JSON.stringify(result.compactedWindow)).not.toContain("older user context");
	expect(JSON.stringify(result.compactedWindow)).not.toContain("final answer");
	const retainedText = (result.compactedWindow[0] as { content: string }).content;
	expect(retainedText.length).toBeLessThan(latestText.length);
	expect(retainedText.length).toBeGreaterThan(0);
	expect(retainedText.startsWith("START")).toBe(true);
	expect(retainedText.endsWith("END")).toBe(true);
	const retainedCommentary = (result.compactedWindow[1] as { content: Array<{ text: string }> }).content[0]!.text;
	expect(retainedCommentary.length).toBeLessThan(commentaryText.length);
	expect(retainedCommentary.startsWith("COMMENTARY_START")).toBe(true);
	expect(retainedCommentary.endsWith("COMMENTARY_END")).toBe(true);
});

test("V2 replacement history retains image-only messages at the Codex minimum message cost", async () => {
	globalThis.fetch = mock(
		async () =>
			new Response(
				[
					`data: ${JSON.stringify({
						type: "response.output_item.done",
						item: { type: "compaction", encrypted_content: "opaque" },
					})}`,
					`data: ${JSON.stringify({
						type: "response.completed",
						response: { id: "resp_images" },
					})}`,
					"",
				].join("\n\n"),
				{ status: 200, headers: { "content-type": "text/event-stream" } },
			),
	) as typeof fetch;
	const imageMessages = Array.from({ length: 8 }, (_, index) => ({
		role: "user",
		content: [{ type: "input_image", image_url: `data:image/png;base64,${String(index)}${"a".repeat(128_000)}` }],
	}));

	const result = await executeNativeCompaction({
		runtime: {
			provider: "openai",
			api: "openai-responses",
			apiFamily: "openai-responses",
			model: baseModel.id,
			baseUrl: baseModel.baseUrl,
			apiKey: "sk-test",
			responsesPath: "responses",
			responsesUrl: buildResponsesUrl(baseModel.baseUrl, "openai-responses"),
			currentModel: baseModel,
		},
		request: { model: baseModel.id, instructions: "compact", input: imageMessages },
	});

	expect(result.ok).toBe(true);
	if (!result.ok) throw new Error(`Unexpected compaction failure: ${result.reason}`);
	expect(result.compactedWindow).toHaveLength(imageMessages.length + 1);
	expect(result.compactedWindow.slice(0, -1)).toEqual(imageMessages);
});

test("V2 replacement history keeps zero-cost images after text exhausts the message budget", async () => {
	globalThis.fetch = mock(
		async () =>
			new Response(
				[
					`data: ${JSON.stringify({
						type: "response.output_item.done",
						item: { type: "compaction", encrypted_content: "opaque" },
					})}`,
					`data: ${JSON.stringify({
						type: "response.completed",
						response: { id: "resp_text_image" },
					})}`,
					"",
				].join("\n\n"),
				{ status: 200, headers: { "content-type": "text/event-stream" } },
			),
	) as typeof fetch;
	const image = { type: "input_image", image_url: "data:image/png;base64,image" };

	const result = await executeNativeCompaction({
		runtime: {
			provider: "openai",
			api: "openai-responses",
			apiFamily: "openai-responses",
			model: baseModel.id,
			baseUrl: baseModel.baseUrl,
			apiKey: "sk-test",
			responsesPath: "responses",
			responsesUrl: buildResponsesUrl(baseModel.baseUrl, "openai-responses"),
			currentModel: baseModel,
		},
		request: {
			model: baseModel.id,
			instructions: "compact",
			input: [
				{
					role: "user",
					content: [{ type: "input_text", text: "x".repeat(300_000) }, image],
				},
			],
		},
	});

	expect(result.ok).toBe(true);
	if (!result.ok) throw new Error(`Unexpected compaction failure: ${result.reason}`);
	expect((result.compactedWindow[0] as { content: unknown[] }).content).toContainEqual(image);
});

test("executeNativeCompaction rejects V2 streams without response.completed", async () => {
	globalThis.fetch = mock(
		async () =>
			new Response(
				`data: ${JSON.stringify({
					type: "response.output_item.done",
					item: { type: "compaction", encrypted_content: "opaque" },
				})}\n\n`,
				{ status: 200, headers: { "content-type": "text/event-stream" } },
			),
	) as typeof fetch;

	const result = await executeNativeCompaction({
		runtime: {
			provider: "openai",
			api: "openai-responses",
			apiFamily: "openai-responses",
			model: baseModel.id,
			baseUrl: baseModel.baseUrl,
			apiKey: "sk-test",
			responsesPath: "responses",
			responsesUrl: buildResponsesUrl(baseModel.baseUrl, "openai-responses"),
			currentModel: baseModel,
		},
		request: { model: baseModel.id, instructions: "compact", input: [] },
		retryDelayMs: 0,
	});

	expect(result).toMatchObject({ ok: false, reason: "incomplete-stream" });
});

test("executeNativeCompaction retries retryable V2 stream failures", async () => {
	let attempts = 0;
	globalThis.fetch = mock(async () => {
		attempts += 1;
		if (attempts === 1) {
			return new Response("", {
				status: 200,
				headers: { "content-type": "text/event-stream" },
			});
		}
		return new Response(
			[
				`data: ${JSON.stringify({
					type: "response.output_item.done",
					item: { type: "compaction", encrypted_content: "opaque" },
				})}`,
				`data: ${JSON.stringify({
					type: "response.completed",
					response: { id: "resp_retry" },
				})}`,
				"",
			].join("\n\n"),
			{ status: 200, headers: { "content-type": "text/event-stream" } },
		);
	}) as typeof fetch;

	const result = await executeNativeCompaction({
		runtime: {
			provider: "openai",
			api: "openai-responses",
			apiFamily: "openai-responses",
			model: baseModel.id,
			baseUrl: baseModel.baseUrl,
			apiKey: "sk-test",
			responsesPath: "responses",
			responsesUrl: buildResponsesUrl(baseModel.baseUrl, "openai-responses"),
			currentModel: baseModel,
		},
		request: { model: baseModel.id, instructions: "compact", input: [] },
		retryDelayMs: 0,
	});

	expect(result).toMatchObject({ ok: true, compactResponseId: "resp_retry" });
	expect(attempts).toBe(2);
});

test("executeNativeCompaction retries a stalled V2 stream after the idle timeout", async () => {
	let attempts = 0;
	globalThis.fetch = mock(async () => {
		attempts += 1;
		if (attempts === 1) {
			return new Response(
				new ReadableStream({
					start() {},
				}),
				{ status: 200, headers: { "content-type": "text/event-stream" } },
			);
		}
		return new Response(
			[
				`data: ${JSON.stringify({
					type: "response.output_item.done",
					item: { type: "compaction", encrypted_content: "opaque" },
				})}`,
				`data: ${JSON.stringify({
					type: "response.completed",
					response: { id: "resp_after_timeout" },
				})}`,
				"",
			].join("\n\n"),
			{ status: 200, headers: { "content-type": "text/event-stream" } },
		);
	}) as typeof fetch;

	const result = await executeNativeCompaction({
		runtime: {
			provider: "openai",
			api: "openai-responses",
			apiFamily: "openai-responses",
			model: baseModel.id,
			baseUrl: baseModel.baseUrl,
			apiKey: "sk-test",
			responsesPath: "responses",
			responsesUrl: buildResponsesUrl(baseModel.baseUrl, "openai-responses"),
			currentModel: baseModel,
		},
		request: { model: baseModel.id, instructions: "compact", input: [] },
		streamIdleTimeoutMs: 5,
		retryDelayMs: 0,
	});

	expect(result).toMatchObject({ ok: true, compactResponseId: "resp_after_timeout" });
	expect(attempts).toBe(2);
});

test("executeNativeCompaction retries when the initial V2 response stalls", async () => {
	let attempts = 0;
	globalThis.fetch = mock(async (_url: string | URL | Request, init?: RequestInit) => {
		attempts += 1;
		if (attempts === 1) {
			return await new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener(
					"abort",
					() => reject(init.signal?.reason ?? new DOMException("Aborted", "AbortError")),
					{ once: true },
				);
			});
		}
		return new Response(
			[
				`data: ${JSON.stringify({
					type: "response.output_item.done",
					item: { type: "compaction", encrypted_content: "opaque" },
				})}`,
				`data: ${JSON.stringify({
					type: "response.completed",
					response: { id: "resp_after_fetch_timeout" },
				})}`,
				"",
			].join("\n\n"),
			{ status: 200, headers: { "content-type": "text/event-stream" } },
		);
	}) as typeof fetch;

	const result = await executeNativeCompaction({
		runtime: {
			provider: "openai",
			api: "openai-responses",
			apiFamily: "openai-responses",
			model: baseModel.id,
			baseUrl: baseModel.baseUrl,
			apiKey: "sk-test",
			responsesPath: "responses",
			responsesUrl: buildResponsesUrl(baseModel.baseUrl, "openai-responses"),
			currentModel: baseModel,
		},
		request: { model: baseModel.id, instructions: "compact", input: [] },
		streamIdleTimeoutMs: 5,
		retryDelayMs: 0,
	});

	expect(result).toMatchObject({ ok: true, compactResponseId: "resp_after_fetch_timeout" });
	expect(attempts).toBe(2);
});

test("executeNativeCompaction requires exactly one V2 compaction item", async () => {
	const compactionEvent = {
		type: "response.output_item.done",
		item: { type: "compaction", encrypted_content: "opaque" },
	};
	globalThis.fetch = mock(
		async () =>
			new Response(
				[
					`data: ${JSON.stringify(compactionEvent)}`,
					`data: ${JSON.stringify(compactionEvent)}`,
					`data: ${JSON.stringify({
						type: "response.completed",
						response: { id: "resp_duplicate" },
					})}`,
					"",
				].join("\n\n"),
				{ status: 200, headers: { "content-type": "text/event-stream" } },
			),
	) as typeof fetch;

	const result = await executeNativeCompaction({
		runtime: {
			provider: "openai",
			api: "openai-responses",
			apiFamily: "openai-responses",
			model: baseModel.id,
			baseUrl: baseModel.baseUrl,
			apiKey: "sk-test",
			responsesPath: "responses",
			responsesUrl: buildResponsesUrl(baseModel.baseUrl, "openai-responses"),
			currentModel: baseModel,
		},
		request: { model: baseModel.id, instructions: "compact", input: [] },
	});

	expect(result).toMatchObject({ ok: false, reason: "invalid-compaction-output" });
});

test("new compactions use V2 while persisted V1 details remain replayable", () => {
	const details = createNativeCompactionDetails({
		provider: "openai",
		api: "openai-responses",
		model: baseModel.id,
		baseUrl: baseModel.baseUrl,
		compactedWindow: [{ type: "compaction", encrypted_content: "opaque" }],
	});

	expect(details.strategy).toBe("openai-native-compact-v2");
	expect(isNativeCompactionDetails({ ...details, strategy: "openai-native-compact-v1" })).toBe(true);
});

test("serializer sanitizes unpaired surrogates in instructions and message content", async () => {
	const { serializeMessagesToCompactRequest, serializeMessagesToResponsesInput } = await loadSerializerModule();
	const invalid = "\ud800Hello\udc00";
	const request = serializeMessagesToCompactRequest({
		model: baseModel as never,
		instructions: `Prefix ${invalid}`,
		messages: [
			{
				role: "user",
				content: [{ type: "text", text: invalid }],
				timestamp: 1,
			},
			{
				role: "assistant",
				provider: baseModel.provider,
				api: baseModel.api,
				model: baseModel.id,
				stopReason: "stop",
				content: [
					{
						type: "text",
						text: invalid,
						textSignature: JSON.stringify({ v: 1, id: "msg_1" }),
					},
				],
				timestamp: 2,
			},
			{
				role: "toolResult",
				toolCallId: "call_1|fc_call_1",
				toolName: "read",
				isError: false,
				content: [{ type: "text", text: invalid }],
				timestamp: 3,
			},
		],
	});

	expect(JSON.stringify(request.instructions)).not.toContain("\\ud800");
	expect(JSON.stringify(request.input)).not.toContain("\\ud800");
	expect(JSON.stringify(request.input)).not.toContain("\\udc00");

	const inputOnly = serializeMessagesToResponsesInput(
		baseModel as never,
		[
			{
				role: "user",
				content: [{ type: "text", text: invalid }],
				timestamp: 1,
			},
		] as never,
	);
	expect(JSON.stringify(inputOnly)).not.toContain("\\ud800");
	expect(JSON.stringify(inputOnly)).not.toContain("\\udc00");
});

test("serializer normalizes legacy custom tool call item ids for function-call replay", async () => {
	const { serializeMessagesToResponsesInput } = await loadSerializerModule();
	const input = serializeMessagesToResponsesInput(
		baseModel as never,
		[
			{
				role: "assistant",
				provider: baseModel.provider,
				api: baseModel.api,
				model: baseModel.id,
				stopReason: "toolUse",
				content: [
					{
						type: "toolCall",
						id: "call_apply_patch|ctc_0ae3fabeb0423f2e016a00c39c449c81919eab6c5ebf693f2e",
						name: "apply_patch",
						arguments: { input: "*** Begin Patch\n*** End Patch" },
					},
				],
				timestamp: 1,
			},
		] as never,
	);

	const call = input.find((item) => item.type === "function_call") as { id: string; call_id: string };
	expect(call.id.startsWith("fc_")).toBe(true);
	expect(call.id.startsWith("ctc_")).toBe(false);
	expect(call.id.length).toBeLessThanOrEqual(64);
	expect(call.call_id).toBe("call_apply_patch");
});

test("serializer preserves assistant image generation call blocks", async () => {
	const { serializeMessagesToResponsesInput } = await loadSerializerModule();
	const input = serializeMessagesToResponsesInput(
		baseModel as never,
		[
			{
				role: "assistant",
				provider: baseModel.provider,
				api: baseModel.api,
				model: baseModel.id,
				stopReason: "stop",
				content: [
					{
						type: "image_generation_call",
						item: {
							type: "image_generation_call",
							id: "ig_1",
							status: "completed",
							result: "base64-image",
							revised_prompt: "A clearer prompt",
						},
					},
				],
				timestamp: 1,
			},
		] as never,
	);

	expect(input).toEqual([
		{
			type: "image_generation_call",
			id: "ig_1",
			status: "completed",
			result: "base64-image",
			revised_prompt: "A clearer prompt",
		},
	]);
});
