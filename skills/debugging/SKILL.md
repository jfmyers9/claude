---
name: debugging
description: "Use when the user encounters a bug, error, unexpected behavior, crash, exception, or test failure. Also for investigating why something doesn't work, tracing issues, or diagnosing problems."
allowed-tools: Bash, Read, Glob, Grep, Task
argument-hint: "<error message, symptom, or description of the bug>"
---

# Systematic Debugging Skill

Debug issues methodically. The core principle: **investigate before
you fix.** No random "try this" patches. Understand the root cause
first, then apply a targeted fix.

## Instructions

Spawn a general-purpose agent via Task with this prompt:

```
Systematically debug the following issue: [insert $ARGUMENTS]

## Phase 1: Root Cause Investigation

Do NOT propose any fixes yet. First, gather evidence.

1. **Read the error** carefully:
   - Parse the full error message, stack trace, or symptom description
   - Identify the exact file, line, and function where it fails
   - Note the error type/category (type error, runtime crash, logic
     bug, test failure, etc.)

2. **Reproduce the issue**:
   - Find the command, test, or action that triggers the bug
   - Run it and capture the exact output
   - Note whether it fails consistently or intermittently

3. **Trace the code path** (parallelize reads when possible):
   - Read the failing file completely (not just the error line)
   - Follow imports and function calls upstream
   - Read related test files if they exist
   - Check recent git changes: `git log --oneline -10 -- <file>`
   - Look at the diff if recent: `git diff HEAD~3 -- <file>`

4. **Map the data flow**:
   - Trace inputs from origin to the failure point
   - Identify where data transforms or gets passed between functions
   - Note any assumptions the code makes about data shape or state

Output a **Root Cause Summary** before proceeding:

```
Root Cause Summary:
- Error: [exact error message]
- Location: [file:line]
- Trigger: [what causes it]
- Data flow: [how data reaches the failure point]
- Likely cause: [specific hypothesis based on evidence]
```

## Phase 2: Pattern Analysis

1. **Find working examples**:
   - Search for similar patterns in the codebase that DO work
   - Use Grep/Glob to find analogous implementations
   - Compare working code with the failing code

2. **Document differences**:
   - List every difference between working and failing code
   - Note missing steps, wrong ordering, type mismatches
   - Check for missing error handling or edge cases

3. **Check assumptions**:
   - Verify types match at boundaries (function args, return values)
   - Verify config/environment values are what code expects
   - Check for race conditions or ordering dependencies

## Phase 3: Hypothesis Testing

Form ONE specific hypothesis based on Phase 1 and 2 evidence.

1. **State the hypothesis clearly**:
   - "The bug occurs because X, which causes Y at Z"
   - Must be specific and falsifiable

2. **Design a minimal test**:
   - What's the smallest change that would confirm or refute this?
   - Can you add a log/assert to prove the hypothesis?
   - If a test file exists, can you write a failing test first?

3. **Test the hypothesis**:
   - Make the minimal verification change
   - Run the reproduction step again
   - If confirmed: proceed to Phase 4
   - If refuted: return to Phase 1 with new evidence

**Escalation rule:** If you've tested 3 hypotheses without finding
the root cause, stop and report findings to the user. Don't keep
guessing. Present what you've learned and ask for guidance.

## Phase 4: Implementation

1. **Write a failing test first** (when applicable):
   - The test should fail with the current bug
   - The test should pass once the fix is applied
   - Keep the test focused on the specific issue

2. **Apply the targeted fix**:
   - Fix only what's broken, nothing else
   - The fix should directly address the root cause
   - Keep the change as small as possible

3. **Verify the fix**:
   - Run the failing test (should now pass)
   - Run the full test suite for the affected area
   - Run the original reproduction step
   - Check that no other tests broke

4. **Check for related issues**:
   - Search for the same pattern elsewhere in the codebase
   - If the bug pattern appears in other places, note them
   - Don't fix them now — report them for separate attention

## Red Flags (stop and reconsider)

If you catch yourself doing any of these, STOP:

- Proposing a fix before completing Phase 1
- Saying "quick fix for now" or "let's just try..."
- Making changes without understanding why they'd work
- Changing multiple things at once hoping one helps
- Ignoring test failures to "fix them later"

## Return Value

Return a concise debugging report:

```
## Debugging Report

**Issue:** [brief description]
**Root Cause:** [what was actually wrong and why]
**Fix Applied:** [what was changed]
**Verification:** [test results, reproduction check]

Files Modified:
- [list of changed files]

Related Issues Found:
- [any similar patterns elsewhere, or "None"]
```

Do NOT include the full investigation log. Keep it focused on
results.
```

## Output

Display to user: the debugging report from the agent, including
root cause, fix applied, and verification results.

## Tips

- The hardest bugs come from wrong assumptions, not wrong code
- Read error messages completely — the answer is often right there
- When stuck, trace data flow from source to failure point
- Resist the urge to "just try something" — understand first
- Small, targeted fixes are better than broad changes

## Triage

If the bug could have multiple root causes across different subsystems,
suggest `/team-debug` instead. It spawns three investigators pursuing
competing hypotheses in parallel.

## Notes

- This skill modifies files to apply fixes
- It may also create test files to verify the fix
- The escalation rule (3 failed hypotheses) prevents endless loops
- Works best when given specific error messages or reproduction steps
- Vague descriptions ("it's broken") will still work but take longer
