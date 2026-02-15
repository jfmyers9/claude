---
name: implement
description: >
  Execute implementation plans from issues. Spawns teams for
  parallel work when multiple issues share a label.
  Triggers: 'implement', 'build this', 'execute plan',
  'start work'.
allowed-tools: Bash, Read, Task, SendMessage, TaskCreate, TaskUpdate, TaskList, TaskGet, TeamCreate, TeamDelete
argument-hint: "[issue-id] [--label=<group>] [--solo]"
---

# Implement

Execute work from issues. Spawns Claude teams for parallel
execution when multiple open issues share a group label.

## Arguments

- `issue-id` — specific issue to implement (Solo Mode)
- `--label=<group>` — implement all open issues with this label
  (Team Mode)
- `--solo` — force single-agent mode even for grouped issues

## Step 1: Find Work

- If ID in `$ARGUMENTS` → use it (Solo Mode)
- If `--label=<group>` → `work list --status=open
  --label=<group>` → all matching issues (Team Mode)
- Else: `work list --status=open` → first result (Solo Mode)
- Nothing found → exit, suggest `/explore` then `/prepare`

## Step 2: Classify

**Multiple issues with shared label?** → **Team Mode**
(unless `--solo`)
**Single issue?** → **Solo Mode**

## Team Mode

### Setup

1. Gather issues:
   `work list --status=open --label=<group> --format=json`
2. Read each issue: `work show <id> --format=json`
3. Create team: `TeamCreate(team_name="impl-<group-label>")`
   If TeamCreate fails → fall back to sequential Solo Mode:
     for each issue in order:
       work start <id>
       Spawn single Task agent, wait for completion
       work close <id>
     Skip team cleanup (no team was created)
4. Read team config:
   `~/.claude/teams/impl-<group-label>/config.json`
   → extract the team lead's `name` field

### Execution Loop

```
open_issues = work list --status=open --label=<group> --format=json
if empty → done

for each issue in open_issues:
  issue_detail = work show <id> --format=json
  Spawn worker via Task tool (see Worker Spawn below)

Wait for all workers to complete (messages + idle notifications)

# Check for remaining work (phases may have been sequential)
remaining = work list --status=open --label=<group>
if remaining → loop again

Shutdown all teammates via SendMessage(type="shutdown_request")
TeamDelete
```

### Worker Spawn

For each issue, spawn via Task tool:

```
Task(
  subagent_type="general-purpose",
  team_name="impl-<group-label>",
  name="worker-<issue-id>",
  prompt=<WORKER_PROMPT>
)
```

### Worker Prompt Template

Before spawning, inject the team lead's actual name (from team
config) into `<team-lead-name>` in the prompt template below.

```
You are a worker. Implement issue <issue-id>.

## Your Task
<issue description from work show>

## Protocol

1. FIRST: Claim your issue:
   work start <issue-id>

2. Read full context:
   work show <issue-id>

3. Implement the work described in the issue.

4. When done, close the issue:
   work close <issue-id>

5. Send completion message to team lead:
   Use SendMessage(type="message", recipient="<team-lead-name>",
     content="Completed <issue-id>: <brief summary>",
     summary="Completed <issue-id>")

6. Wait for shutdown request from team lead.
   When received, approve it.

## Rules
- Only modify files described in your task
- If you hit a file conflict or blocker, report it via
  SendMessage instead of forcing through
- Do NOT work on other issues after completing yours
```

### Completion Detection

After spawning workers:
1. Track: spawned_count = N, completed_count = 0
2. As each worker sends completion message → completed_count++
3. When completed_count == N → wave done
4. If a worker goes idle WITHOUT sending completion:
   - Check `work show <id> --format=json`
   - If still active → worker is stuck/crashed
   - Log stuck issue, decrement expected count
5. After completion: briefly report progress

### Parallel Spawning

CRITICAL: When spawning multiple workers, spawn ALL of them in a
SINGLE message using multiple Task tool calls. This ensures true
parallel execution. Sequential spawning makes work run N× slower.

## Solo Mode

1. `work start <id>`
2. Read scope from description
3. Spawn single Task agent (`subagent_type=general-purpose`)
   - Pass issue description
   - Worker claims, implements, closes
4. On completion: verify `work show <id>` shows done
5. Report results

## Error Handling

**No work found:**
- No issues → suggest `/explore` then `/prepare`
- Label has no open issues → all done

**Worker failures:**
- Start fails → skip issue, report
- Worker goes idle without closing issue → mark as stuck
- Worker reports file conflict → log as comment, skip

**Reporting:**
After all work complete (or abort), report:
- Total issues: N completed, M stuck, K failed
- Stuck issue IDs (still active)
