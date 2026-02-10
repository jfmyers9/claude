---
name: debugging
description: "Use when the user encounters a bug, error, unexpected behavior, crash, exception, or test failure. Also for investigating why something doesn't work, tracing issues, or diagnosing problems."
allowed-tools: Bash, Read, Glob, Grep, Task
argument-hint: "<error message, symptom, or description of the bug>"
---

# Systematic Debugging Skill

Debug issues methodically. Core principle: **investigate before fix.**
No random patches. Understand root cause first, then apply targeted
fix.

## Parse Arguments

Parse `$ARGUMENTS`:
- Extract error message, symptom, or bug description
- Note any file paths, line numbers, or stack traces mentioned
- Identify reproduction steps if provided

Spawn via Task:

```
Systematically debug an issue.

## Context

Issue: [insert description from parsed args]
Error details: [insert error message/stack trace if present]
Files mentioned: [insert any file paths from args]

## Phase 1: Root Cause Investigation

Do NOT propose fixes yet. Gather evidence first.

1. **Read error**: Parse full error message/stack trace. Identify
   exact file, line, function. Note error type/category.

2. **Reproduce**: Find command/test/action that triggers bug.
   Run it, capture output. Note if consistent or intermittent.

3. **Trace code path** (parallelize reads):
   - Read failing file completely
   - Follow imports + function calls upstream
   - Read related test files
   - Check recent changes: `git log --oneline -10 -- <file>`
   - Look at diff: `git diff HEAD~3 -- <file>`

4. **Map data flow**: Trace inputs from origin to failure point.
   Identify transforms + assumptions about data shape/state.

Output Root Cause Summary:
- Error: [exact message]
- Location: [file:line]
- Trigger: [what causes it]
- Data flow: [how data reaches failure]
- Likely cause: [specific hypothesis]

## Phase 2: Pattern Analysis

1. **Find working examples**: Search for similar patterns that
   DO work. Compare working vs failing code.

2. **Document differences**: List every difference. Note missing
   steps, wrong ordering, type mismatches, missing error handling.

3. **Check assumptions**: Verify types at boundaries, config/env
   values, race conditions, ordering deps.

## Phase 3: Hypothesis Testing

Form ONE specific hypothesis based on evidence.

1. **State clearly**: "Bug occurs because X, causing Y at Z" —
   specific + falsifiable.

2. **Design minimal test**: Smallest change to confirm/refute.
   Add log/assert to prove it. Write failing test if possible.

3. **Test**: Make minimal change, run reproduction step.
   If confirmed -> Phase 4. If refuted -> back to Phase 1.

**Escalation:** After 3 failed hypotheses, stop + report findings.
Don't keep guessing. Present evidence, ask for guidance.

## Phase 4: Implementation

1. **Write failing test first** (when applicable)
2. **Apply targeted fix**: Fix only what's broken. Directly
   address root cause. Keep change minimal.
3. **Verify**: Run failing test (should pass), run full suite,
   run reproduction step, check no regressions.
4. **Check related issues**: Search for same pattern elsewhere.
   Note them, don't fix now.

## Red Flags (stop + reconsider)

- Proposing fix before completing Phase 1
- "Quick fix" or "let's just try..."
- Changes without understanding why they'd work
- Changing multiple things hoping one helps
- Ignoring test failures

## Return Value

## Debugging Report

**Issue:** [brief]
**Root Cause:** [what was wrong + why]
**Fix Applied:** [what changed]
**Verification:** [test results]

Files Modified:
- [list]

Related Issues Found:
- [list or "None"]
```

## Output

Display debugging report from agent: root cause, fix applied,
verification results.

## Tips

- Hardest bugs come from wrong assumptions, not wrong code
- Read error messages completely — answer often right there
- Stuck? Trace data flow from source to failure
- Resist "just try something" — understand first
- Small targeted fixes > broad changes

## Triage

2+ possible causes OR cross-file interaction? Suggest `/team-debug`
(three investigators with competing hypotheses).

## Notes

- Modifies files to apply fixes
- May create test files
- 3-hypothesis escalation prevents endless loops
- Works best with specific error messages
