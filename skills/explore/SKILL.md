---
name: explore
description: |
  Investigate, research, plan, understand codebase, explore ideas.
  Triggers: 'explore', 'investigate', 'research', 'figure out',
  'how does X work', 'plan for'.
allowed-tools: Bash, Read, Task
argument-hint: "<topic> or [--continue] [<existing-doc>] <feedback>"
---

# Explore

Delegate exploration to Task agent. Supports new + continue modes.

## Routing

Parse `$ARGUMENTS`:

1. `--continue` flag → **continue mode**
   - Strip flag. Match remaining args to `.jim/plans/` file
   - No match → most recent `.jim/plans/*.md`
   - Remaining text → feedback. No text → ask user what to refine
2. First arg matches `.jim/plans/` file + has extra text →
   **continue mode**
3. Otherwise → **new exploration**

## New Exploration

### Context Injection

1. `git branch --show-current`, sanitize `/` → `-`
2. Check `.jim/states/session-{branch}.md`
3. Include if exists + "Updated:" < 30 min ago

### Spawn Task

```
Thoroughly explore: [insert $ARGUMENTS]
[If session context exists, insert it here]

## Investigate

1. Gather context (parallel): Glob files, Grep keywords,
   read READMEs/configs/docs
2. Follow code paths: read files fully, trace imports
3. Map architecture: patterns, conventions, libraries

Don't assume — follow code paths to completion.

## Write Document

Save to `.jim/plans/{YYYYMMDD-HHMMSS}-{topic-slug}.md`:

- **Original Request** — verbatim user input
- **Context Gathered** — files w/ line refs, architecture, deps
- **Requirements Analysis** — explicit, implicit, open questions
- **Potential Approaches** (2-3) — overview, pros, cons,
  complexity, risks
- **Recommendation** — which approach + why
- **Next Steps** — concrete actions; use phase markers
  (`**Phase N: Name**`) if complex (3-7 phases ideal)

Wrap prose at 80 chars. Preserve code blocks + URLs.
```

## Continue Exploration

Spawn Task:

```
Continue exploration based on user feedback.

## Existing Document
[insert full content of matched doc]

## User Feedback
[insert feedback text]

## Instructions
1. Parse feedback: more detail? answer question? new direction?
2. Investigate further if needed (Glob, Grep, Read)
3. Update document in place, preserving structure
4. Add/update Revision History section
5. Preserve valuable existing content — add, don't replace

Wrap prose at 80 chars. Preserve code blocks + URLs.
```

## Return

File path + 2-3 sentence summary + recommendation.
Note: `/explore --continue` to refine, `/implement` to execute.

## Triage

2+ subsystems or complex architectural decision → `/team-explore`
