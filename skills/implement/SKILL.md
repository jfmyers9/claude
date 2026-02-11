---
name: implement
description: |
  Execute implementation plans from beads issues. Detects swarm
  epics and spawns teams for parallel work.
  Triggers: 'implement', 'build this', 'execute plan', 'start work'.
allowed-tools: Bash, Read, Task
argument-hint: "[beads-issue-id] [--solo]"
---

# Implement

Execute work from beads issues. Detects solo tasks vs swarm epics.

## Arguments

- `beads-issue-id` — epic or task ID (optional)
- `--solo` — force single-agent mode even for swarms

## Step 1: Find Work

- If ID in `$ARGUMENTS` → use it
- Else: `bd list --status=in_progress` → first result
- Else: `bd ready` → first result
- Nothing found → exit, suggest `/explore` then `/prepare`

## Step 2: Classify Issue

Run `bd show <id>` to inspect the issue.

**Epic with swarm?** Check:
- Issue type is `epic`
- `bd swarm status` or `bd children <id>` shows child tasks
- If yes → **Swarm Mode** (unless `--solo`)

**Task with parent epic?** Check:
- Issue has a parent field
- If yes → read parent for broader context, execute this task

**Standalone task?**
- Read description and design fields for work scope
- → **Solo Mode**

## Swarm Mode

1. Run `bd swarm validate <epic-id>` to see work fronts
2. Count ready tasks in Wave 1
3. Create team: `TeamCreate` with name derived from epic
4. For each ready task, spawn a worker agent:
   - `subagent_type=general-purpose`
   - Worker prompt includes:
     - Task description from `bd show <task-id>`
     - Parent epic context (title, recommendation)
     - Plan document from `.jim/plans/` if referenced
   - Worker must: claim task (`bd update <id> --status in_progress`),
     implement, then close (`bd close <id>`)
5. Monitor workers via teammate messages
6. When Wave 1 completes, check `bd ready` for newly unblocked tasks
7. Spawn workers for next wave, repeat until all waves done
8. Run `bd epic close-eligible` when all children complete
9. Shut down team, report results

## Solo Mode

1. Claim: `bd update <id> --status in_progress`
2. Read work scope from description and/or design field
3. If parent epic exists: `bd show <parent>` for context
4. Spawn single Task agent (`subagent_type=general-purpose`)
   - Pass task description + any parent context
5. On completion: `bd close <id>`
6. Report results

## Error Handling

- No issue found → suggest `/explore` then `/prepare`
- Epic has no children → suggest `/prepare <plan-doc>`
- Worker fails → leave task in_progress, report failure
