---
name: implement
description: |
  Execute implementation plans from beads issues in phases.
  Triggers: 'implement', 'build this', 'execute plan', 'start work'.
allowed-tools: Task
argument-hint: "[beads-issue-id] [--continue]"
---

# Implement

Execute implementation plans from beads issues, phase by phase.

## Arguments

- `beads-issue-id` — optional, issue to implement
- `--continue` — resume next uncompleted phase of active issue

## Workflow

1. **Parse arguments**
   - Extract issue ID and `--continue` flag from `$ARGUMENTS`
   - If no ID: check `bd list --status=in_progress` for active work
   - If no active work: check `bd ready` for next available issue
   - Exit if no issue found

2. **Claim issue**
   - Run `bd update <id> --status in_progress`
   - Read full issue: `bd show <id>`
   - Extract design field (contains plan from `/explore`)

3. **Detect phases**
   - Parse design for phase markers: `**Phase N:**` or `### Phase N:`
   - If `--continue`: identify next uncompleted phase from issue notes
   - If new: start with Phase 1
   - Exit if no phases found or all complete

4. **Spawn implementation agent**
   - Use Task tool with `subagent_type=general-purpose`
   - Pass phase description and relevant design context
   - Agent implements the phase autonomously

5. **Update progress**
   - After agent completes: update issue notes with phase completion
   - Run `bd update <id> --note "Phase N: <summary>"`
   - If all phases complete: `bd close <id>`
   - If more phases remain: report status, suggest `/implement <id> --continue`

## Phase Detection

Look for either pattern:
- `**Phase N: Description**` (bold inline)
- `### Phase N: Description` (heading level 3)

Track completed phases in issue notes to support `--continue`.

## Error Handling

- No issue found → exit with suggestion to run `/explore` first
- No phases detected → exit with note to check design format
- Agent fails → update issue notes, leave status as in_progress
