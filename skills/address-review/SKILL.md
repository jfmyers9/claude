---
name: address-review
description: Address feedback from code review with automated fixes
allowed-tools: Task
argument-hint: "[review-doc or slug] [--priority=high|medium|low|all]"
---

# Address Review Skill

Reads code review docs (`/review`, `/review-implementation`) + applies
automated fixes. Flags complex issues for manual intervention.

## Parse Arguments

Parse `$ARGUMENTS` for:
- `--priority=LEVEL`: high (default) | medium (high+medium) |
  low (all three) | all
- Review doc path or slug: remaining args after flags

## Find Review Document

Path ending `.md` -> use directly. Otherwise -> slug, find most
recent `.jim/notes/review-impl-*{slug}*.md` or
`.jim/notes/review-*{slug}*.md`.

No args -> most recent in `.jim/notes/`, prefer `review-impl-*`.

Spawn via Task:

```
Address feedback from a code review document.

## Context

Review document: [insert absolute path to review doc]
Priority level: [insert priority filter]
Review content summary: [insert key findings from review doc]

## Parse Review Feedback

Extract actionable items from:

1. **Recommendations table** ("## Recommendations"): Priority, Item,
   Action. "Verify"/"Consider" items = optional.

2. **Areas for Improvement** subsections: category, file:line, issue
   description, suggested fix, code examples.

3. Cross-reference files changed. Skip nonexistent files.

## Filter by Priority

Apply priority filter. No matches -> report counts per level +
suggest `--priority=all`. Exit if empty.

## Categorize + Apply Fixes

| Simple (automate) | Complex (flag for manual) |
|---|---|
| Rename, comment fixes, constant extraction, import changes, formatting, extract/inline var, remove unused code, null checks, doc additions, argument hints | Architecture changes, logic mods, algorithm improvements, error handling w/ business logic, security fixes, perf optimizations, breaking APIs, cross-file audits |

Edge: "consider"/"would be worth" -> categorize by complexity.
"verify"/"audit" -> skip (human judgment). Missing path -> skip + note.

## Create Tasks + Apply

TaskCreate per fix (group by file). Apply simple fixes:

1. TaskUpdate -> in_progress
2. Read entire file, locate issue by line # or pattern
3. Apply via Edit (follow suggestion exactly, preserve style)
4. Verify syntax; revert if broken -> mark failed
5. TaskUpdate -> completed or failed

Parallel across files, sequential within file.
Error: file not found -> skip. Edit fails -> try more context or skip.

## Generate Fixes Summary

Save to `.jim/notes/fixes-{YYYYMMDD-HHMMSS}-{slug}.md`:

```markdown
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
1. git diff  2. Run tests  3. /review-implementation  4. /commit
```

## Return Value

Summary: addressed/skipped/failed counts, files modified list,
fixes doc path, next steps (git diff, tests, /review-implementation,
/commit).

## Guidelines

- Safe fixes only — skip when uncertain
- Failure doesn't stop execution; log all failures
- No auto-commit; user reviews first
- High-impact, low-risk first
```
