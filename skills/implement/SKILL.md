---
name: implement
description: >
  Execute implementation plans from beads issues. Detects swarm
  epics and spawns teams for parallel work.
  Triggers: 'implement', 'build this', 'execute plan', 'start work'.
allowed-tools: Bash, Read, Task, SendMessage, TaskCreate, TaskUpdate, TaskList, TaskGet, TeamCreate, TeamDelete
argument-hint: "[beads-issue-id] [--solo]"
---

# Implement

Execute work from beads issues. Spawns Claude teams for parallel
execution when beads swarm has multiple ready tasks.

## Arguments

- `beads-issue-id` — epic or task ID (optional)
- `--solo` — force single-agent mode even for swarms

## Step 1: Find Work

- If ID in `$ARGUMENTS` → use it
- Else: `bd list --status=in_progress --type=epic` → first result (Swarm Mode)
- Else: `bd list --status=open --type=epic` → check each for swarm molecule
  (`bd swarm status <id>` succeeds) → first swarmable epic (Swarm Mode)
- Else: `bd list --status=in_progress` → first result (Solo Mode)
- Else: `bd ready` → first result (Solo Mode)
- Nothing found → exit, suggest `/explore` then `/prepare`

## Step 2: Classify Issue

Run `bd show <id> --json` to inspect.

**Epic?** → issue_type is "epic" → **Swarm Mode** (unless `--solo`)
**Task with parent?** → has parent → read parent for context, **Solo Mode**
**Standalone task?** → **Solo Mode**

## Swarm Mode

### Setup

1. `bd swarm validate <epic-id> --json` → parse waves
2. `bd show <epic-id> --json` → extract title + design field as epic_context
3. Create team: `TeamCreate(team_name="swarm-<epic-id>")`
   If TeamCreate fails → fall back to sequential Solo Mode:
     for each task in topological order (from bd swarm validate):
       bd update <task-id> --claim
       Spawn single Task agent, wait for completion
       bd close <task-id>
     Skip team cleanup (no team was created)
4. Read team config: `~/.claude/teams/swarm-<epic-id>/config.json`
   → extract the team lead's `name` field for injecting into worker prompts

### Wave Loop

```
while true:
  ready_tasks = bd ready --parent <epic-id> --json
  if empty → break

  for each task in ready_tasks:
    task_detail = bd show <task-id> --json → description
    Spawn worker via Task tool (see Worker Spawn below)

  Wait for all workers to complete (messages + idle notifications)
  Verify: bd swarm status <epic-id> --json → check completed count

  # Optional: for checkpoint reviews between waves, use
  # `bd gate create --await 'human:...'` to pause execution.
  #   gate_id = bd gate create --await "human:Review wave N results" --timeout 4h
  #   bd gate list  # Show pending gates
  #   (Pause until: bd gate approve $gate_id)

  # Recover stuck tasks before next wave
  stuck = bd list --status=in_progress --parent <epic-id>
  for each stuck task not in just-completed set:
    bd update <stuck-id> --status open  # release claim for retry
    bd update <stuck-id> --notes "Released: worker failed in wave N"

bd epic close-eligible
molecule_id = bd swarm list --json | jq '.swarms[] | select(.epic_id=="<epic-id>") | .id'
bd close $molecule_id
Shutdown all teammates via SendMessage(type="shutdown_request")
TeamDelete
```

### Worker Spawn

For each ready task, spawn via Task tool:

```
Task(
  subagent_type="general-purpose",
  team_name="swarm-<epic-id>",
  name="worker-<task-id>",
  prompt=<WORKER_PROMPT>
)
```

### Worker Prompt Template

Before spawning, inject the team lead's actual name (from team
config) into `<team-lead-name>` in the prompt template below.

```
You are a swarm worker. Implement beads task <task-id>.

## Your Task
<task description from bd show>

## Epic Context
<epic title + design field summary>

## Protocol

1. FIRST: Claim your task atomically:
   bd update <task-id> --claim
   If claim fails, someone else took it. Report and stop.

2. Read full context:
   bd show <task-id> --json

3. Implement the work described in the task.

4. When done, close the task:
   bd close <task-id>

5. Send completion message to team lead:
   Use SendMessage(type="message", recipient="<team-lead-name>",
     content="Completed <task-id>: <brief summary>",
     summary="Completed <task-id>")

6. Wait for shutdown request from team lead.
   When received, approve it.

## Rules
- Only modify files described in your task
- If you hit a file conflict or blocker, report it via
  SendMessage instead of forcing through
- Do NOT work on other tasks after completing yours
```

### Wave Completion Detection

After spawning a wave of workers:
1. Track: spawned_count = N, completed_count = 0
2. As each worker sends completion message → completed_count++
3. When completed_count == N → wave done, proceed to next
4. If a worker goes idle WITHOUT sending completion:
   - Check `bd swarm status <epic-id> --json`
   - If task still in_progress → worker is stuck/crashed
   - Log stuck task, decrement expected count
   - If all non-stuck workers done → proceed to next wave
5. Between waves: briefly report progress
   ("Wave N complete: M/N tasks done, K stuck")

### Parallel Spawning

CRITICAL: When spawning multiple workers for a wave, spawn ALL
of them in a SINGLE message using multiple Task tool calls. This
ensures true parallel execution. Sequential spawning (one per
message) makes waves run N× slower.

## Solo Mode

1. `bd update <id> --claim`
2. Read scope from description and/or design field
3. If parent epic: `bd show <parent> --json` for context
4. Spawn single Task agent (`subagent_type=general-purpose`)
   - Pass task description + parent context
   - Worker claims, implements, closes
5. On completion: verify `bd show <id>` is closed
6. Report results

## Error Handling

**No work found:**
- No issue → suggest `/explore` then `/prepare`
- Epic has no children → suggest `/prepare`

**Worker failures:**
- Claim fails (`bd update --claim` errors) → skip task, report
- Worker goes idle without closing task → mark as stuck
- Worker reports file conflict → log in beads notes, skip

**Wave-level recovery:**
- If some tasks in a wave fail but others succeed,
  still check `bd ready` — downstream tasks may be unblocked
  by the successful ones
- Only abort entirely if ALL tasks in a wave fail

**Reporting:**
After all waves complete (or abort), report:
- Total tasks: N completed, M stuck, K failed
- Stuck task IDs (still in_progress in beads)
- Whether epic was closed or left open
