---
name: fix
description: >
  Convert user feedback on recent implementations into beads issues.
  Triggers: /fix, "fix this", "create issues from feedback"
allowed-tools: Bash, Read, Glob, Grep
argument-hint: "[feedback-text]"
---

# Fix

Convert user feedback on recent implementations into structured beads
issues. Does NOT implement fixes — creates actionable work items for
later scheduling via `/prepare` or `/implement`.

## Key Principle

This skill is a **feedback → beads converter**. User says "this is
wrong, that needs changing, this should be different" and the skill
creates a single bead with all findings structured as phases in the
design field — directly consumable by `/prepare`.

## Arguments

- `<feedback-text>` — feedback to convert (may reference files,
  behaviors, or recent changes)
- (no args) — ask user for feedback

## Workflow

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
- Set priority (P0-P4):
  - P0: Critical bugs, blocking issues
  - P1: Important bugs, high-priority features
  - P2: Normal priority (default for most feedback)
  - P3: Nice-to-have improvements
  - P4: Low priority, future consideration
- Group findings by type for phase structure

### 3. Create Single Bead with Phased Design

Create ONE task bead containing all findings:

```bash
bd create "Fix: <brief-summary-of-feedback>" --type task --priority 2 \
  --description "$(cat <<'EOF'
## Acceptance Criteria
- All feedback items addressed
- Findings stored in design field as phased structure
- Consumable by /prepare for epic creation
EOF
)"
```

Validate: `bd lint <id>` — fix violations if needed.
Mark in progress: `bd update <id> --status in_progress`

Then structure findings as phases in the design field:

```bash
bd update <id> --design "$(cat <<'EOF'
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

**Next**: `bd edit <id> --design` to review findings,
`/prepare <id>` to create epic with tasks.
```

## Examples

**User feedback:**
"The login timeout is too short and the error message doesn't help"

**Creates one bead with phased design:**
```bash
bd create "Fix: login timeout and error UX" --type task --priority 2 \
  --description "$(cat <<'EOF'
## Acceptance Criteria
- All feedback items addressed
- Findings stored in design field as phased structure
- Consumable by /prepare for epic creation
EOF
)"
bd update <id> --status in_progress
bd update <id> --design "$(cat <<'EOF'
## Feedback Analysis

**Phase 1: Bug Fixes**
1. Fix unclear login timeout error in auth/login.ts:87 —
   shows generic 'Error occurred' instead of timeout message

**Phase 2: Improvements**
2. Increase login timeout duration in auth/config.ts:42 —
   current 5s timeout is too short, make configurable
EOF
)"
```

**Output:**
```
## Fix Issue: #claude-abc

**Findings**: 2 items (1 bug, 1 task)

**Next**: `bd edit claude-abc --design` to review findings,
`/prepare claude-abc` to create epic with tasks.
```

## Style Rules

- Keep concise — bullet points, not prose
- No emoji
- All findings in one bead — grouped by type in design phases
- Use specific file paths and line numbers when available
- Classify accurately (bug vs task vs feature matters for grouping)
- Default to P2 unless feedback indicates urgency
