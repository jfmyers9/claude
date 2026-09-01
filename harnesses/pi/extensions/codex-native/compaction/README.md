# OpenAI Native Compaction Pi Extension

Vendored from [`jordyvandomselaar/pi-openai-compaction`](https://github.com/jordyvandomselaar/pi-openai-compaction) under the MIT license.

Local notes:

- Registered directly from `extensions/codex-native/compaction/index.ts`.
- Settings use the upstream `openaiNativeCompaction` key and `PI_OPENAI_NATIVE_COMPACTION_` environment overrides.
- Native requests use Responses compaction V2: streamed `/responses` with a final `compaction_trigger`.
- Persisted V1 checkpoints remain replayable, but new compactions never call `/responses/compact`.
- V2 requests reuse current Responses tools, reasoning, text, cache, and Codex metadata controls when available.
- Retryable request and stream failures retry at most twice before Pi falls back to its normal compaction path.
- Local edits keep debug artifact failures fail-open and use portable temporary paths in tests.
