---
name: explore
description: "Investigate, research, plan, understand codebase, explore ideas, figure out feature approach before implementing."
allowed-tools: Bash, Read, Task
argument-hint: "<topic> or <existing-doc> <feedback>"
---

# Explore Skill

Delegate exploration to agent, keep main context clean. Supports
both new explorations and continuing existing ones.

## Route: New vs Continue

Parse `$ARGUMENTS`:
- If first arg matches a file in `.jim/plans/` (partial match OK)
  AND has additional text → **continue mode** (refine existing doc)
- Otherwise → **new exploration**

## Context Injection (new exploration only)

1. Get branch: `git branch --show-current`, sanitize `/` → `-`
2. Check `.jim/states/session-{sanitized-branch}.md`
3. If exists + "Updated:" timestamp < 30 min → include as context
4. Otherwise → proceed without

## New Exploration

Spawn via Task:

```
Thoroughly explore: [insert $ARGUMENTS]

## Investigation (exhaustive)

1. **Gather context in parallel**: Glob for files, Grep for
   keywords, read READMEs/configs/docs
2. **Follow code paths**: Read files completely, trace imports
3. **Understand architecture**: Patterns, conventions, libraries

Don't assume — follow code paths to completion.

## Document Structure

Write to `.jim/plans/{YYYYMMDD-HHMMSS}-{topic-slug}.md`:
- Original Request
- Context Gathered (files w/ line refs, architecture, deps)
- Requirements Analysis (explicit, implicit, open questions)
- Potential Approaches (2-3: overview, pros, cons, complexity, risks)
- Recommendation (which + why)
- Next Steps (concrete actions, phase markers if complex)

Wrap prose at 80 chars. Preserve code blocks + URLs.
```

## Continue Exploration

Spawn via Task:

```
Continue this exploration based on user feedback.

## Existing Document
[insert full content of matched doc]

## User Feedback
[insert remaining args after doc match]

## Instructions
1. Understand feedback: more detail? answer question? new direction?
2. Update document in place, preserving structure
3. Add/update Revision History section
4. Investigate further if needed (Glob, Grep, Read)
5. Preserve valuable existing content — add, don't replace
```

## Return Value

Return ONLY: file path + 2-3 sentence summary + recommendation.

## Output

Display: file path + brief summary. Note user can read full doc
or run `/explore <doc> <feedback>` to refine further.

## Triage

3+ subsystems or needs adversarial challenge → `/team-explore`.
