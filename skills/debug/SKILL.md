---
name: debug
description: >
  Systematically diagnose and fix bugs, CI failures, and test
  failures. Triggers: /debug, debugging issues, test failures, CI
  errors.
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
argument-hint: "[blueprint-slug|error-description]"
---

# Debug

Diagnose and fix a bug using a `plan/` blueprint as the durable work
record.

@rules/blueprints.md and @rules/harness-compat.md apply.

## Arguments

- `<blueprint-slug>` — continue a matching debug/fix plan
- `<error-description>` — problem to debug
- no args — inspect current branch/tests for failures

## Workflow

### 1. Resolve or Create Plan

- If a slug matches `blueprint find --type plan --match <slug>`, read
  and continue it.
- Else gather problem context from args, failing tests, CI output, or
  recent logs.
- Create a plan blueprint:
  ```bash
  file=$(blueprint create plan "Debug: <problem>" --status draft)
  ```

### 2. Diagnose

Gather only relevant context:

```bash
git status -sb
git diff --stat
# run the failing test/check if known
```

Trace:

- reproduction steps
- expected vs actual behavior
- suspected files/functions
- root cause evidence

Write/update the blueprint:

```markdown
## Problem

## Reproduction

## Root Cause

## Fix Plan

**Phase 1: Minimal Fix**
- Files:
- Steps:
- Verify:
```

Run `blueprint commit plan <slug>` after writes.

### 3. Fix

Make the smallest change that addresses the root cause. Avoid adjacent
refactors. Verify with the failing test/check first, then related checks
as needed.

Append:

```markdown
## Debug Notes
- Files changed:
- Verification:
- Remaining risks:
```

### 4. Complete

If fixed and verified:

```bash
blueprint status "$file" complete
blueprint commit plan <slug>
```

Report:

```text
Problem: <summary>
Root Cause: <summary>
Fix: <files>
Verification: <commands/results>
```
