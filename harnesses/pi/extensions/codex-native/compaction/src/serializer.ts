import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { Api, Context, Message, Model } from "@earendil-works/pi-ai";
import { convertToLlm } from "@earendil-works/pi-coding-agent";
import { convertResponsesMessages } from "../../openai-responses-shared";

export type AssistantPhase = "commentary" | "final_answer";

type ResponsesTextInputItem = {
	type: "input_text";
	text: string;
};

type ResponsesImageInputItem = {
	type: "input_image";
	detail: "auto";
	image_url: string;
};

export type ResponsesInputContentItem = ResponsesTextInputItem | ResponsesImageInputItem;

export type ResponsesInputMessageItem = {
	role: "user" | "developer" | "system";
	content: ResponsesInputContentItem[] | string;
};

type ResponsesAssistantOutputItem = {
	type: "message";
	role: "assistant";
	content: Array<{
		type: "output_text";
		text: string;
		annotations: [];
	}>;
	status: "completed";
	id: string;
	phase?: AssistantPhase;
};

type ResponsesFunctionCallItem = {
	type: "function_call";
	id?: string;
	call_id: string;
	name: string;
	arguments: string;
};

type ResponsesFunctionCallOutputItem = {
	type: "function_call_output";
	call_id: string;
	output: ResponsesInputContentItem[] | string;
};

type ResponsesCustomToolCallItem = {
	type: "custom_tool_call";
	id?: string;
	call_id: string;
	name: string;
	input: string;
	status: "completed";
};

type ResponsesCustomToolCallOutputItem = {
	type: "custom_tool_call_output";
	call_id: string;
	output: unknown;
};

type ResponsesReasoningItem = Record<string, unknown>;

type ResponsesImageGenerationCallItem = {
	type: "image_generation_call";
	id: string;
	status: string;
	result: string | null;
	revised_prompt?: string;
};

export type ResponsesInputItem =
	| ResponsesInputMessageItem
	| ResponsesAssistantOutputItem
	| ResponsesFunctionCallItem
	| ResponsesFunctionCallOutputItem
	| ResponsesCustomToolCallItem
	| ResponsesCustomToolCallOutputItem
	| ResponsesImageGenerationCallItem
	| ResponsesReasoningItem;

export type NativeCompactionRequestBody = {
	model: string;
	input: unknown[];
	instructions: string;
	tools?: unknown[];
	tool_choice?: unknown;
	parallel_tool_calls?: boolean;
	reasoning?: unknown;
	stream_options?: unknown;
	include?: string[];
	service_tier?: unknown;
	prompt_cache_key?: string;
	text?: unknown;
	client_metadata?: Record<string, unknown>;
};

type SerializeResponsesMessagesOptions = {
	instructions?: string;
	includeInstructionsInInput?: boolean;
};

type ResponsesParityReport = {
	ok: boolean;
	actual: string[];
	expected: string[];
	mismatches: string[];
};

const RESPONSES_TOOL_CALL_PROVIDERS = new Set(["openai", "openai-codex"]);

function sanitizeSurrogates(text: string): string {
	return text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}

function normalizeIdPart(part: string): string {
	const sanitized = part.replace(/[^a-zA-Z0-9_-]/g, "_");
	const normalized = sanitized.length > 64 ? sanitized.slice(0, 64) : sanitized;
	return normalized.replace(/_+$/, "");
}

function normalizeCustomToolCallItemId(itemId: string | undefined): string | undefined {
	if (!itemId) return undefined;
	const withoutFunctionPrefix = itemId.startsWith("fc_ctc_") ? itemId.slice("fc_".length) : itemId;
	const normalized = normalizeIdPart(withoutFunctionPrefix);
	return normalized.startsWith("ctc_") ? normalized : normalizeIdPart(`ctc_${normalized}`);
}

// Pi 0.84 derives this map from each tool's constrainedSampling schema. Compaction has no tool catalog,
// so the mapping is static. `exec` is the only grammar tool compaction sees.
function convertCodexGrammarToolItems(input: ResponsesInputItem[]): ResponsesInputItem[] {
	const inputProperties = new Map([["exec", "code"]]);
	const customToolCallIds = new Set<string>();
	return input.map((item) => {
		const candidate = item as {
			type?: string;
			id?: string;
			call_id?: string;
			name?: string;
			arguments?: string;
			output?: unknown;
		};
		if (
			candidate.type === "function_call" &&
			typeof candidate.call_id === "string" &&
			typeof candidate.name === "string" &&
			inputProperties.has(candidate.name)
		) {
			customToolCallIds.add(candidate.call_id);
			let inputValue = "";
			try {
				inputValue = JSON.parse(candidate.arguments || "{}")?.[inputProperties.get(candidate.name) as string] || "";
			} catch {
				inputValue = "";
			}
			return {
				type: "custom_tool_call",
				id: normalizeCustomToolCallItemId(candidate.id),
				call_id: candidate.call_id,
				name: candidate.name,
				input: inputValue,
				status: "completed",
			};
		}
		if (
			candidate.type === "function_call_output" &&
			typeof candidate.call_id === "string" &&
			customToolCallIds.has(candidate.call_id)
		) {
			return {
				type: "custom_tool_call_output",
				call_id: candidate.call_id,
				output: candidate.output,
			};
		}
		return item;
	});
}

function serializeWithProvider<TApi extends Api>(model: Model<TApi>, messages: Message[]): ResponsesInputItem[] {
	const providerInput = convertResponsesMessages(
		model,
		{ messages, systemPrompt: "" } as Context,
		RESPONSES_TOOL_CALL_PROVIDERS,
		{ includeSystemPrompt: false },
	) as unknown as ResponsesInputItem[];
	return model.provider === "openai-codex" ? convertCodexGrammarToolItems(providerInput) : providerInput;
}

export function serializeMessagesToCompactRequest<TApi extends Api>(args: {
	model: Model<TApi>;
	messages: AgentMessage[];
	instructions: string;
}): NativeCompactionRequestBody {
	return {
		model: args.model.id,
		input: serializeMessagesToResponsesInput(args.model, args.messages),
		instructions: sanitizeSurrogates(args.instructions),
	};
}

export function serializeMessagesToResponsesInput<TApi extends Api>(
	model: Model<TApi>,
	messages: AgentMessage[],
	options: SerializeResponsesMessagesOptions = {},
): ResponsesInputItem[] {
	const input = serializeWithProvider(model, convertToLlm(messages));
	if (!options.includeInstructionsInInput || !options.instructions) return input;
	return [
		{
			role: model.reasoning ? "developer" : "system",
			content: sanitizeSurrogates(options.instructions),
		},
		...input,
	];
}

export function createResponsesInputParitySignature(input: readonly unknown[]): string[] {
	return input.map(describeResponsesInputItem);
}

export function compareResponsesInputParity(
	actual: readonly unknown[],
	expected: readonly unknown[],
): ResponsesParityReport {
	const actualSignature = createResponsesInputParitySignature(actual);
	const expectedSignature = createResponsesInputParitySignature(expected);
	const maxLength = Math.max(actualSignature.length, expectedSignature.length);
	const mismatches: string[] = [];

	for (let index = 0; index < maxLength; index++) {
		const actualValue = actualSignature[index];
		const expectedValue = expectedSignature[index];
		if (actualValue !== expectedValue) {
			mismatches.push(`index ${index}: expected ${expectedValue ?? "<missing>"}, got ${actualValue ?? "<missing>"}`);
		}
	}

	return {
		ok: mismatches.length === 0,
		actual: actualSignature,
		expected: expectedSignature,
		mismatches,
	};
}

function describeResponsesInputItem(item: unknown): string {
	if (!item || typeof item !== "object" || Array.isArray(item)) {
		return typeof item;
	}

	const record = item as Record<string, unknown>;
	const type = typeof record.type === "string" ? record.type : undefined;
	if (type === "message") {
		const phase = record.phase === "commentary" || record.phase === "final_answer" ? `:${record.phase}` : "";
		return `message:${typeof record.role === "string" ? record.role : "unknown"}${phase}`;
	}

	if (type === "function_call" || type === "custom_tool_call") {
		return `${type}:${typeof record.name === "string" ? record.name : "unknown"}`;
	}

	if (type === "function_call_output" || type === "custom_tool_call_output") {
		return type;
	}

	if (type === "reasoning") {
		return "reasoning";
	}

	if (typeof record.role === "string") {
		const content = Array.isArray(record.content) ? `[${record.content.length}]` : "";
		return `input:${record.role}${content}`;
	}

	return type ? `item:${type}` : "object";
}
