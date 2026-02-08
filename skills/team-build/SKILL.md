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

Spawn a coordinated team to build a feature with concurrent
execution where possible: architect validates the approach,
implementer builds while tester writes test specs in parallel,
tester fills in tests, reviewer reviews, and issues loop back
for fixes.

## Instructions

### 1. Parse the Feature Specification

Parse `$ARGUMENTS` for the feature to build:

- If a file path is provided (ends in `.md` or contains `/`),
  read the exploration document for the plan
- Otherwise, treat the argument as a feature description

If no arguments provided, check for the most recent exploration
document in `.jim/plans/` and ask the user to confirm. If no
documents found, ask for a feature description and exit.

### 2. Prepare the Build Plan

If working from an exploration document:
- Read the document
- Extract the Recommendation and Next Steps sections
- Use those as the implementation plan

If working from a description:
- Break the feature into concrete implementation steps
- Identify what files need to be created or modified
- Note what tests should be written

### 3. Create the Team

Generate a timestamp in `HHMMSS` format (e.g., `162345`). Use
TeamCreate to create a team named `feature-build-{HHMMSS}` (e.g.,
`feature-build-162345`). This avoids name collisions when multiple
builds run concurrently.

### 4. Create Tasks

Create five tasks with TaskCreate:

1. **Architecture sanity check** - Assigned to the architect.
   Quick review of the approach before any code is written.
2. **Implement the feature** - Assigned to the implementer.
   Build the feature following the plan.
3. **Write test specs** - Assigned to the tester.
   Write test file structure and spec stubs from the plan (not
   from the implementation). Focus on what to test, not how.
4. **Fill in tests and run them** - Assigned to the tester.
   Complete test bodies using the actual implementation and run
   the full test suite.
5. **Review the implementation** - Assigned to the reviewer.
   Review the code and tests for quality, correctness, and best
   practices.

Set up dependencies:
- Task 2 blocked by task 1
- Task 3 blocked by task 1
- Task 4 blocked by tasks 2 and 3
- Task 5 blocked by task 4

### 5. Spawn the Architect

Spawn the architect for a quick sanity check:

- **arch-check** (subagent_type: `architect`): Give it the full
  build plan (or exploration document content). Ask it to do a
  fast (2-minute) sanity check:
  - Are there obvious design flaws in the approach?
  - Are there missing edge cases the plan should address?
  - Are the file boundaries and module structure reasonable?
  - Any critical concerns that should block implementation?

  Tell it to send a message with either:
  - **"APPROVED"** with brief notes (if the approach is sound)
  - **"CRITICAL CONCERN"** with specifics (if something should
    block implementation)

Wait for the architect to finish.

**Gate check:** If the architect raised a critical concern, pause
the build. Present the concern to the user and ask whether to
continue, adjust the plan, or abort. Do not spawn further agents
until the user decides.

If approved, update the build plan with any notes the architect
provided (e.g., suggested file structure, naming conventions).

### 6. Spawn Implementer and Tester Concurrently

After the architect approves, spawn both agents at the same time.
They work in parallel because they touch different files:

- **builder** (subagent_type: `implementer`): Give it the full
  implementation plan, including any architect notes. Include
  specific files to create/modify, the expected behavior, and
  any constraints. Tell it to implement the feature step by step,
  verify each step, and send a message when done with a summary
  of all files created or modified.

- **spec-writer** (subagent_type: `tester`): Give it the feature
  description and the build plan (NOT the implementation, which
  does not exist yet). Tell it to:
  - Create test files with proper structure and imports
  - Write test function signatures with descriptive names
  - Add comments describing what each test should verify
  - Include placeholder assertions (e.g., `expect(true).toBe(false)`
    or `assert False, "TODO"`) so the specs are clearly incomplete
  - Cover happy paths, edge cases, and error handling
  - Send a message when done listing test files created and the
    test scenarios covered

Wait for BOTH to finish before proceeding.

### 7. Tester Fills In Tests

After both the implementer and spec-writer complete, the tester
fills in real test bodies:

Send a message to **spec-writer** with:
- The list of files created/modified by the implementer
- Instructions to:
  - Read the implementation to understand the actual interfaces
  - Replace placeholder assertions with real ones
  - Add any additional tests suggested by the implementation
  - Run the full test suite
  - Send a message with test file locations and results
    (pass/fail counts, any failures with details)

Wait for the tester to finish.

### 8. Spawn the Reviewer

After tests are complete, spawn the reviewer:

- **code-reviewer** (subagent_type: `reviewer`): Give it the
  feature description, all files changed by the implementer,
  the test files from the tester, and the test results. Tell it
  to review the complete implementation for:
  - Code quality and readability
  - Error handling and edge cases
  - Test coverage and test quality
  - Adherence to project conventions
  - Security considerations

  Ask it to send findings organized by severity:
  - **Critical**: Must fix before merging (bugs, security issues)
  - **High**: Should fix (design problems, missing error handling)
  - **Medium**: Improve if time allows (style, naming, structure)
  - **Low**: Suggestions for future improvement

Wait for the reviewer to finish.

### 9. Iteration Loop (If Needed)

If the reviewer found any **critical** or **high** severity issues:

1. Send the reviewer's findings to **builder** (the implementer).
   Tell it to address all critical and high issues. Include the
   specific file paths and suggestions from the reviewer. Tell it
   to send a message when fixes are complete with a summary of
   what changed.

2. Wait for the implementer to finish fixes.

3. Send a message to **spec-writer** (the tester) asking it to
   re-run the test suite and report results. Include the list of
   files the implementer modified during fixes.

4. Wait for the tester to finish re-running tests.

5. Send a message to **code-reviewer** asking for a quick
   re-review of ONLY the changed files. Tell it to confirm
   whether the critical/high issues are resolved and report any
   new concerns.

6. Wait for the reviewer to finish the re-review.

**Maximum 1 iteration.** If issues remain after one fix cycle,
note them in the report for the user to address manually. Do not
loop again.

### 10. Synthesize Results

After all work is complete, synthesize the build results:

```markdown
# Feature Build: [feature name]

Built: [ISO timestamp]
Branch: [current branch]
Agents: architect, implementer, tester, reviewer

## Feature Description

[What was built]

## Architecture Check

[Summary from the architect: approved/concerns, key notes]

## Implementation Summary

[Summary from the implementer: what was done, approach taken]

### Files Created/Modified

- [path] - [description]

## Test Summary

[Summary from the tester: tests written, results]

### Test Files

- [path] - [what it tests]

### Test Results

[Pass/fail summary, any remaining failures]

## Review Findings

[Summary from the reviewer]

### Issues Found

| Priority | Issue | File | Status |
|----------|-------|------|--------|
| ... | ... | ... | Fixed / Open |

## Iteration Summary

[If iteration occurred: what was fixed, re-test results,
re-review outcome. If no iteration needed: "No critical or
high issues found. No iteration needed."]

## Status

[Ready to commit / needs manual fixes for remaining issues]
```

Save to `.jim/notes/build-{timestamp}-{slug}.md`.

### 11. Shut Down Team

Send shutdown requests to all teammates and clean up the team.

### 12. Present Results

Display to the user:
- What was built (1-2 sentences)
- Architecture check result (approved / concerns raised)
- Files created/modified
- Test results (pass/fail)
- Review summary (issues by severity, what was fixed in iteration)
- Path to the full build report
- Suggest next steps:
  - If open issues remain: address them first
  - If all clean: use `/commit` to commit changes
