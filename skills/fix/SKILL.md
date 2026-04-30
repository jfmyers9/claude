---
name: fix
description: >
  Convert user feedback on recent implementations into blueprint-backed
  fix plans. Triggers: /fix, 'fix this', 'create issues from feedback'.
allowed-tools: Bash, Read, Write, Glob, Grep
argument-hint: "[feedback-text]"
---

# Fix

Convert feedback into a `plan/` blueprint consumable by
`/skill:implement`.

@rules/blueprints.md and @rules/harness-compat.md apply.

## Arguments

- `<feedback-text>` — feedback to convert
- no args — use latest review blueprint or ask for feedback

## Workflow

### 1. Gather Context

Run in parallel where possible:

```bash
git diff --name-only HEAD~3..HEAD
git log --oneline -5
branch=$(git branch --show-current)
branch_slug=$(blueprint slug "$branch")
review_file=$(blueprint find --type review --match "$branch_slug")
```

If no feedback text was provided and a review blueprint exists, read it
and extract actionable findings. If neither exists, ask for feedback.

If feedback names files, read those files.

### 2. Analyze Feedback

Break feedback into findings. For each finding:

- classify: `bug`, `task`, or `feature`
- priority: P0-P4, default P2
- file/line if known
- concrete change requested
- verification signal

Group findings:

- Phase 1: Bugs
- Phase 2: Improvements
- Phase 3: Features

Skip empty phases.

### 3. Create Fix Plan

Create the plan:

```bash
file=$(blueprint create plan "Fix: <brief-summary>" --status draft)
```

If sourced from a review blueprint:

```bash
SOURCE_SLUG=$(basename "$review_file" .md)
blueprint link "$file" "$SOURCE_SLUG"
```

Write:

```markdown
## Feedback Analysis

### Summary
- Findings: N
- Source: <feedback/review path>

**Phase 1: Bug Fixes**
1. <file:line> — <actionable fix>
   - Why: <reason>
   - Verify: <check>

**Phase 2: Improvements**
...

**Phase 3: Features**
...
```

Run `blueprint commit plan <slug>` after writing. If it fails, stop
and show the error.

### 4. Report

```text
Fix Plan: <path>
Findings: N (X bugs, Y improvements, Z features)
Next: /skill:implement
```

## Rules

- One fix plan per feedback batch.
- Keep findings actionable and file-specific.
- Do not create native task state.
