---
name: team-debug
description: |
  Spawn adversarial debugging team with competing hypotheses.
  Triggers: 'team debug', 'debug with team', 'competing
  hypotheses'.
argument-hint: "<bug/issue description>"
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

# Team Debug

Three investigators pursue competing hypotheses → synthesized
root cause analysis.

## Instructions

### 1. Parse Bug

Extract from `$ARGUMENTS`. Missing → AskUserQuestion + exit.

### 2. Formulate 3 Hypotheses

Tailor to specific bug:
1. **Data/State** — incorrect data, unexpected state, race
   conditions
2. **Logic/Control Flow** — wrong branching, missing conditions,
   algorithm errors
3. **Integration/Environment** — external deps, config, API
   misuse, env differences

### 3. Create Team + Tasks

TeamCreate: `debug-squad-{HHMMSS}`. TaskCreate 1 per hypothesis.

### 4. Spawn Investigators

3 parallel general-purpose agents (**investigator-1/2/3**).

Each gets: bug description, their hypothesis, other 2 hypotheses
(for cross-checking). Each must report:
- Evidence for/against (with file:line refs)
- Confidence (high/medium/low + reasoning)
- Suggested fix (specific steps + file paths)

### 5. Failure Handling

Status check after 2 idle prompts. Failed → mark hypothesis
"Not investigated". Continue with remaining (min 1 must
succeed). Report completions as they arrive.

### 6. Synthesize Root Cause

Save to `.jim/notes/team-debug-{YYYYMMDD-HHMMSS}-{slug}.md`:

- Bug description
- Per-hypothesis verdict (evidence, confidence,
  supported/refuted/inconclusive)
- Root cause assessment (most likely cause + confidence +
  evidence)
- Recommended fix (specific steps + files)
- Additional findings
- Failures (if any)

### 7. Shutdown + Present

Shutdown all → TeamDelete. Present:
- Most likely root cause (1-2 sentences)
- Confidence level
- Recommended fix
- Path to full analysis
