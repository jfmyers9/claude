---
name: fix
description: >
  Convert user feedback on recent implementations into issues.
  Triggers: /fix, "fix this", "create issues from feedback"
allowed-tools: Bash, Read, Glob, Grep
argument-hint: "[feedback-text]"
---

# Fix

Convert user feedback on recent implementations into structured
issues. Does NOT implement fixes — creates actionable work items
for later scheduling via `/prepare` or `/implement`.

## Key Principle

This skill is a **feedback → issue converter**. User says "this is
wrong, that needs changing" and the skill creates an issue with
findings structured as phases in the description — directly
consumable by `/prepare`.

## Arguments

- `<feedback-text>` — feedback to convert (may reference files,
  behaviors, or recent changes)
- (no args) — ask user for feedback

## Workflow

### 0. Verify Work Tracker

Run `work list 2>/dev/null` — if it fails, run `work init`
first.

### 1. Gather Context (Parallel)

Run these in parallel to understand what was recently implemented:
```bash
git diff --name-only HEAD~3..HEAD
git log --oneline -5
git branch --show-current
```

If user references specific files, read those files.

### 2. Analyze Feedback

Break feedback into individual findings:
- Classify each: `bug`, `task`, or `feature`
- Set priority (1-4):
  - 1: Critical bugs, blocking issues
  - 2: Normal priority (default for most feedback)
  - 3: Nice-to-have improvements
  - 4: Low priority, future consideration
- Group findings by type for phase structure

### 3. Create Issue with Phased Description

Create ONE issue containing all findings:

```bash
work create "Fix: <brief-summary>" --type bug --priority 2 \
  --labels fix \
  --description "$(cat <<'EOF'
## Feedback Analysis

**Phase 1: Bug Fixes**
1. Fix X in file.ts:123 — description of bug
2. Fix Y in module.ts:45 — description of bug

**Phase 2: Improvements**
3. Update Z configuration — description of improvement
4. Add W feature — description of feature

Each phase groups findings by type (bugs first, then tasks,
then features). Skip empty phases.
EOF
)"
```

Mark active: `work start <id>`

**Phase grouping rules:**
- Phase 1: Bugs (highest priority first)
- Phase 2: Tasks / improvements
- Phase 3: Features / new functionality
- Skip phases with no findings
- Each item: actionable title with file:line when available

### 4. Report

Output format:
```
## Fix Issue: #<id>

**Findings**: N items (X bugs, Y tasks, Z features)

**Next**: `work show <id>` to review findings,
`/prepare <id>` to create tasks.
```

## Style Rules

- Keep concise — bullet points, not prose
- No emoji
- All findings in one issue — grouped by type in phases
- Use specific file paths and line numbers when available
- Classify accurately (bug vs task vs feature matters)
- Default to priority 2 unless feedback indicates urgency
