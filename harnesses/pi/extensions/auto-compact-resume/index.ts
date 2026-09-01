import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const COMPACT_AT_PERCENT = 85;
const MESSAGE_TYPE = "auto-compact-resume";
export const AUTO_COMPACT_STOP_MESSAGE =
	"End the current response immediately. Output no text and do not call tools. Context compaction will run, then the task will resume.";

export function needsCompaction(
	content: readonly { type: string }[],
	tokens: number | null,
	contextWindow: number,
): boolean {
	return (
		content.some((part) => part.type === "toolCall") &&
		tokens !== null &&
		tokens / contextWindow >= COMPACT_AT_PERCENT / 100
	);
}

export default function autoCompactResumeExtension(pi: ExtensionAPI) {
	let compacting = false;

	pi.on("turn_end", (event, ctx: ExtensionContext) => {
		if (compacting) return;

		const usage = ctx.getContextUsage();
		const content = "content" in event.message && Array.isArray(event.message.content) ? event.message.content : [];
		if (!usage || !needsCompaction(content, usage.tokens, usage.contextWindow)) {
			return;
		}

		compacting = true;
		ctx.compact({
			onComplete: () => {
				compacting = false;
				if (ctx.hasPendingMessages()) return;
				pi.sendMessage(
					{
						customType: MESSAGE_TYPE,
						content: "Continue the original request from the compacted context.",
						display: false,
					},
					{ triggerTurn: true, deliverAs: "followUp" },
				);
			},
			onError: (error) => {
				compacting = false;
				if (ctx.hasUI) ctx.ui.notify(`Auto-compaction failed: ${error.message}`, "error");
			},
		});
	});
}
