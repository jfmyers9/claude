---
name: review-implementation
description: >
  Review code from recent implementation against its plan.
  Triggers: 'review implementation', 'review what was built',
  'compare plan vs code'.
allowed-tools: Task
argument-hint: "[state-file or slug]"
---

## Find State File

Parse `$ARGUMENTS`:
- Path ending `.md` → use directly
- Slug → find most recent
  `.jim/states/*-implemented-*{slug}*.md`
- No args → most recent `.jim/states/*-implemented-*.md`

## Extract Context

Read state file. Extract: source doc path, files changed,
planned vs implemented, tasks completed/failed, branch.

## Spawn Task

```
Review implementation against plan.

## Context

State file: {absolute path}
Source document: {absolute path to exploration doc}
Files changed: {list from state file}
Plan summary: {what was planned}
Implementation summary: {what was implemented}
Branch: {branch name}

## Instructions

1. Read source doc + all changed files (parallel). Note
   deleted files.

2. Review each file across dimensions:
   - **Plan adherence** — matches plan? deviations justified?
     all features done?
   - **Architecture** — patterns followed? complexity justified?
   - **Code quality** — readable? edge cases? names? functions?
   - **Standards** — style consistent? comments valuable?
   - **Security/Perf** — input validated? resource mgmt?
   - **Testing** — tests needed? edge cases covered?
   - **Cross-file** — consistency, reuse, completeness

3. Save to `.jim/notes/review-impl-{YYYYMMDD-HHMMSS}-{slug}.md`:

# Implementation Review: {topic}

Reviewed: {ISO timestamp}
Implementation: {state file path}
Files Reviewed: {count}
Branch: {branch}

## Implementation Summary
**Planned:** {brief}
**Implemented:** {brief}
**Adherence:** {assessment}

## What's Working Well
- {Observation with file:line}

## Areas for Improvement
(Sections: Plan Adherence, Architecture, Code Quality,
Standards, Security/Perf. Each: file:line, description,
WHY, suggestion.)

## Recommendations
| Priority | Item | Action |
|----------|------|--------|

## Ready to Commit?
**Assessment:** {Yes/No + reasoning}

Persona: Senior engineer mentoring. "I notice..." not
"You did wrong...". Explain WHY. Celebrate wins. Every
critique needs a suggestion. Simple > clever.
```

## Present Results

Show: files reviewed, review path, overall assessment,
priority counts, ready-to-commit verdict, next steps
(/address-review, /refine, /commit).
