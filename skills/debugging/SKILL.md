---
name: debugging
description: >
  Systematic debugging of bugs, errors, crashes, test
  failures. Triggers: 'debug', 'fix error', 'why is this
  failing', 'trace issue', 'diagnose problem'.
allowed-tools: Bash, Read, Glob, Grep, Task
argument-hint: "<error message, symptom, or description>"
---

## Parse Arguments

From `$ARGUMENTS` extract:
- Error message, symptom, or bug description
- File paths, line numbers, stack traces
- Reproduction steps if provided

## Spawn Task

```
Systematically debug an issue. Investigate before fix.

## Context

Issue: {description}
Error details: {message/stack trace if present}
Files mentioned: {paths from args}

## Phase 1: Root Cause Investigation

Do NOT propose fixes yet.

1. Read error: parse full message/stack trace. Identify
   exact file, line, function, error type.

2. Reproduce: find command/test that triggers bug. Run it,
   capture output. Note if consistent or intermittent.

3. Trace code path (parallelize reads):
   - Read failing file completely
   - Follow imports + calls upstream
   - Read related test files
   - Check recent changes: `git log --oneline -10 -- <file>`
   - Check diff: `git diff HEAD~3 -- <file>`

4. Map data flow: trace inputs from origin to failure.
   Identify transforms + assumptions about shape/state.

Output root cause summary:
- Error: {exact message}
- Location: {file:line}
- Trigger: {what causes it}
- Data flow: {how data reaches failure}
- Likely cause: {specific hypothesis}

## Phase 2: Pattern Analysis

1. Find working examples of similar patterns. Compare
   working vs failing code.
2. Document differences: missing steps, wrong ordering,
   type mismatches, missing error handling.
3. Check assumptions: types at boundaries, config/env
   values, race conditions, ordering deps.

## Phase 3: Hypothesis Testing

Form ONE specific hypothesis from evidence.

1. State clearly: "Bug occurs because X, causing Y at Z"
   — specific + falsifiable.
2. Design minimal test to confirm/refute. Add log/assert
   or write failing test.
3. Test it. Confirmed → Phase 4. Refuted → back to
   Phase 1 with new evidence.

Escalation: after 3 failed hypotheses, stop + report all
findings. Don't keep guessing.

## Phase 4: Implementation

1. Write failing test first (when applicable)
2. Apply targeted fix: only what's broken, directly
   address root cause, keep change minimal.
3. Verify: run failing test (should pass), run full suite,
   run reproduction step, check no regressions.
4. Check for same pattern elsewhere. Note them, don't
   fix now.

## Red Flags (stop + reconsider)

- Proposing fix before completing Phase 1
- "Quick fix" or "let's just try..."
- Changing multiple things hoping one helps

## Output

# Debugging Report

**Issue:** {brief}
**Root Cause:** {what was wrong + why}
**Fix Applied:** {what changed}
**Verification:** {test results}

Files Modified:
- {list}

Related Issues Found:
- {list or "None"}
```

## Present Results

Display: root cause, fix applied, verification results,
files modified, related issues.

**Triage:** 2+ possible causes OR cross-file interaction →
suggest `/team-debug`.
