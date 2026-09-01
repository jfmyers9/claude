import { afterEach, expect, mock, test } from "bun:test";
import * as os from "node:os";
import * as path from "node:path";
import { AUTO_COMPACT_STOP_MESSAGE } from "../../../auto-compact-resume";
import { createNativeCompactionDetails, DEFAULT_EXTENSION_SETTINGS, type ExtensionSettings } from "./types";

const compactionPhaseSetterKey = Symbol.for("agents.pi.compaction-phases.set");
const phaseGlobal = globalThis as typeof globalThis & {
	[compactionPhaseSetterKey]?: (
		phase: "summarizing",
		tokensBefore?: number,
		reason?: "manual" | "threshold" | "overflow",
	) => void;
};

type AssistantPhase = "commentary" | "final_answer";

type ToolCallBlock = {
	type: "toolCall";
	id: string;
	name: string;
	arguments: Record<string, unknown>;
};

type TextBlock = {
	type: "text";
	text: string;
	textSignature?: string;
};

type TestModel = {
	provider: string;
	api: string;
	id: string;
	baseUrl: string;
	input: string[];
	reasoning: boolean;
	thinkingLevelMap?: Partial<Record<string, string | null>>;
};

type TestSessionEntry = {
	type: "message" | "compaction";
	id: string;
	timestamp: string;
	message?: Record<string, unknown>;
	summary?: string;
	firstKeptEntryId?: string;
	tokensBefore?: number;
	details?: ReturnType<typeof createNativeCompactionDetails>;
};

type HookHandler = (event: unknown, ctx: unknown) => Promise<unknown>;

type CompactClientResult = {
	ok: true;
	status: number;
	compactedWindow: unknown[];
	compactResponseId?: string;
	createdAt?: string;
	estimatedTokensAfter?: number;
	response: {
		id?: string;
		created_at?: number | string;
		output: unknown[];
	};
};

type HookHarnessOptions = {
	compactResult?: CompactClientResult;
	settings?: Partial<ExtensionSettings>;
	thinkingLevel?: "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
};

const defaultModel: TestModel = {
	provider: "openai",
	api: "openai-responses",
	id: "gpt-5-mini",
	baseUrl: "https://api.openai.com/v1",
	input: ["text"],
	reasoning: true,
};

const TEST_NATIVE_COMPACTION_SUMMARY = "Prior native compaction summary.";
const COMPACTION_SUMMARY_PREFIX = `The conversation history before this point was compacted into the following summary:\n\n<summary>\n`;
const COMPACTION_SUMMARY_SUFFIX = `\n</summary>`;
const TEST_CONTEXT_DIR = path.join(os.tmpdir(), "openai-native-compaction-validation");

let serializerImportCounter = 0;
let timestampCounter = 0;

function registerPiCodingAgentMock(): void {
	mock.module("@earendil-works/pi-coding-agent", () => ({
		convertToLlm: (messages: Array<Record<string, unknown>>) =>
			messages
				.map((message) => {
					if (message.role === "compactionSummary") {
						return {
							role: "user",
							content: [
								{
									type: "text",
									text: `${COMPACTION_SUMMARY_PREFIX}${message.summary ?? ""}${COMPACTION_SUMMARY_SUFFIX}`,
								},
							],
							timestamp: message.timestamp,
						};
					}

					return message;
				})
				.filter(Boolean),
	}));
}

async function loadSerializerModule() {
	registerPiCodingAgentMock();
	return import(`./serializer.ts?validation=${serializerImportCounter++}`);
}

async function serializeResponsesInput(model: TestModel, messages: Record<string, unknown>[]): Promise<unknown[]> {
	const { serializeMessagesToResponsesInput } = await loadSerializerModule();
	return serializeMessagesToResponsesInput(model as never, messages as never);
}

async function createInputParitySignature(input: readonly unknown[]): Promise<string[]> {
	const { createResponsesInputParitySignature } = await loadSerializerModule();
	return createResponsesInputParitySignature(input);
}

function nextTimestamp(): string {
	const timestamp = new Date(Date.UTC(2026, 2, 20, 12, 0, timestampCounter)).toISOString();
	timestampCounter += 1;
	return timestamp;
}

function createTextBlock(text: string, phase?: AssistantPhase, id = `msg_${timestampCounter}`): TextBlock {
	return {
		type: "text",
		text,
		...(phase
			? {
					textSignature: JSON.stringify({
						v: 1,
						id,
						phase,
					}),
				}
			: {}),
	};
}

function createToolCallBlock(
	callId: string,
	name: string,
	argumentsObject: Record<string, unknown>,
	itemId = `fc_${callId}`,
): ToolCallBlock {
	return {
		type: "toolCall",
		id: `${callId}|${itemId}`,
		name,
		arguments: argumentsObject,
	};
}

function createUserEntry(id: string, text: string): TestSessionEntry {
	return {
		type: "message",
		id,
		timestamp: nextTimestamp(),
		message: {
			role: "user",
			content: [{ type: "text", text }],
			timestamp: Date.now(),
		},
	};
}

function createAssistantEntry(
	id: string,
	blocks: Array<TextBlock | ToolCallBlock>,
	model: TestModel = defaultModel,
	stopReason: string = "stop",
): TestSessionEntry {
	return {
		type: "message",
		id,
		timestamp: nextTimestamp(),
		message: {
			role: "assistant",
			provider: model.provider,
			api: model.api,
			model: model.id,
			stopReason,
			content: blocks,
			timestamp: Date.now(),
		},
	};
}

function createToolResultEntry(id: string, toolCallId: string, toolName: string, text: string): TestSessionEntry {
	return {
		type: "message",
		id,
		timestamp: nextTimestamp(),
		message: {
			role: "toolResult",
			toolCallId,
			toolName,
			isError: false,
			content: [{ type: "text", text }],
			timestamp: Date.now(),
		},
	};
}

function createCompactionEntry(args: {
	id: string;
	firstKeptEntryId: string;
	tokensBefore?: number;
	model?: TestModel;
	compactedWindow: unknown[];
	compactResponseId?: string;
}): TestSessionEntry {
	const model = args.model ?? defaultModel;
	return {
		type: "compaction",
		id: args.id,
		timestamp: nextTimestamp(),
		summary: TEST_NATIVE_COMPACTION_SUMMARY,
		firstKeptEntryId: args.firstKeptEntryId,
		tokensBefore: args.tokensBefore ?? 256,
		details: createNativeCompactionDetails({
			provider: model.provider,
			api: model.api,
			model: model.id,
			baseUrl: model.baseUrl,
			compactedWindow: args.compactedWindow,
			compactResponseId: args.compactResponseId,
			createdAt: nextTimestamp(),
		}),
	};
}

function createCompactionSummaryMessage(entry: TestSessionEntry): Record<string, unknown> {
	return {
		role: "compactionSummary",
		summary: entry.summary,
		tokensBefore: entry.tokensBefore,
		timestamp: new Date(entry.timestamp).getTime(),
	};
}

function toReplayMessage(entry: TestSessionEntry): Record<string, unknown> {
	if (entry.type !== "message" || !entry.message) {
		throw new Error(`Expected message entry, got ${entry.type}`);
	}
	return entry.message;
}

async function buildPiReplayPayload(args: {
	model?: TestModel;
	branchEntries: TestSessionEntry[];
	compactionEntry: TestSessionEntry;
	instructions: string;
	freshPreamble: string;
	trailingPreamble?: string[];
}): Promise<{
	model: string;
	instructions: string;
	input: unknown[];
}> {
	const model = args.model ?? defaultModel;
	const boundaryIndex = args.branchEntries.findIndex((entry) => entry.id === args.compactionEntry.id);
	if (boundaryIndex < 0) {
		throw new Error(`Missing compaction entry ${args.compactionEntry.id}`);
	}

	const firstKeptEntryIndex = args.branchEntries.findIndex(
		(entry, index) => index < boundaryIndex && entry.id === args.compactionEntry.firstKeptEntryId,
	);
	if (firstKeptEntryIndex < 0) {
		throw new Error(`Missing first-kept entry ${args.compactionEntry.firstKeptEntryId}`);
	}

	const preCompactionEntries = args.branchEntries.slice(firstKeptEntryIndex, boundaryIndex);
	const postCompactionEntries = args.branchEntries.slice(boundaryIndex + 1);
	const piReplayMessages = [
		createCompactionSummaryMessage(args.compactionEntry),
		...preCompactionEntries.map(toReplayMessage),
		...postCompactionEntries.map(toReplayMessage),
	];

	return {
		model: model.id,
		instructions: args.instructions,
		input: [
			{
				role: model.reasoning ? "developer" : "system",
				content: args.freshPreamble,
			},
			...(await serializeResponsesInput(model, piReplayMessages)),
			...(args.trailingPreamble ?? []).map((text) => ({
				role: "developer",
				content: [{ type: "input_text", text }],
			})),
		],
	};
}

function createContext(
	args: {
		branchEntries?: TestSessionEntry[];
		model?: TestModel;
		systemPrompt?: string;
		sessionContextMessages?: Record<string, unknown>[];
		uiNotifications?: string[];
	} = {},
) {
	const branchEntries = args.branchEntries ?? [];
	const model = args.model ?? defaultModel;
	const sessionContextMessages =
		args.sessionContextMessages ?? branchEntries.filter((entry) => entry.type === "message").map(toReplayMessage);
	return {
		cwd: TEST_CONTEXT_DIR,
		hasUI: args.uiNotifications !== undefined,
		...(args.uiNotifications === undefined
			? {}
			: { ui: { notify: (message: string) => args.uiNotifications?.push(message) } }),
		getSystemPrompt: () => args.systemPrompt ?? "Current instructions v1",
		model,
		modelRegistry: {
			getApiKeyAndHeaders: async () => ({
				ok: true,
				apiKey: "sk-test-native-compaction",
			}),
		},
		sessionManager: {
			getBranch: () => branchEntries,
			buildSessionContext: () => ({
				messages: sessionContextMessages,
				thinkingLevel: "off",
				model: null,
			}),
			getSessionId: () => "session-validation",
			getSessionFile: () => path.join(TEST_CONTEXT_DIR, "session.json"),
			getSessionDir: () => TEST_CONTEXT_DIR,
		},
	};
}

async function loadHookHarness(options: HookHarnessOptions = {}): Promise<{
	sessionBeforeCompact: HookHandler;
	beforeProviderRequest: HookHandler;
	compactCalls: Array<Record<string, unknown>>;
}> {
	const compactCalls: Array<Record<string, unknown>> = [];

	registerPiCodingAgentMock();

	mock.module("./settings", () => ({
		loadExtensionSettings: () => ({
			settings: {
				...DEFAULT_EXTENSION_SETTINGS,
				...(options.settings ?? {}),
			},
			sources: [],
			warnings: [],
		}),
	}));

	mock.module("./compact-client", () => ({
		executeNativeCompaction: async (args: Record<string, unknown>) => {
			compactCalls.push(args);
			return (
				options.compactResult ?? {
					ok: true,
					status: 200,
					compactedWindow: [
						{
							type: "message",
							role: "assistant",
							status: "completed",
							id: "cmp_default",
							content: [],
						},
					],
					compactResponseId: "resp_default",
					createdAt: nextTimestamp(),
					response: {
						id: "resp_default",
						created_at: nextTimestamp(),
						output: [
							{
								type: "message",
								role: "assistant",
								status: "completed",
								id: "cmp_default",
								content: [],
							},
						],
					},
				}
			);
		},
	}));

	const handlers = new Map<string, HookHandler>();
	const { default: extension } = await import(`./extension-runtime.ts?test=${crypto.randomUUID()}`);
	extension({
		getActiveTools: () => ["read"],
		getAllTools: () => [
			{
				name: "read",
				description: "Read a file.",
				parameters: { type: "object", properties: { path: { type: "string" } } },
				promptGuidelines: undefined,
				sourceInfo: { type: "extension", path: "test" },
			},
		],
		getThinkingLevel: () => options.thinkingLevel ?? "high",
		on: (eventName: string, handler: HookHandler) => {
			handlers.set(eventName, handler);
		},
	} as never);

	const sessionBeforeCompact = handlers.get("session_before_compact");
	const beforeProviderRequest = handlers.get("before_provider_request");
	if (!sessionBeforeCompact || !beforeProviderRequest) {
		throw new Error("Expected openai-native-compaction callbacks to register");
	}

	return {
		sessionBeforeCompact,
		beforeProviderRequest,
		compactCalls,
	};
}

afterEach(() => {
	serializerImportCounter = 0;
	timestampCounter = 0;
	delete phaseGlobal[compactionPhaseSetterKey];
	mock.restore();
});

test("manual /compact preserves tool/result ordering + assistant phases and persists the native shim", async () => {
	const compactedWindow = [
		{
			type: "message",
			role: "assistant",
			status: "completed",
			id: "cmp_1",
			phase: "commentary",
			content: [],
		},
	];
	const phaseCalls: Array<[string, number | undefined, string | undefined]> = [];
	phaseGlobal[compactionPhaseSetterKey] = (phase, tokensBefore, reason) =>
		phaseCalls.push([phase, tokensBefore, reason]);
	const { sessionBeforeCompact, compactCalls } = await loadHookHarness({
		compactResult: {
			ok: true,
			status: 200,
			compactedWindow,
			compactResponseId: "resp_manual",
			createdAt: nextTimestamp(),
			estimatedTokensAfter: 96,
			response: {
				id: "resp_manual",
				created_at: nextTimestamp(),
				output: compactedWindow,
			},
		},
	});
	const model = { ...defaultModel };
	const toolCall = createToolCallBlock("call_docs", "search_docs", { query: "weekly release status" }, "fc_docs");
	const user = createUserEntry("entry_user", "Check the weekly release status.");
	const assistantCommentary = createAssistantEntry(
		"entry_assistant_commentary",
		[createTextBlock("Checking the docs first.", "commentary", "msg_commentary"), toolCall],
		model,
		"toolUse",
	);
	const toolResult = createToolResultEntry("entry_tool_result", toolCall.id, toolCall.name, "Release notes say green.");
	const assistantFinal = createAssistantEntry(
		"entry_assistant_final",
		[createTextBlock("The release is green.", "final_answer", "msg_final")],
		model,
		"stop",
	);
	const event = {
		signal: new AbortController().signal,
		customInstructions: undefined,
		reason: "manual" as const,
		preparation: {
			tokensBefore: 512,
			firstKeptEntryId: user.id,
			previousSummary: undefined,
			messagesToSummarize: [
				toReplayMessage(user),
				toReplayMessage(assistantCommentary),
				toReplayMessage(toolResult),
				toReplayMessage(assistantFinal),
			],
			turnPrefixMessages: [],
		},
	};
	const result = (await sessionBeforeCompact(
		event,
		createContext({
			model,
			systemPrompt: "Current instructions v1",
			sessionContextMessages: event.preparation.messagesToSummarize as Record<string, unknown>[],
		}),
	)) as {
		compaction: Record<string, unknown>;
	};

	expect(compactCalls).toHaveLength(1);
	const compactRequest = compactCalls[0]?.request as {
		model: string;
		instructions: string;
		input: unknown[];
	};
	expect(compactRequest.model).toBe(model.id);
	expect(compactRequest.instructions).toBe("Current instructions v1");
	expect(await createInputParitySignature(compactRequest.input)).toEqual([
		"input:user[1]",
		"message:assistant:commentary",
		"function_call:search_docs",
		"function_call_output",
		"message:assistant:final_answer",
	]);
	expect(result.compaction.summary).toContain("Native compaction completed.");
	expect(result.compaction.summary).toContain("Compacted 4 messages across 1 user turns from 512 tokens.");
	expect(result.compaction.summary).toContain("Last user request: Check the weekly release status.");
	expect(result.compaction.firstKeptEntryId).toBe(user.id);
	expect(result.compaction.tokensBefore).toBe(512);
	expect((result.compaction.details as { compactedWindow: unknown[] }).compactedWindow).toEqual(compactedWindow);
	expect(phaseCalls[0]).toEqual(["summarizing", 512, "manual"]);
	expect((result.compaction.details as { requestMeta: { tokensAfter?: number } }).requestMeta.tokensAfter).toBe(96);
});

test("V2 compaction reuses current request controls and marks Codex compaction metadata", async () => {
	const { sessionBeforeCompact, beforeProviderRequest, compactCalls } = await loadHookHarness();
	const model = {
		...defaultModel,
		provider: "openai-codex",
		api: "openai-codex-responses",
		baseUrl: "https://chatgpt.com/backend-api",
	};
	const user = createUserEntry("metadata_user", "Preserve current request controls.");
	const context = createContext({
		model,
		branchEntries: [user],
		sessionContextMessages: [toReplayMessage(user)],
	});

	await beforeProviderRequest(
		{
			payload: {
				model: model.id,
				input: [],
				instructions: "Current instructions v1",
				tools: [{ type: "function", name: "read" }],
				tool_choice: "auto",
				parallel_tool_calls: true,
				reasoning: { effort: "high", summary: "auto" },
				include: ["custom.include"],
				prompt_cache_key: "cache-key",
				client_metadata: {
					session_id: "session-validation",
					thread_id: "thread-validation",
					"x-codex-window-id": "window-current",
					"x-codex-turn-metadata": JSON.stringify({
						session_id: "session-validation",
						request_kind: "turn",
					}),
				},
			},
		},
		context,
	);

	await sessionBeforeCompact(
		{
			signal: new AbortController().signal,
			reason: "overflow",
			willRetry: true,
			customInstructions: undefined,
			preparation: {
				tokensBefore: 512,
				firstKeptEntryId: user.id,
				previousSummary: undefined,
				messagesToSummarize: [toReplayMessage(user)],
				turnPrefixMessages: [],
			},
		},
		context,
	);

	const request = compactCalls[0]?.request as Record<string, unknown>;
	expect(request.tools).toEqual([{ type: "function", name: "read" }]);
	expect(request.parallel_tool_calls).toBe(true);
	expect(request.reasoning).toEqual({ effort: "high", summary: "auto" });
	expect(request.include).toEqual(["custom.include", "reasoning.encrypted_content"]);
	expect(request.prompt_cache_key).toBe("cache-key");
	const clientMetadata = request.client_metadata as Record<string, unknown>;
	expect(clientMetadata.session_id).toBe("session-validation");
	expect(clientMetadata["x-codex-window-id"]).toBe("window-current");
	const turnMetadata = JSON.parse(String(clientMetadata["x-codex-turn-metadata"]));
	expect(turnMetadata).toMatchObject({
		session_id: "session-validation",
		request_kind: "compaction",
		compaction: {
			trigger: "auto",
			reason: "context_limit",
			implementation: "responses_compaction_v2",
			phase: "mid_turn",
			strategy: "memento",
		},
	});
});

test("V2 compaction rebuilds controls and session metadata without a cached provider request", async () => {
	const { sessionBeforeCompact, compactCalls } = await loadHookHarness();
	const model = {
		...defaultModel,
		provider: "openai-codex",
		api: "openai-codex-responses",
		baseUrl: "https://chatgpt.com/backend-api",
		thinkingLevelMap: { high: "medium" },
	};
	const user = createUserEntry("resume_user", "Compact immediately after resume.");
	const context = createContext({
		model,
		branchEntries: [user],
		sessionContextMessages: [toReplayMessage(user)],
	});

	await sessionBeforeCompact(
		{
			signal: new AbortController().signal,
			willRetry: false,
			customInstructions: undefined,
			preparation: {
				tokensBefore: 256,
				firstKeptEntryId: user.id,
				previousSummary: undefined,
				messagesToSummarize: [toReplayMessage(user)],
				turnPrefixMessages: [],
			},
		},
		context,
	);

	const request = compactCalls[0]?.request as Record<string, unknown>;
	expect(request.tools).toEqual([
		{
			type: "function",
			name: "read",
			description: "Read a file.",
			parameters: { type: "object", properties: { path: { type: "string" } } },
			strict: false,
		},
	]);
	expect(request.reasoning).toEqual({ effort: "medium", summary: "auto" });
	expect(request.parallel_tool_calls).toBe(true);
	const clientMetadata = request.client_metadata as Record<string, unknown>;
	expect(clientMetadata).toMatchObject({
		session_id: "session-validation",
		thread_id: "session-validation",
		"x-codex-window-id": "session-validation",
	});
	expect(typeof clientMetadata.turn_id).toBe("string");
	const turnMetadata = JSON.parse(String(clientMetadata["x-codex-turn-metadata"]));
	expect(turnMetadata).toMatchObject({
		session_id: "session-validation",
		thread_id: "session-validation",
		window_id: "session-validation",
		request_kind: "compaction",
		turn_id: clientMetadata.turn_id,
	});
});

test("V2 fallback omits reasoning when current thinking level resolves to off", async () => {
	const { sessionBeforeCompact, compactCalls } = await loadHookHarness({ thinkingLevel: "off" });
	const user = createUserEntry("thinking_off_user", "Do not request reasoning.");
	const context = createContext({
		branchEntries: [user],
		sessionContextMessages: [toReplayMessage(user)],
	});

	await sessionBeforeCompact(
		{
			signal: new AbortController().signal,
			reason: "manual",
			willRetry: false,
			customInstructions: undefined,
			preparation: {
				tokensBefore: 256,
				firstKeptEntryId: user.id,
				previousSummary: undefined,
				messagesToSummarize: [toReplayMessage(user)],
				turnPrefixMessages: [],
			},
		},
		context,
	);

	const request = compactCalls[0]?.request as Record<string, unknown>;
	expect(request.reasoning).toBeUndefined();
});

test("V2 fallback clamps a null-mapped thinking level to the nearest supported level", async () => {
	const { sessionBeforeCompact, compactCalls } = await loadHookHarness();
	const user = createUserEntry("thinking_null_user", "Use model thinking map.");
	const context = createContext({
		model: { ...defaultModel, thinkingLevelMap: { high: null } },
		branchEntries: [user],
		sessionContextMessages: [toReplayMessage(user)],
	});

	await sessionBeforeCompact(
		{
			signal: new AbortController().signal,
			reason: "manual",
			willRetry: false,
			customInstructions: undefined,
			preparation: {
				tokensBefore: 256,
				firstKeptEntryId: user.id,
				previousSummary: undefined,
				messagesToSummarize: [toReplayMessage(user)],
				turnPrefixMessages: [],
			},
		},
		context,
	);

	const request = compactCalls[0]?.request as Record<string, unknown>;
	expect(request.reasoning).toEqual({ effort: "medium", summary: "auto" });
});

test("V2 compaction ignores cached request controls after a model switch", async () => {
	const { sessionBeforeCompact, beforeProviderRequest, compactCalls } = await loadHookHarness();
	const oldModel = { ...defaultModel };
	const user = createUserEntry("model_switch_user", "Use current model controls.");
	const context = createContext({
		model: oldModel,
		branchEntries: [user],
		sessionContextMessages: [toReplayMessage(user)],
	});
	await beforeProviderRequest(
		{
			payload: {
				model: oldModel.id,
				input: [],
				tools: [{ type: "function", name: "stale_tool" }],
				reasoning: { effort: "low" },
			},
		},
		context,
	);
	context.model = { ...oldModel, id: "gpt-5-current", name: "gpt-5-current" } as never;

	await sessionBeforeCompact(
		{
			signal: new AbortController().signal,
			reason: "manual",
			willRetry: false,
			customInstructions: undefined,
			preparation: {
				tokensBefore: 256,
				firstKeptEntryId: user.id,
				previousSummary: undefined,
				messagesToSummarize: [toReplayMessage(user)],
				turnPrefixMessages: [],
			},
		},
		context,
	);

	const request = compactCalls[0]?.request as Record<string, unknown>;
	expect(JSON.stringify(request.tools)).not.toContain("stale_tool");
	expect(JSON.stringify(request.tools)).toContain('"read"');
	expect(request.reasoning).toEqual({ effort: "high", summary: "auto" });
});

test("first native compaction sends the full current session context, including Pi's kept recent window", async () => {
	const { sessionBeforeCompact, compactCalls } = await loadHookHarness();
	const model = { ...defaultModel };
	const summarizedUser = createUserEntry("summarized_user", "Older context slated for summarization.");
	const keptUser = createUserEntry("kept_recent_user", "Recent kept window context that must also be compacted.");
	const event = {
		signal: new AbortController().signal,
		customInstructions: undefined,
		preparation: {
			tokensBefore: 384,
			firstKeptEntryId: keptUser.id,
			previousSummary: undefined,
			messagesToSummarize: [toReplayMessage(summarizedUser)],
			turnPrefixMessages: [],
		},
	};

	await sessionBeforeCompact(
		event,
		createContext({
			model,
			systemPrompt: "Current instructions include the kept window too",
			sessionContextMessages: [
				toReplayMessage(summarizedUser),
				toReplayMessage(keptUser),
				{ role: "custom", customType: "image-attach-preview", content: "display only", display: true },
			],
		}),
	);

	const compactRequest = compactCalls[0]?.request as {
		model: string;
		instructions: string;
		input: unknown[];
	};
	expect(compactRequest.model).toBe(model.id);
	expect(compactRequest.instructions).toBe("Current instructions include the kept window too");
	expect(await createInputParitySignature(compactRequest.input)).toEqual(["input:user[1]", "input:user[1]"]);
	expect(JSON.stringify(compactRequest.input)).toContain("Recent kept window context that must also be compacted.");
	expect(JSON.stringify(compactRequest.input)).not.toContain("display only");
});

test("repeated native compaction reuses the latest stored compacted window instead of Pi's shim summary", async () => {
	const { sessionBeforeCompact, compactCalls } = await loadHookHarness();
	const model = { ...defaultModel };
	const oldKeptUser = createUserEntry("old_kept_user", "Original context before native compaction.");
	const compactedWindow = [
		{
			type: "message",
			role: "assistant",
			status: "completed",
			id: "cmp_repeat",
			phase: "commentary",
			content: [
				{
					type: "output_text",
					text: "Opaque compacted window",
					annotations: [],
				},
			],
		},
	];
	const priorCompaction = createCompactionEntry({
		id: "compaction_repeat",
		firstKeptEntryId: oldKeptUser.id,
		model,
		compactedWindow,
		compactResponseId: "resp_repeat",
	});
	const tailUser = createUserEntry("repeat_tail_user", "New follow-up after the earlier native compaction.");
	const tailAssistant = createAssistantEntry(
		"repeat_tail_assistant",
		[createTextBlock("Follow-up answer after the earlier native compaction.", "final_answer", "msg_repeat_tail")],
		model,
		"stop",
	);
	const event = {
		signal: new AbortController().signal,
		customInstructions: undefined,
		preparation: {
			tokensBefore: 640,
			firstKeptEntryId: tailUser.id,
			previousSummary: TEST_NATIVE_COMPACTION_SUMMARY,
			messagesToSummarize: [],
			turnPrefixMessages: [],
		},
	};

	await sessionBeforeCompact(
		event,
		createContext({
			branchEntries: [oldKeptUser, priorCompaction, tailUser, tailAssistant],
			model,
			systemPrompt: "Current instructions v-repeat",
			sessionContextMessages: [
				createCompactionSummaryMessage(priorCompaction),
				toReplayMessage(oldKeptUser),
				toReplayMessage(tailUser),
				toReplayMessage(tailAssistant),
			],
		}),
	);

	const compactRequest = compactCalls[0]?.request as {
		model: string;
		instructions: string;
		input: unknown[];
	};
	const expectedTail = await serializeResponsesInput(model, [
		toReplayMessage(tailUser),
		toReplayMessage(tailAssistant),
	]);
	expect(compactRequest.instructions).toBe("Current instructions v-repeat");
	expect(compactRequest.input).toEqual([...compactedWindow, ...expectedTail]);
	expect(JSON.stringify(compactRequest.input)).toContain("Opaque compacted window");
	expect(JSON.stringify(compactRequest.input)).not.toContain(
		"The conversation history before this point was compacted",
	);
	expect(JSON.stringify(compactRequest.input)).not.toContain("Original context before native compaction.");
});

test("session_before_compact migrates a non-native checkpoint into native compaction", async () => {
	const { sessionBeforeCompact, compactCalls } = await loadHookHarness();
	const model = { ...defaultModel };
	const olderUser = createUserEntry("older_non_native_user", "Context from before a non-native compaction.");
	const nonNativeCompaction: TestSessionEntry = {
		type: "compaction",
		id: "non_native_compaction",
		timestamp: nextTimestamp(),
		summary: "Legacy Pi summary",
		firstKeptEntryId: olderUser.id,
		tokensBefore: 512,
	};
	const currentUser = createUserEntry("current_after_non_native", "Current context after a non-native compaction.");
	const event = {
		signal: new AbortController().signal,
		customInstructions: undefined,
		reason: "threshold" as const,
		preparation: {
			tokensBefore: 768,
			firstKeptEntryId: currentUser.id,
			previousSummary: "Legacy Pi summary",
			messagesToSummarize: [],
			turnPrefixMessages: [],
		},
	};

	const result = await sessionBeforeCompact(
		event,
		createContext({
			branchEntries: [olderUser, nonNativeCompaction, currentUser],
			model,
			systemPrompt: "Current instructions after a non-native compaction",
			sessionContextMessages: [
				createCompactionSummaryMessage(nonNativeCompaction),
				toReplayMessage(olderUser),
				toReplayMessage(currentUser),
			],
		}),
	);

	expect(result).toMatchObject({ compaction: { tokensBefore: 768 } });
	expect(compactCalls).toHaveLength(1);
	const compactRequest = compactCalls[0]?.request as { input: unknown[] };
	expect(JSON.stringify(compactRequest.input)).toContain("Legacy Pi summary");
	expect(JSON.stringify(compactRequest.input)).toContain("Current context after a non-native compaction.");
});

test("first post-compaction turn rewrites to fresh preamble + opaque compacted window + live tail without duplication", async () => {
	const { beforeProviderRequest } = await loadHookHarness();
	const model = { ...defaultModel };
	const keptUser = createUserEntry("kept_user", "Old user context that Pi should stop duplicating.");
	const keptAssistant = createAssistantEntry(
		"kept_assistant",
		[createTextBlock("Old assistant context that should disappear after native replay.", "commentary", "msg_kept")],
		model,
	);
	const compactedWindow = [
		{
			type: "message",
			role: "assistant",
			status: "completed",
			id: "cmp_commentary",
			phase: "commentary",
			content: [],
		},
		{
			type: "function_call",
			id: "fc_weather",
			call_id: "call_weather",
			name: "weather_lookup",
			arguments: '{"city":"Berlin"}',
		},
		{
			type: "function_call_output",
			call_id: "call_weather",
			output: "18°C and sunny",
		},
	];
	const compactionEntry = createCompactionEntry({
		id: "compaction_1",
		firstKeptEntryId: keptUser.id,
		model,
		compactedWindow,
		compactResponseId: "resp_first_turn",
	});
	const currentUser = createUserEntry("post_compaction_user", "Now summarize only the deploy risk.");
	const branchEntries = [keptUser, keptAssistant, compactionEntry, currentUser];
	const payload = await buildPiReplayPayload({
		model,
		branchEntries,
		compactionEntry,
		instructions: "Current instructions v2",
		freshPreamble: "Fresh preamble v2",
	});
	const rewritten = (await beforeProviderRequest(
		{ payload },
		createContext({ branchEntries, model, systemPrompt: payload.instructions }),
	)) as { input: unknown[]; instructions: string };
	const expectedTail = await serializeResponsesInput(model, [toReplayMessage(currentUser)]);
	const expectedInput = [payload.input[0], ...compactedWindow, ...expectedTail];

	expect(rewritten.instructions).toBe("Current instructions v2");
	expect(rewritten.input).toEqual(expectedInput);
	expect(JSON.stringify(rewritten.input)).not.toContain("Old user context that Pi should stop duplicating.");
	expect(JSON.stringify(rewritten.input)).not.toContain(
		"Old assistant context that should disappear after native replay.",
	);
	expect(JSON.stringify(rewritten.input)).not.toContain("The conversation history before this point was compacted");
});

test("transient context messages and trailing provider prompts survive native replay in place", async () => {
	const { beforeProviderRequest } = await loadHookHarness();
	const model = { ...defaultModel, reasoning: true };
	const keptUser = createUserEntry("kept_for_trailing_prompt", "Older replay context that should disappear.");
	const compactedWindow = [
		{
			type: "compaction",
			encrypted_content: "opaque-compact-window",
		},
	];
	const compactionEntry = createCompactionEntry({
		id: "compaction_with_trailing_prompt",
		firstKeptEntryId: keptUser.id,
		model,
		compactedWindow,
	});
	const currentUser = createUserEntry("trailing_prompt_user", "Continue with the trailing developer hint preserved.");
	const branchEntries = [keptUser, compactionEntry, currentUser];
	const payload = await buildPiReplayPayload({
		model,
		branchEntries,
		compactionEntry,
		instructions: "Current instructions with trailing provider hint",
		freshPreamble: "Fresh preamble before replay",
		trailingPreamble: ["# Juice: 0 !important"],
	});
	const transientContextMessage = {
		role: "user",
		content: [{ type: "input_text", text: AUTO_COMPACT_STOP_MESSAGE }],
	};
	payload.input.splice(payload.input.length - 1, 0, transientContextMessage);
	const rewritten = (await beforeProviderRequest(
		{ payload },
		createContext({ branchEntries, model, systemPrompt: payload.instructions }),
	)) as { input: unknown[]; instructions: string };
	const expectedTail = await serializeResponsesInput(model, [toReplayMessage(currentUser)]);
	const trailingPrompt = payload.input[payload.input.length - 1];

	expect(rewritten.instructions).toBe("Current instructions with trailing provider hint");
	expect(rewritten.input).toEqual([
		payload.input[0],
		...compactedWindow,
		...expectedTail,
		transientContextMessage,
		trailingPrompt,
	]);
	expect(rewritten.input[rewritten.input.length - 1]).toEqual(trailingPrompt);
});

test("multi-turn follow-up survives restart/resume while preserving tool/result pairing and assistant phases", async () => {
	const model = { ...defaultModel };
	const keptUser = createUserEntry("resume_kept_user", "Remember the earlier migration context.");
	const compactedWindow = [
		{
			type: "message",
			role: "assistant",
			status: "completed",
			id: "cmp_resume",
			phase: "commentary",
			content: [
				{
					type: "output_text",
					text: "Compacted reasoning survives here.",
					annotations: [],
				},
			],
		},
	];
	const compactionEntry = createCompactionEntry({
		id: "resume_compaction",
		firstKeptEntryId: keptUser.id,
		model,
		compactedWindow,
		compactResponseId: "resp_resume",
	});
	const reviewCall = createToolCallBlock(
		"call_review",
		"review_branch",
		{ branch: "feature/native-compaction" },
		"fc_review",
	);
	const tailUser = createUserEntry("resume_tail_user", "Review the branch and call out risks.");
	const tailAssistantCommentary = createAssistantEntry(
		"resume_tail_assistant_commentary",
		[createTextBlock("Reviewing the branch now.", "commentary", "msg_tail_commentary"), reviewCall],
		model,
		"toolUse",
	);
	const tailToolResult = createToolResultEntry(
		"resume_tail_tool_result",
		reviewCall.id,
		reviewCall.name,
		"Found one medium-severity risk.",
	);
	const tailAssistantFinal = createAssistantEntry(
		"resume_tail_assistant_final",
		[createTextBlock("The main risk is stale replay state.", "final_answer", "msg_tail_final")],
		model,
	);
	const currentUser = createUserEntry("resume_current_user", "Which regression should I test first?");
	const branchEntries = [
		keptUser,
		compactionEntry,
		tailUser,
		tailAssistantCommentary,
		tailToolResult,
		tailAssistantFinal,
		currentUser,
	];
	const payload = await buildPiReplayPayload({
		model,
		branchEntries,
		compactionEntry,
		instructions: "Current instructions after restart",
		freshPreamble: "Fresh preamble after restart",
	});
	const firstHarness = await loadHookHarness();
	const resumedHarness = await loadHookHarness();
	const firstRewrite = (await firstHarness.beforeProviderRequest(
		{ payload },
		createContext({ branchEntries, model, systemPrompt: payload.instructions }),
	)) as { input: unknown[]; instructions: string };
	const resumedRewrite = (await resumedHarness.beforeProviderRequest(
		{ payload },
		createContext({ branchEntries, model, systemPrompt: payload.instructions }),
	)) as { input: unknown[]; instructions: string };
	const parity = await createInputParitySignature(firstRewrite.input);

	expect(resumedRewrite).toEqual(firstRewrite);
	expect(firstRewrite.instructions).toBe("Current instructions after restart");
	expect(parity).toEqual([
		"input:developer",
		"message:assistant:commentary",
		"input:user[1]",
		"message:assistant:commentary",
		"function_call:review_branch",
		"function_call_output",
		"message:assistant:final_answer",
		"input:user[1]",
	]);
});

test("a second compaction replays only the latest compacted window and keeps fresh instructions authoritative", async () => {
	const { beforeProviderRequest } = await loadHookHarness();
	const model = { ...defaultModel };
	const initialKeptUser = createUserEntry("initial_kept_user", "Initial context before the first compaction.");
	const firstCompaction = createCompactionEntry({
		id: "compaction_first",
		firstKeptEntryId: initialKeptUser.id,
		model,
		compactedWindow: [
			{
				type: "message",
				role: "assistant",
				status: "completed",
				id: "cmp_first",
				phase: "commentary",
				content: [
					{
						type: "output_text",
						text: "First compaction window",
						annotations: [],
					},
				],
			},
		],
	});
	const interimUser = createUserEntry("interim_user", "Interim question between compactions.");
	const interimAssistant = createAssistantEntry(
		"interim_assistant",
		[createTextBlock("Interim answer between compactions.", "final_answer", "msg_interim")],
		model,
	);
	const secondCompactionWindow = [
		{
			type: "message",
			role: "assistant",
			status: "completed",
			id: "cmp_second",
			phase: "commentary",
			content: [
				{
					type: "output_text",
					text: "Second compaction window",
					annotations: [],
				},
			],
		},
	];
	const secondCompaction = createCompactionEntry({
		id: "compaction_second",
		firstKeptEntryId: interimUser.id,
		model,
		compactedWindow: secondCompactionWindow,
	});
	const currentUser = createUserEntry("post_second_compaction_user", "What changed after the second compaction?");
	const branchEntries = [
		initialKeptUser,
		firstCompaction,
		interimUser,
		interimAssistant,
		secondCompaction,
		currentUser,
	];
	const payload = await buildPiReplayPayload({
		model,
		branchEntries,
		compactionEntry: secondCompaction,
		instructions: "Newest instructions win",
		freshPreamble: "Newest preamble wins too",
	});
	const rewritten = (await beforeProviderRequest(
		{ payload },
		createContext({ branchEntries, model, systemPrompt: payload.instructions }),
	)) as { input: unknown[]; instructions: string };

	expect(rewritten.instructions).toBe("Newest instructions win");
	expect(rewritten.input).toEqual([
		payload.input[0],
		...secondCompactionWindow,
		...(await serializeResponsesInput(model, [toReplayMessage(currentUser)])),
	]);
	expect(JSON.stringify(rewritten.input)).toContain("Second compaction window");
	expect(JSON.stringify(rewritten.input)).not.toContain("First compaction window");
	expect(JSON.stringify(rewritten.input)).not.toContain("Interim question between compactions.");
});

test("a same-provider model switch keeps replaying the native window and a provider switch invalidates it", async () => {
	const { beforeProviderRequest } = await loadHookHarness();
	const compactionModel = { ...defaultModel };
	const sameProviderModel = {
		...defaultModel,
		id: "gpt-5-nano",
	};
	const switchedProviderModel = {
		...defaultModel,
		provider: "openai-codex",
		api: "openai-codex-responses",
		baseUrl: "https://chatgpt.com/backend-api",
		id: "gpt-5-codex",
	};
	const keptUser = createUserEntry("switch_kept_user", "Original context before switching models.");
	const compactedWindow = [
		{
			type: "message",
			role: "assistant",
			status: "completed",
			id: "cmp_window",
			content: [],
		},
	];
	const compactionEntry = createCompactionEntry({
		id: "switch_compaction",
		firstKeptEntryId: keptUser.id,
		model: compactionModel,
		compactedWindow,
	});
	const currentUser = createUserEntry("switch_current_user", "Question asked after the model switch.");
	const branchEntries = [keptUser, compactionEntry, currentUser];

	const sameProviderPayload = await buildPiReplayPayload({
		model: sameProviderModel,
		branchEntries,
		compactionEntry,
		instructions: "Instructions after the same-provider switch",
		freshPreamble: "Preamble after the same-provider switch",
	});
	const sameProviderResult = (await beforeProviderRequest(
		{ payload: sameProviderPayload },
		createContext({
			branchEntries,
			model: sameProviderModel,
			systemPrompt: sameProviderPayload.instructions,
		}),
	)) as { input: unknown[] };

	const providerSwitchNotifications: string[] = [];
	const providerSwitchPayload = await buildPiReplayPayload({
		model: switchedProviderModel,
		branchEntries,
		compactionEntry,
		instructions: "Instructions after the provider switch",
		freshPreamble: "Preamble after the provider switch",
	});
	const providerSwitchResult = await beforeProviderRequest(
		{ payload: providerSwitchPayload },
		createContext({
			branchEntries,
			model: switchedProviderModel,
			systemPrompt: providerSwitchPayload.instructions,
			uiNotifications: providerSwitchNotifications,
		}),
	);

	expect(sameProviderResult.input).toEqual([
		sameProviderPayload.input[0],
		...compactedWindow,
		...(await serializeResponsesInput(sameProviderModel, [toReplayMessage(currentUser)])),
	]);
	expect(providerSwitchResult).toBeUndefined();
	expect(providerSwitchNotifications).toHaveLength(1);
	expect(providerSwitchNotifications[0]).toContain("the provider changed from openai to openai-codex");
});

test("native replay fallback notification fires once per compaction and reason", async () => {
	const notifications: string[] = [];
	const { beforeProviderRequest } = await loadHookHarness();
	const keptUser = createUserEntry("notification_kept_user", "Context before native compaction.");
	const compactionEntry = createCompactionEntry({
		id: "notification_compaction",
		firstKeptEntryId: keptUser.id,
		compactedWindow: [],
	});
	const model = { ...defaultModel };
	const context = createContext({
		branchEntries: [keptUser, compactionEntry],
		model,
		uiNotifications: notifications,
	});
	const payload = { model: model.id, instructions: "Fresh instructions", input: [] };

	await beforeProviderRequest({ payload }, context);
	await beforeProviderRequest({ payload }, context);
	await beforeProviderRequest({ payload: { ...payload, instructions: {} } }, context);
	await beforeProviderRequest({ payload: { ...payload, instructions: {} } }, context);

	expect(notifications).toHaveLength(2);
	expect(notifications[0]).toContain("expected-pi-replay-mismatch");
	expect(notifications[1]).toContain("unsupported-instructions");
});
