---
name: address-review
description: >
  Address feedback from code review with automated fixes.
  Triggers: 'address review', 'fix review feedback',
  'apply review fixes'.
allowed-tools: Task
argument-hint: "[review-doc or slug] [--priority=high|medium|low|all]"
---

## Parse Arguments

From `$ARGUMENTS`:
- `--priority=LEVEL`: high (default) | medium (high+medium) |
  low (all three) | all
- Remaining text: review doc path or slug

## Find Review Document

- Path ending `.md` → use directly
- Slug → find most recent `.jim/notes/review-impl-*{slug}*.md`
  or `.jim/notes/review-*{slug}*.md` (prefer review-impl)
- No args → most recent review doc in `.jim/notes/`

## Spawn Task

```
Address feedback from code review.

## Context

Review document: {absolute path}
Priority filter: {level}
Review content summary: {key findings}

## Instructions

1. Parse review feedback from:
   - **Recommendations table** — Priority, Item, Action.
     "Verify"/"Consider" items = optional.
   - **Areas for Improvement** — category, file:line, issue,
     suggested fix
   - Cross-reference files. Skip nonexistent files.

2. Filter by priority. No matches → report counts per level,
   suggest `--priority=all`, exit.

3. Categorize:

   | Simple (automate)         | Complex (flag for manual)   |
   |---------------------------|-----------------------------|
   | Rename, comment fix,      | Architecture changes,       |
   | constant extraction,      | logic modifications,        |
   | import reorder, format,   | algorithm improvements,     |
   | extract/inline var,       | security fixes,             |
   | remove unused code,       | perf optimizations,         |
   | null checks, doc updates  | breaking API changes,       |
   |                           | cross-file audits           |

   "consider"/"would be worth" → categorize by complexity.
   "verify"/"audit" → skip (human judgment).
   Missing path → skip + note.

4. Apply simple fixes:
   - Group by file, sequential within file
   - Read entire file, locate issue by line # or pattern
   - Apply via Edit (follow suggestion, preserve style)
   - Verify syntax; revert if broken → mark failed
   - Parallel across files

5. Save to `.jim/notes/fixes-{YYYYMMDD-HHMMSS}-{slug}.md`:

# Review Fixes Applied: {topic}

Applied: {ISO timestamp}
Review Source: {path}
Priority Level: {level}

## Summary
Total: {n} | Addressed: {n} | Skipped: {n} | Failed: {n}

## Issues Addressed
### {/path/file.ext}
- [x] **{Issue}** (Line {n}, {Priority}) — {fix description}

## Issues Skipped
- [ ] **{Issue}** ({path}) — {reason} ({Priority})

## Issues Failed
- [ ] **{Issue}** ({path}) — Attempted: {what}, Error: {why}

## Files Modified
- {path} - {count} fixes

## Next Steps
1. git diff  2. Run tests  3. /review-implementation
4. /commit

Guidelines: safe fixes only — skip when uncertain. Failure
doesn't stop execution. No auto-commit.
```

## Present Results

Show: addressed/skipped/failed counts, files modified,
fixes doc path, next steps (git diff, tests,
/review-implementation, /commit).
