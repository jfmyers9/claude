---
name: team-build
description: Spawn a feature build team (architect, implementer, tester, reviewer)
argument-hint: "<feature description or exploration doc path>"
allowed-tools:
  - Task
  - Skill
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - SendMessage
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - TeamCreate
  - TeamDelete
---

# Team Build Skill

Spawn coordinated team: architect validates approach, implementer
builds + tester writes specs in parallel, tester fills tests,
reviewer reviews, issues loop back for fixes.

## Instructions

### 1. Parse Feature Specification

Parse `$ARGUMENTS`:
- File path (ends `.md` or contains `/`) -> read exploration doc
- Otherwise -> feature description

No args -> check `.jim/plans/` for recent doc, confirm + use or
ask for description.

### 2. Prepare Build Plan

From exploration doc:
- Extract Recommendation + Next Steps sections

From description:
- Break into concrete steps
- Identify files to create/modify
- Note tests needed

### 3. Create Team

Generate timestamp `HHMMSS` format. TeamCreate: `feature-build-{HHMMSS}`
(avoids collisions with concurrent builds).

Report: "Team feature-build-{HHMMSS} created. Pipeline:
architect -> implementer+tester -> tester fills -> reviewer."

### 4. Create Tasks

5 tasks via TaskCreate:

1. **Architecture sanity check** (general-purpose): Design review before code.
2. **Implement feature** (general-purpose): Build following plan.
3. **Write test specs** (general-purpose): Test stubs from plan (not implementation).
   Focus on what to test, not how.
4. **Fill tests + run** (general-purpose): Complete bodies + run suite.
5. **Review implementation** (general-purpose): Quality + correctness + conventions.

Dependencies:
- Task 2 blocked by 1
- Task 3 blocked by 1
- Task 4 blocked by 2 + 3
- Task 5 blocked by 4

### 5. Spawn Architect

**arch-check** (general-purpose): 2-min sanity check on full plan:
- Design flaws?
- Missing edge cases?
- File boundaries + structure reasonable?
- Blocking concerns?

Send: **"APPROVED"** (with notes) OR **"CRITICAL CONCERN"** (with details)

Wait. Gate check: if critical concern -> pause, present to user
(continue/adjust/abort). No further agents until decided.

If approved -> update plan with architect notes.

If architect fails (error/timeout): warn user, ask whether to proceed
without architecture check or abort. Default: proceed with caution note.

Report: "Architecture check complete. Spawning implementer + tester..."

### 6. Spawn Implementer + Tester (parallel)

After architect approval, spawn both with `mode: "acceptEdits"`:

**builder** (general-purpose): Full plan + architect notes.
Files to create/modify, behavior, constraints. Implement step-by-step,
verify, message when done (all files created/modified).

**spec-writer** (general-purpose): Feature description + plan (NOT implementation).
- Create test files + imports
- Function signatures + names
- Comments on what to verify
- Placeholder assertions (`expect(true).toBe(false)` or `assert False`)
- Happy paths + edge cases + error handling
- Message when done (test files + scenarios)

Wait both finish.

**If builder fails**: Retry once -- shut down failed agent, spawn fresh
**builder-retry** (general-purpose) with same prompt + "Previous attempt
failed. Start fresh." If retry fails, report to user and abort pipeline
(no point testing without implementation).

**If spec-writer fails**: Retry once -- spawn **spec-writer-retry**
(general-purpose) with same prompt. If retry fails, proceed without test specs
(step 7 tester writes tests from scratch using implementation).

Report: "Implementation + test specs complete. Tester filling tests..."

### 7. Tester Fills Tests

Message **spec-writer**:
- Implementer's file list
- Read implementation -> understand interfaces
- Replace placeholders + real assertions
- Add tests suggested by implementation
- Run full suite
- Message results (locations + pass/fail + details)

Wait.

**If tester fails during fill**: Retry once -- message spec-writer to
try again from scratch. If retry fails, note "Tests incomplete" in
report and continue to review.

Report: "Tests complete. Spawning reviewer..."

### 8. Spawn Reviewer

**code-reviewer** (general-purpose): Feature description + implementer files
+ tester files + results. Review for:
- Code quality + readability
- Error handling + edge cases
- Test coverage + quality
- Project conventions
- Security

Message findings by severity:
- **Critical**: Must fix (bugs, security)
- **High**: Should fix (design, missing handling)
- **Medium**: Nice to have (style, naming, structure)
- **Low**: Future improvement

Wait.

**If reviewer fails**: Note "Review skipped due to agent failure" in
report. Proceed to synthesis. Suggest manual review.

Report: "Review complete. Checking for issues..."

### 9. Iteration Loop (max 1)

If critical + high issues found:

1. Message **builder**: Fix critical + high. Include file paths + suggestions.
   Message when done (summary of changes).
2. Wait.
3. Message **spec-writer**: Re-run suite. Include modified files list.
4. Wait.
5. Message **code-reviewer**: Quick re-review changed files only.
   Confirm resolved + new concerns?
6. Wait.

If issues remain after 1 fix -> note in report for manual fix.

### 10. Synthesize Results

Save to `.jim/notes/build-{timestamp}-{slug}.md`:

```markdown
# Feature Build: [name]

Built: [ISO timestamp]
Branch: [current branch]
Agents: architect, implementer, tester, reviewer

## Feature Description

[What built]

## Architecture Check

[Architect summary: approved/concerns + notes]

## Implementation Summary

[Implementer: what done, approach]

### Files Created/Modified

- [path] - [description]

## Test Summary

[Tester: tests written, results]

### Test Files

- [path] - [what it tests]

### Test Results

[Pass/fail summary + failures]

## Review Findings

[Reviewer summary]

### Issues Found

| Priority | Issue | File | Status |
|----------|-------|------|--------|
| ... | ... | ... | Fixed/Open |

## Iteration Summary

[If happened: what fixed, re-test results, re-review outcome.
Else: "No critical/high issues found."]

## Failures

[Agent failures, retries, degraded steps, or "None"]

## Status

[Ready to commit / needs manual fixes]
```

### 11. Shut Down Team

Send shutdown requests, cleanup.

### 12. Present Results

- What built (1-2 sentences)
- Architecture result
- Files created/modified
- Test results
- Review summary
- Report path
- Next steps: fix open issues OR `/commit`
