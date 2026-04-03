# Global Instructions

- I use Graphite for branch management
- Use `/submit` to sync and create PRs
- Use `/commit` for conventional commits

## Conciseness

- Make plans extremely concise. Sacrifice grammar for concision.
- Prefer bullet points over prose. Omit filler words.
- In conversation, be direct. Skip preamble and summaries unless
  asked.

## Efficiency

- Run parallel operations in single messages when possible
- Delegate heavy work to subagents; main thread orchestrates
- Pre-compute summaries for subagent context rather than passing
  raw content

## Context Budget

- Pipe long command output through `tail`/`head` to limit volume
- Summarize large file contents rather than reading in full when
  a summary suffices

## Task Tracking

Use native Claude Code tasks for plans and state.

- **Exploration plans**: task `metadata.design`
- **Review summaries**: task `metadata.notes`
- **Task state**: task `status` field
- **View**: `TaskGet(taskId)`

@RTK.md
