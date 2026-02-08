---
name: team-debug
description: Spawn an adversarial debugging team with competing hypotheses
argument-hint: "<description of the bug or issue>"
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

# Team Debug Skill

Spawn a team of three investigators who each pursue a different
hypothesis about a bug, then synthesize findings into a root cause
analysis.

## Instructions

### 1. Parse the Bug Description

Extract the bug description from `$ARGUMENTS`. If no arguments
provided, ask the user to describe the bug and exit.

### 2. Formulate Hypotheses

Before spawning the team, analyze the bug description and formulate
three distinct hypotheses about the root cause. Each hypothesis
should investigate a different category:

1. **Data/State hypothesis** - The bug is caused by incorrect data,
   unexpected state, race conditions, or data flow issues.
2. **Logic/Control flow hypothesis** - The bug is caused by
   incorrect logic, wrong branching, missing conditions, or
   algorithm errors.
3. **Integration/Environment hypothesis** - The bug is caused by
   external dependencies, configuration issues, API misuse, or
   environment differences.

Tailor each hypothesis to the specific bug described.

### 3. Create the Team

Generate a timestamp in `HHMMSS` format (e.g., `162345`). Use TeamCreate
to create a team named `debug-squad-{HHMMSS}` (e.g., `debug-squad-162345`).
This avoids name collisions when multiple debug sessions run concurrently.

### 4. Create Tasks

Create three tasks with TaskCreate, one per hypothesis:

1. **Investigate data/state hypothesis** - Explore whether the bug
   stems from data or state issues.
2. **Investigate logic/control flow hypothesis** - Explore whether
   the bug stems from logic errors.
3. **Investigate integration/environment hypothesis** - Explore
   whether the bug stems from external factors.

### 5. Spawn Teammates

Spawn three teammates using the Task tool, all using the
`researcher` subagent type:

- **investigator-1** (subagent_type: `researcher`): Assign the
  data/state hypothesis. Tell it to search the codebase for
  evidence supporting or refuting this hypothesis. Ask it to
  trace data flow, check state mutations, look for race
  conditions, and find relevant code paths. It should report
  back with evidence for/against, confidence level, and
  suggested fix if the hypothesis holds.

- **investigator-2** (subagent_type: `researcher`): Assign the
  logic/control flow hypothesis. Tell it to search for logic
  errors, incorrect conditions, missing edge cases, and
  algorithmic issues. It should trace the execution path,
  check branching logic, and look for off-by-one errors or
  missing null checks. Report with evidence, confidence, and
  suggested fix.

- **investigator-3** (subagent_type: `researcher`): Assign the
  integration/environment hypothesis. Tell it to check external
  dependencies, configuration files, API usage, version
  compatibility, and environment assumptions. Report with
  evidence, confidence, and suggested fix.

Include in each teammate's prompt:
- The full bug description
- Their specific hypothesis to investigate
- The other two hypotheses (so they can note if they find
  evidence relevant to those)
- Instructions to send findings back via SendMessage

### 6. Coordinate and Collect Results

Wait for all three investigators to report back. As results come
in, note overlapping evidence or contradictions between hypotheses.

### 7. Synthesize Root Cause Analysis

After all investigations complete, synthesize findings:

```markdown
# Debug Analysis: [brief bug title]

Investigated: [ISO timestamp]
Bug: [one-line summary]
Hypotheses tested: 3

## Bug Description

[Full description from user]

## Hypotheses Investigated

### Hypothesis 1: Data/State
- **Investigator**: investigator-1
- **Confidence**: [high/medium/low]
- **Evidence for**: [list]
- **Evidence against**: [list]
- **Verdict**: [supported/refuted/inconclusive]

### Hypothesis 2: Logic/Control Flow
[Same structure]

### Hypothesis 3: Integration/Environment
[Same structure]

## Root Cause Assessment

**Most likely cause**: [description]
**Confidence**: [high/medium/low]
**Supporting evidence**: [key evidence points]

## Recommended Fix

[Specific, actionable steps to fix the bug]
[Include file paths and line numbers where relevant]

## Additional Findings

[Any other issues discovered during investigation]
[Cross-hypothesis evidence or unexpected findings]
```

Save the analysis to
`.jim/notes/debug-{timestamp}-{slug}.md`
(generate a slug from the bug description).

### 8. Shut Down Team

Send shutdown requests to all teammates and clean up the team.

### 9. Present Results

Display to the user:
- The most likely root cause (1-2 sentences)
- Confidence level
- Recommended fix (brief)
- Path to the full analysis document
- Suggest next steps (e.g., implement the fix, or investigate
  further if confidence is low)
