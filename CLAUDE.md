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

- Monitor context usage carefully throughout sessions
- Pipe long command output through `tail`/`head` to limit volume
- Summarize large file contents rather than reading in full when
  a summary suffices
- When context is running low, prefer finishing current work over
  starting new tasks

## Work as Single Source of Truth

All plans, notes, and state live in work issues — no filesystem
documents.

- **Exploration plans**: stored in issue description
- **Notes/findings**: stored as issue comments
- **Task state**: tracked via issue status
- **View/edit**: `work show <id>`,
  `work edit <id> --description`

## Text Formatting

When generating documentation or long-form text, ensure terminal
readability:

- Wrap prose at 80 characters per line for standard terminal viewing
- Preserve markdown structure (don't wrap code blocks, headings, lists)
- Don't break URLs across lines
- Keep table formatting intact
- Use semantic line breaks at sentence boundaries when appropriate

The 80-character limit ensures documentation is readable in vim and
terminal windows without horizontal scrolling.
