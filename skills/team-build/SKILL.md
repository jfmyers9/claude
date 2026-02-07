---
name: team-build
description: Spawn a feature build team (implementer, tester, reviewer)
argument-hint: "<feature description or exploration doc path>"
---

# Team Build Skill

Spawn a coordinated team to build a feature: one implements, one
tests, and one reviews the final result.

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

Generate a timestamp in `HHMMSS` format (e.g., `162345`). Use TeamCreate
to create a team named `feature-build-{HHMMSS}` (e.g.,
`feature-build-162345`). This avoids name collisions when multiple builds
run concurrently.

### 4. Create Tasks

Create tasks with TaskCreate:

1. **Implement the feature** - Assigned to the implementer.
   Build the feature following the plan.
2. **Write tests** - Assigned to the tester.
   Write tests for the feature once implementation is ready.
3. **Review the implementation** - Assigned to the reviewer.
   Review the code after implementation and tests are complete.

Set up dependencies: task 2 is blocked by task 1, and task 3
is blocked by tasks 1 and 2.

### 5. Spawn the Implementer

Spawn the first teammate using the Task tool:

- **builder** (subagent_type: `implementer`): Give it the full
  implementation plan. Include specific files to create/modify,
  the expected behavior, and any constraints. Tell it to
  implement the feature step by step, verify each step, and
  send a message when done with a summary of files changed.

Wait for the implementer to finish before spawning the next
teammate.

### 6. Spawn the Tester

After the implementer completes, spawn the tester:

- **test-writer** (subagent_type: `tester`): Give it the feature
  description, the list of files that were created/modified by
  the implementer, and the expected behavior. Tell it to write
  thorough tests covering happy paths, edge cases, and error
  handling. Run the tests to verify they pass. Send a message
  when done with test file locations and results.

Wait for the tester to finish.

### 7. Spawn the Reviewer

After tests are written, spawn the reviewer:

- **code-reviewer** (subagent_type: `reviewer`): Give it the
  feature description, all files changed by the implementer,
  and the test files written by the tester. Tell it to review
  the complete implementation for code quality, best practices,
  potential issues, and test coverage. Send a message with
  review findings organized by severity.

Wait for the reviewer to finish.

### 8. Synthesize Results

After all teammates complete, synthesize the build results:

```markdown
# Feature Build: [feature name]

Built: [ISO timestamp]
Branch: [current branch]

## Feature Description

[What was built]

## Implementation Summary

[Summary from the implementer: what was done, files changed]

### Files Created/Modified

- [path] - [description]

## Test Summary

[Summary from the tester: tests written, results]

### Test Files

- [path] - [what it tests]

### Test Results

[Pass/fail summary]

## Review Findings

[Summary from the reviewer]

### Issues Found

| Priority | Issue | File | Suggestion |
|----------|-------|------|------------|
| ... | ... | ... | ... |

## Status

[Ready to commit / needs fixes based on review findings]
```

Save to `.jim/notes/build-{timestamp}-{slug}.md`.

### 9. Shut Down Team

Send shutdown requests to all teammates and clean up the team.

### 10. Present Results

Display to the user:
- What was built (1-2 sentences)
- Files created/modified
- Test results (pass/fail)
- Review summary (any critical issues?)
- Path to the full build report
- Suggest next steps:
  - If review found critical issues: address them first
  - If all clean: use `/commit` to commit changes
