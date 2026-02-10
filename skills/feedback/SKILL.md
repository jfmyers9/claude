---
name: feedback
description: Provide feedback on recent implementation and apply fixes
allowed-tools: Task
argument-hint: "<feedback> [--type=bug|quality|change]"
---

# Feedback Skill

Accepts user feedback on recent implementation + applies fixes.

## Parse Arguments

Parse `$ARGUMENTS`:
- `--type=TYPE`: bug | quality | change (infer if absent)
- Feedback text: remaining args (required, exit with examples
  if empty)

## Find Recent Implementation

Check in priority order (parallel):
1. Most recent `.jim/states/active-*.md`
2. Most recent `.jim/states/*-implemented-*.md`
3. `git diff --name-only HEAD`

Extract: files changed, what was implemented, source doc.

Spawn via Task:

```
Process user feedback on recent implementation.

## Context

Feedback: [insert feedback text from parsed args]
Type: [insert --type value or "infer"]
Implementation state: [insert path to state file found]
Files changed: [insert list from state file]
What was implemented: [insert summary from state file]

## Categorize + Analyze

If type absent, infer from content:
- **Bug**: "doesn't work", "fails", "error", "broken", error messages
- **Quality**: "naming", "readability", "confusing", "style", "convention"
- **Change**: "add", "include", "should have", "instead", "feature"
- Default: change

### Analysis by Type
- Bug: identify symptom -> read files -> find cause -> assess fix complexity
- Quality: identify issues -> read files -> find patterns -> assess improvements
- Change: understand scope -> read files -> assess: small (inline), medium (context), large (-> /explore)

## Apply Fixes

| Simple (automate) | Medium (careful) | Complex (defer) |
|---|---|---|
| Rename, null checks, off-by-one, typos, imports, obvious error handling | Multi-line changes, new functions, control flow, validation | Architecture changes, new features, breaking APIs, perf |

TaskCreate per fix (group by file). Per task:
1. Read entire file, identify root cause (bugs) or change point
2. Apply minimal fix, verify no side effects
3. Check syntax; revert if broken

Scope: fix feedback only, don't improve unrelated code,
minimal changes, large scope -> recommend /explore.

## Save Feedback Doc

Save to `.jim/notes/feedback-{YYYYMMDD-HHMMSS}.md`:
Type, status (Addressed/Partial/Deferred), original feedback,
context, analysis, actions taken, files modified, verification
steps, remaining items.

## Return Value

Type, status, 1-2 sentence summary, files modified, feedback doc
path, verification steps, next steps (/feedback for more issues,
/commit when satisfied).
```
