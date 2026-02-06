# Context Budget

Context window is finite. Treat it like memory — never waste it.

## Rules

- Pipe verbose commands through `| tail -20` or `| head -50` —
  never dump full logs
- Use `--quiet`, `--summary`, or `-s` flags when available
- Grep for relevant lines instead of reading full output
- If output exceeds ~30 lines, summarize before continuing
- When passing info between agents, pre-compute a summary —
  don't forward raw output
- When spawning subagents, include only what they need and omit
  everything else
