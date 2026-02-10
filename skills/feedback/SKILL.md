---
name: feedback
description: |
  Accept user feedback on recent implementation + apply fixes.
  Triggers: 'feedback', 'this is broken', 'fix this',
  'should be different', 'not what I wanted'.
allowed-tools: Task
argument-hint: "<feedback> [--type=bug|quality|change]"
---

# Feedback

Accept feedback on recent implementation, categorize, apply fixes.

## Parse Arguments

- `--type=TYPE` → bug | quality | change (infer if absent)
- Remaining → feedback text (required; show usage if empty)

## Find Recent Implementation

Check in priority order:
1. Most recent `.jim/states/active-*.md`
2. Most recent `.jim/states/*-implemented-*.md`
3. `git diff --name-only HEAD`

Extract: files changed, what was implemented, source doc.

## Spawn Task

```
Process user feedback on recent implementation.

## Context
Feedback: [feedback text]
Type: [--type value or "infer"]
State file: [path]
Files changed: [list]
What was implemented: [summary]

## Categorize

If type absent, infer:
- **Bug** → "doesn't work", "fails", "error", "broken"
- **Quality** → "naming", "readability", "confusing", "style"
- **Change** → "add", "include", "should have", "instead"
- Default → change

## Analyze by Type

- Bug: symptom → read files → root cause → fix complexity
- Quality: identify issues → read files → find patterns →
  assess improvements
- Change: understand scope → read files → assess size
  (small=inline, medium=context, large → defer to /explore)

## Apply Fixes

| Simple (automate)          | Medium (careful)        | Complex (defer)        |
|----------------------------|-------------------------|------------------------|
| Renames, null checks,      | Multi-line changes,     | Architecture changes,  |
| off-by-one, typos, imports | new functions, control   | new features, breaking |
|                            | flow, validation        | APIs, perf overhauls   |

TaskCreate per fix (group by file). Per task:
1. Read entire file, identify root cause or change point
2. Apply minimal fix, verify no side effects
3. Check syntax; revert if broken

Scope: fix feedback only. Don't improve unrelated code.
Large scope → recommend /explore.

## Save Feedback Doc

Save to `.jim/notes/feedback-{YYYYMMDD-HHMMSS}.md`:
Type, status (Addressed/Partial/Deferred), original feedback,
analysis, actions taken, files modified, remaining items.

## Return

Type, status, 1-2 sentence summary, files modified,
feedback doc path, next steps.
- More issues → `/feedback`
- Satisfied → `/commit`
```
