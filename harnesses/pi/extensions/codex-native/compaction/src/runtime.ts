import type { Api, Model, ProviderHeaders } from "@earendil-works/pi-ai";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export const DEFAULT_SUPPORTED_PROVIDERS = ["openai", "openai-codex"] as const;
export const DEFAULT_SUPPORTED_APIS = ["openai-responses", "openai-codex-responses"] as const;
const OPENAI_RESPONSES_PATH = "responses";
const CODEX_RESPONSES_PATH = "codex/responses";

type DefaultSupportedApi = (typeof DEFAULT_SUPPORTED_APIS)[number];

type RuntimeModel = Model<Api>;

type NativeCompactionFailureReason =
	| "disabled"
	| "missing-model"
	| "unsupported-provider"
	| "unsupported-api"
	| "missing-base-url"
	| "missing-api-key"
	| "unsupported-payload"
	| "payload-model-mismatch";

type NativeCompactionSupportOptions = {
	enabled?: boolean;
	supportedProviders?: readonly string[];
	supportedApis?: readonly string[];
};

export type ResponsesCompatibleRequestPayload = {
	model: string;
	input: unknown[];
	instructions?: unknown;
	[key: string]: unknown;
};

export type NativeCompactionRuntime = {
	provider: string;
	api: DefaultSupportedApi;
	apiFamily: DefaultSupportedApi;
	model: string;
	baseUrl: string;
	apiKey: string;
	headers?: ProviderHeaders;
	responsesPath: string;
	responsesUrl: string;
	payload?: ResponsesCompatibleRequestPayload;
	currentModel: RuntimeModel;
};

type NativeCompactionEnvironmentFailure = {
	ok: false;
	reason: NativeCompactionFailureReason;
	provider?: string;
	api?: string;
	model?: string;
	baseUrl?: string;
};

type NativeCompactionEnvironmentSuccess = {
	ok: true;
	runtime: NativeCompactionRuntime;
};

type NativeCompactionEnvironmentResolution = NativeCompactionEnvironmentFailure | NativeCompactionEnvironmentSuccess;

function normalizeConfiguredSet(values: readonly string[] | undefined, defaults: readonly string[]): Set<string> {
	const source = values && values.length > 0 ? values : defaults;
	return new Set(source.map((value) => value.trim()).filter((value) => value.length > 0));
}

function normalizeBaseUrl(baseUrl: string | undefined | null): string | undefined {
	const normalized = baseUrl?.trim().replace(/\/+$/, "");
	return normalized ? normalized : undefined;
}

function buildOpenAIResponsesUrl(baseUrl: string): string {
	const normalized = normalizeBaseUrl(baseUrl) ?? baseUrl;
	return normalized.endsWith("/responses") ? normalized : `${normalized}/${OPENAI_RESPONSES_PATH}`;
}

function buildCodexResponsesUrl(baseUrl: string): string {
	const normalized = normalizeBaseUrl(baseUrl) ?? baseUrl;
	if (normalized.endsWith("/codex/responses")) {
		return normalized;
	}
	if (normalized.endsWith("/codex")) {
		return `${normalized}/responses`;
	}
	return `${normalized}/${CODEX_RESPONSES_PATH}`;
}

export function buildResponsesUrl(baseUrl: string, api: DefaultSupportedApi): string {
	return api === "openai-codex-responses" ? buildCodexResponsesUrl(baseUrl) : buildOpenAIResponsesUrl(baseUrl);
}

function buildResponsesPath(api: DefaultSupportedApi): string {
	return api === "openai-codex-responses" ? CODEX_RESPONSES_PATH : OPENAI_RESPONSES_PATH;
}

async function resolveRequestAuth(
	ctx: ExtensionContext,
	model: RuntimeModel,
): Promise<{ apiKey?: string; headers?: ProviderHeaders }> {
	const modelRegistry = ctx.modelRegistry as {
		getApiKeyAndHeaders?: (
			currentModel: RuntimeModel,
		) => Promise<{ ok: true; apiKey?: string; headers?: ProviderHeaders } | { ok: false; error: string }>;
	};

	if (typeof modelRegistry.getApiKeyAndHeaders !== "function") {
		return {};
	}

	const auth = await modelRegistry.getApiKeyAndHeaders(model);
	return auth.ok ? { apiKey: auth.apiKey, headers: auth.headers } : {};
}

function isSupportedApi(api: string): api is DefaultSupportedApi {
	return (DEFAULT_SUPPORTED_APIS as readonly string[]).includes(api);
}

function isResponsesCompatiblePayload(payload: unknown): payload is ResponsesCompatibleRequestPayload {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return false;
	}

	const candidate = payload as Record<string, unknown>;
	return typeof candidate.model === "string" && Array.isArray(candidate.input);
}

function getRuntimeModelDescriptor(model: RuntimeModel | undefined): {
	provider?: string;
	api?: string;
	model?: string;
	baseUrl?: string;
} {
	if (!model) {
		return {};
	}

	return {
		provider: model.provider,
		api: model.api,
		model: model.id,
		baseUrl: normalizeBaseUrl(model.baseUrl),
	};
}

export async function resolveNativeCompactionEnvironment(
	ctx: ExtensionContext,
	options: NativeCompactionSupportOptions = {},
	payload?: unknown,
): Promise<NativeCompactionEnvironmentResolution> {
	if (options.enabled === false) {
		return {
			ok: false,
			reason: "disabled",
		};
	}

	const currentModel = ctx.model;
	const descriptor = getRuntimeModelDescriptor(currentModel);
	if (!currentModel || !descriptor.provider || !descriptor.api || !descriptor.model) {
		return {
			ok: false,
			reason: "missing-model",
			...descriptor,
		};
	}

	const supportedProviders = normalizeConfiguredSet(options.supportedProviders, DEFAULT_SUPPORTED_PROVIDERS);
	if (!supportedProviders.has(descriptor.provider)) {
		return {
			ok: false,
			reason: "unsupported-provider",
			...descriptor,
		};
	}

	const supportedApis = normalizeConfiguredSet(options.supportedApis, DEFAULT_SUPPORTED_APIS);
	if (!supportedApis.has(descriptor.api)) {
		return {
			ok: false,
			reason: "unsupported-api",
			...descriptor,
		};
	}

	if (!isSupportedApi(descriptor.api)) {
		return {
			ok: false,
			reason: "unsupported-api",
			...descriptor,
		};
	}

	if (!descriptor.baseUrl) {
		return {
			ok: false,
			reason: "missing-base-url",
			...descriptor,
		};
	}

	let requestPayload: ResponsesCompatibleRequestPayload | undefined;
	if (payload !== undefined) {
		if (!isResponsesCompatiblePayload(payload)) {
			return {
				ok: false,
				reason: "unsupported-payload",
				...descriptor,
			};
		}

		if (payload.model !== descriptor.model) {
			return {
				ok: false,
				reason: "payload-model-mismatch",
				...descriptor,
			};
		}

		requestPayload = payload;
	}

	const { apiKey, headers } = await resolveRequestAuth(ctx, currentModel);
	if (!apiKey) {
		return {
			ok: false,
			reason: "missing-api-key",
			...descriptor,
		};
	}

	return {
		ok: true,
		runtime: {
			provider: descriptor.provider,
			api: descriptor.api,
			apiFamily: descriptor.api,
			model: descriptor.model,
			baseUrl: descriptor.baseUrl,
			apiKey,
			headers,
			responsesPath: buildResponsesPath(descriptor.api),
			responsesUrl: buildResponsesUrl(descriptor.baseUrl, descriptor.api),
			payload: requestPayload,
			currentModel,
		},
	};
}
