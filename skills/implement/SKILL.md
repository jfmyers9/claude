---
name: implement
description: >
  Execute implementation plans from tasks. Detects epics and spawns
  teams for parallel work.
  Triggers: 'implement', 'build this', 'execute plan', 'start work'.
allowed-tools: Bash, Read, Task, SendMessage, TaskCreate, TaskUpdate, TaskList, TaskGet, TeamCreate, TeamDelete
argument-hint: "[task-id] [--solo]"
---

# Implement

Execute work from tasks, spawning teams for parallel epics.

## Arguments

- `task-id` — epic or task ID (optional)
- `--solo` — force single-agent mode even for epics

## Step 1: Find Work

- If ID in `$ARGUMENTS` → use it
- Else: `TaskList()` → find first in_progress task where
  `metadata.type == "epic"` (Swarm Mode)
- Else: `TaskList()` → find first pending task where
  `metadata.type == "epic"` (Swarm Mode)
- Else: `TaskList()` → find first in_progress task (Solo Mode)
- Else: `TaskList()` → find first pending task with empty
  blockedBy (Solo Mode)
- Nothing found → exit, suggest `/explore` then `/prepare`

## Step 2: Classify

`TaskGet(taskId)` to inspect.

**Epic?** → `metadata.type == "epic"` → **Swarm Mode** (unless `--solo`)
**Task with parent?** → has `metadata.parent_id` → read parent for context, **Solo Mode**
**Standalone task?** → **Solo Mode**

## Swarm Mode

### Setup

1. Parse waves from `TaskList()`:
   - Filter tasks by `metadata.parent_id == epicId`
   - Group by dependency depth (tasks with empty blockedBy = wave 1,
     tasks blocked only by wave 1 = wave 2, etc.)
2. `TaskGet(epicId)` → extract subject + `metadata.design` as epic_context
3. Create team: `TeamCreate(team_name="swarm-<epicId>")`
   If TeamCreate fails → fall back to sequential Solo Mode:
     for each task in topological order:
       TaskUpdate(taskId, status: "in_progress", owner: "worker")
       Spawn single Task agent, wait for completion
       TaskUpdate(taskId, status: "completed")
     Skip team cleanup (no team was created)
4. Read team config: `~/.claude/teams/swarm-<epicId>/config.json`
   → extract the team lead's `name` field for injecting into worker prompts

### Wave Loop

```
while true:
  ready_tasks = TaskList() filtered by:
    metadata.parent_id == epicId AND
    status == "pending" AND
    blockedBy is empty
  if empty → break

  for each task in ready_tasks:
    task_detail = TaskGet(taskId) → description
    Spawn worker via Task tool (see Worker Spawn below)

  Wait for all workers to complete (messages + idle notifications)
  Verify: TaskList() filtered by parent → check completed count

  # Recover stuck tasks before next wave
  stuck = TaskList() filtered by:
    metadata.parent_id == epicId AND status == "in_progress"
  for each stuck task not in just-completed set:
    TaskUpdate(stuckId, status: "pending", owner: "")
    TaskUpdate(stuckId, metadata: { notes: "Released: worker failed in wave N" })

# Check if all children completed
all_children = TaskList() filtered by metadata.parent_id == epicId
if all completed → TaskUpdate(epicId, status: "completed")
Shutdown all teammates via SendMessage(type="shutdown_request")
TeamDelete
```

### Worker Spawn

For each ready task, spawn via Task tool:

```
Task(
  subagent_type="general-purpose",
  team_name="swarm-<epicId>",
  name="worker-<taskId>",
  prompt=<WORKER_PROMPT>
)
```

### Worker Prompt Template

Before spawning, inject the team lead's actual name (from team
config) into `<team-lead-name>` in the prompt template below.

```
You are a swarm worker. Implement task <task-id>.

## Your Task
<task description from TaskGet>

## Epic Context
<epic subject + design field summary>

## Protocol

1. FIRST: Claim your task:
   TaskUpdate(taskId, status: "in_progress", owner: "worker-<task-id>")
   If claim fails, someone else took it. Report and stop.

2. Read full context:
   TaskGet(taskId)

3. Implement the work described in the task.

4. When done, complete the task:
   TaskUpdate(taskId, status: "completed")

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
   - Check `TaskList()` filtered by parent
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

1. `TaskUpdate(taskId, status: "in_progress")`
2. Read scope from description and/or `metadata.design`
3. If parent epic: `TaskGet(parentId)` for context
4. Spawn single Task agent (`subagent_type=general-purpose`)
   - Pass task description + parent context
   - Worker implements, then: `TaskUpdate(taskId, status: "completed")`
5. On completion: verify via `TaskGet(taskId)` status is completed
6. Report results

## Error Handling

**No work found:**
- No task → suggest `/explore` then `/prepare`
- Epic has no children → suggest `/prepare`

**Worker failures:**
- Claim fails (TaskUpdate errors) → skip task, report
- Worker goes idle without completing task → mark as stuck
- Worker reports file conflict → log in task metadata.notes, skip

**Wave-level recovery:**
- If some tasks in a wave fail but others succeed,
  still check `TaskList()` — downstream tasks may be unblocked
  by the successful ones
- Only abort entirely if ALL tasks in a wave fail

**Reporting:**
After all waves complete (or abort), report:
- Total tasks: N completed, M stuck, K failed
- Stuck task IDs (still in_progress)
- Whether epic was closed or left open
