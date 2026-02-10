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

Spawn 3 investigators pursuing different hypotheses → synthesize root cause.

## Instructions

### 1. Parse Bug Description

Extract from `$ARGUMENTS`. If missing, ask user + exit.

### 2. Formulate Hypotheses

Analyze bug + create 3 distinct hypotheses (tailor to specific bug):

1. **Data/State** - incorrect data, unexpected state, race conditions, data flow
2. **Logic/Control Flow** - incorrect logic, wrong branching, missing conditions, algorithm errors
3. **Integration/Environment** - external deps, config issues, API misuse, env differences

### 3. Create Team

Generate timestamp (HHMMSS). Create team: `debug-squad-{HHMMSS}` (prevents collisions).

Report: "Debug squad created. 3 investigators pursuing independent
hypotheses..."

### 4. Create Tasks

3 tasks via TaskCreate (1 per hypothesis):
- Investigate data/state hypothesis
- Investigate logic/control flow hypothesis
- Investigate integration/environment hypothesis

### 5. Spawn Teammates

3 teammates via Task tool (subagent_type: `general-purpose`):

**investigator-1**: Data/state hypothesis
- Search codebase for supporting/refuting evidence
- Trace data flow, check state mutations, find race conditions, trace code paths
- Report: evidence for/against, confidence, suggested fix

**investigator-2**: Logic/control flow hypothesis
- Search logic errors, incorrect conditions, missing edge cases, algorithmic issues
- Trace execution path, check branching, off-by-one errors, null checks
- Report: evidence, confidence, suggested fix

**investigator-3**: Integration/environment hypothesis
- Check external deps, config files, API usage, version compatibility, env assumptions
- Report: evidence, confidence, suggested fix

Include in each prompt:
- Full bug description
- Their specific hypothesis
- Other 2 hypotheses (for cross-checking)
- SendMessage instructions for results

### 6. Coordinate + Collect

Wait for 3 reports. Note overlapping evidence + contradictions.

Report agent completions as they arrive:
"Investigator-{N} complete ({N}/3). Hypothesis: {verdict}."

After all: "All investigators complete. Synthesizing root cause..."

### 7. Synthesize Root Cause Analysis

```markdown
# Debug Analysis: [bug title]

Investigated: [ISO timestamp]
Bug: [one-line summary]
Hypotheses tested: 3

## Bug Description

[Full user description]

## Hypotheses Investigated

### Hypothesis 1: Data/State
- **Investigator**: investigator-1
- **Confidence**: high/medium/low
- **Evidence for**: [list]
- **Evidence against**: [list]
- **Verdict**: supported/refuted/inconclusive

### Hypothesis 2: Logic/Control Flow
[Same structure]

### Hypothesis 3: Integration/Environment
[Same structure]

## Root Cause Assessment

**Most likely cause**: [description]
**Confidence**: high/medium/low
**Supporting evidence**: [key points]

## Recommended Fix

[Specific actionable steps, file paths + line numbers]

## Additional Findings

[Other issues, cross-hypothesis evidence, unexpected findings]
```

Save to `.jim/notes/debug-{timestamp}-{slug}.md` (slug from bug description).

### 8. Shut Down Team

Send shutdown requests to all teammates. Delete team.

### 9. Present Results

Show user:
- Most likely root cause (1-2 sentences)
- Confidence level
- Recommended fix (brief)
- Path to full analysis
- Suggest next steps
