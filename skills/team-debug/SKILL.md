---
name: team-debug
description: Spawn adversarial debugging team w/ competing hypotheses
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

# Team Debug Skill

Spawn 3 investigators pursuing competing hypotheses → synthesize
root cause.

## Instructions

### 1. Parse Bug

Extract from `$ARGUMENTS`. Missing → ask user + exit.

### 2. Formulate 3 Hypotheses

Tailor to specific bug:
1. **Data/State** — incorrect data, unexpected state, race conditions
2. **Logic/Control Flow** — wrong branching, missing conditions, algorithm errors
3. **Integration/Environment** — external deps, config, API misuse, env differences

### 3. Create Team + Tasks

TeamCreate: `debug-squad-{HHMMSS}`. TaskCreate 1 per hypothesis.

### 4. Spawn Investigators

3 parallel general-purpose agents (**investigator-1/2/3**):

Each gets: bug description, their hypothesis, other 2 hypotheses
(for cross-checking). Each must report:
- Evidence for/against (with file:line refs)
- Confidence (high/medium/low + reasoning)
- Suggested fix (specific steps + file paths)

**Failure handling**: Status check after 2 idle prompts. Failed →
mark hypothesis "Not investigated". Continue with remaining
(min 1 must succeed). Report completions as they arrive.

### 5. Synthesize Root Cause

Save to `.jim/notes/team-debug-{YYYYMMDD-HHMMSS}-{slug}.md`:

Bug description, per-hypothesis verdict (evidence, confidence,
supported/refuted/inconclusive), root cause assessment (most likely
cause + confidence + evidence), recommended fix (specific steps +
files), additional findings, failures.

### 6. Shutdown + Present

Shutdown all → TeamDelete. Show: most likely root cause (1-2
sentences), confidence, recommended fix, path to full analysis.
