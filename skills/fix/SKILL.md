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
creates properly structured beads issues.

## Argument Parsing

Parse `$ARGUMENTS`:
- Feedback text provided → analyze and convert to beads
- No args → ask user for feedback
- May reference specific files, behaviors, or recent changes

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
- Each distinct issue/request becomes a separate bead
- Classify each: `bug`, `task`, or `feature`
- Set priority (P0-P4):
  - P0: Critical bugs, blocking issues
  - P1: Important bugs, high-priority features
  - P2: Normal priority (default for most feedback)
  - P3: Nice-to-have improvements
  - P4: Low priority, future consideration

### 3. Create Beads Issues

For each finding:
```bash
bd create "<finding-title>" --type <bug|task|feature> --priority <0-4> --description "<details>"
```

**Title requirements:**
- Brief, actionable (imperative form)
- "Fix X", "Add Y", "Update Z"

**Description requirements:**
- Self-contained (implementer shouldn't need original feedback)
- Reference specific files and line numbers when possible
- Include expected behavior vs current behavior for bugs
- Include acceptance criteria for features/tasks

### 4. Report

Output format:
```
## Created Issues

- [claude-abc] Fix X in file.ts:123
- [claude-def] Add Y feature to module
- [claude-ghi] Update Z configuration

## Next Steps

- Run `/prepare` to structure these into phases
- Or run `/implement <id>` to fix directly
```

## Examples

**User feedback:**
"The login timeout is too short and the error message doesn't help"

**Creates two beads:**
1. `bd create "Increase login timeout duration" --type task --priority 2 --description "Current timeout is 5s. Increase to 30s in auth/config.ts:42"`
2. `bd create "Fix unclear login timeout error" --type bug --priority 1 --description "Current: 'Error occurred'. Expected: 'Login timed out. Please try again.'"`

## Style Rules

- Keep concise — bullet points, not prose
- No emoji
- One bead per finding — don't combine unrelated issues
- Use specific file paths and line numbers when available
- Classify accurately (bug vs task vs feature matters for priority)
- Default to P2 unless feedback indicates urgency
