---
name: explore
description: >
  Research topics, investigate codebases, and create
  implementation plans.
  Triggers: 'explore', 'investigate', 'research'.
allowed-tools: Bash, Read, Write, Task, SendMessage, TaskCreate, TaskUpdate, TaskGet, TaskList, TeamCreate, TeamDelete
argument-hint: "<topic or question> | <task-id> | --continue | --discard | --team"
---

# Explore

Orchestrate exploration via native tasks and Task delegation.

## Arguments

- `<topic>` — new exploration on this topic
- `<task-id>` — continue existing exploration task
- `--continue` — resume most recent exploration (checks task list
  first, then falls back to most recent plan file, then archive)
- `--discard [slug]` — delete the most recent (or specified) plan
  file without preparing it
- `--team` — force team mode for parallel multi-topic exploration

## Plan Directory

Plans are scoped by project to avoid collisions across repos:
`~/.claude/plans/<project>/` where `<project>` is the `basename`
of the git root directory (or cwd if not in a repo).

Archived plans (consumed by `/prepare`) live in the `archive/`
subdirectory and can be restored via `--continue`.

Create the directory on first write: `mkdir -p ~/.claude/plans/<project>/`

## Slug Generation

Generate a kebab-case slug from the topic: lowercase, strip filler
words [a, an, the, for, with, and, or, to, in, of, on, by, is,
it, be, as, at, do], replace non-alphanumeric runs with hyphens,
max 50 chars truncated on word boundary.

## Plan File Format

```markdown
---
topic: <original topic text>
project: <absolute path to current working directory>
created: <ISO 8601 timestamp>
status: draft | prepared
---

<full exploration findings in standard structure>
```

## Workflow

### New Exploration

1. Create task:
   ```
   TaskCreate(
     subject: "Explore: <topic>",
     description: "## Acceptance Criteria\n- Findings written to ~/.claude/plans/<project>/<slug>.md\n- Structured as Current State, Recommendation, and phased Next Steps\n- Each phase is independently actionable",
     activeForm: "Exploring <topic>",
     metadata: { type: "task", priority: 2 }
   )
   ```
2. `TaskUpdate(taskId, status: "in_progress")`
3. Classify topics — parse $ARGUMENTS to determine mode:
   - Numbered list items (`1.` / `2.` / `-` / `*`) → extract
     each as a topic
   - Comma-separated phrases with "and" → split on commas
   - Multiple sentences ending in `?` → each is a topic
   - `--team` flag present → force team mode

   If 2+ topics detected OR `--team` flag → **Team Mode** (step 4b)
   Otherwise → **Solo Mode** (step 4a)

4. Spawn exploration agent(s).

   **a) Solo Mode** — spawn a single Task (subagent_type=Explore,
   model=opus) using the solo prompt template below.

   **b) Team Mode** — create a Claude team for coordinated
   parallel exploration.

   1. Create team: `TeamCreate(team_name="explore-<slug>")`
      Read team config:
      `~/.claude/teams/explore-<slug>/config.json`
      → extract your `name` field as `<lead-name>`
   2. Create per-topic tasks under the main explore task.
      Cap at 5 topics; group excess together.
      ```
      TaskCreate(
        subject: "Explore: <topic-N>",
        description: "<topic text>",
        activeForm: "Exploring <topic-N>",
        metadata: { type: "task", parent_id: "<main-task-id>" }
      )
      ```
   3. Spawn ALL workers in a SINGLE message using the team
      worker prompt template below. One Task call per topic:
      ```
      Task(
        subagent_type="general-purpose",
        team_name="explore-<slug>",
        name="explorer-<N>",
        model=opus,
        prompt=<team worker prompt>
      )
      ```
      CRITICAL: All Task calls in ONE message for true
      parallelism.
   4. Wait for completion — track `completed_count` from
      worker SendMessage notifications. When all done →
      proceed to aggregation. If a worker goes idle without
      completing → check TaskList, mark stuck tasks, proceed
      when all non-stuck workers done.
   5. Aggregate findings (see Team Mode Aggregation below).
   6. Cleanup: `SendMessage(type="shutdown_request")` to each
      worker. After all acknowledge → `TeamDelete`.

5. Store findings:
   a. Write plan file:
      `Write("~/.claude/plans/<project>/<slug>.md",
        <frontmatter + findings>)`
   b. Store in task:
      `TaskUpdate(taskId, metadata: {
        design: "<findings>", plan_file: "<slug>.md" })`
   For Team Mode, run aggregation before storing.

6. Report results (see Output Format)

### Continue Exploration

1. Resolve source:
   - If `$ARGUMENTS` matches a task ID → `TaskGet(taskId)`
   - If `--continue` → `TaskList()`, find first in_progress
     "Explore:" task. If none found, find most recent plan file
     in `~/.claude/plans/<project>/` via
     `ls -t ~/.claude/plans/<project>/*.md | head -1`
   - If no active plan found, check archive:
     `ls -t ~/.claude/plans/<project>/archive/*.md | head -1`
     If found, copy it back to active:
     `cp ~/.claude/plans/<project>/archive/<file> ~/.claude/plans/<project>/`
     Report: "Restored archived plan: `<filename>`"
2. Load existing context:
   - From task: read `metadata.design`
   - From plan file: `Read` the file content (skip frontmatter)
3. Spawn Explore agent with previous findings prepended:
   "Previous findings:\n<existing-design>\n\nContinue the
   exploration focusing on: <new-instructions>"
4. Update both stores:
   a. `Write` updated findings to plan file
   b. `TaskUpdate(taskId, metadata: { design: "<updated>" })`
5. Report results

### Discard Plan

1. Determine `<project>`:
   `basename $(git rev-parse --show-toplevel 2>/dev/null || pwd)`
2. If slug provided after `--discard`:
   - Delete `~/.claude/plans/<project>/<slug>.md` (try
     with/without .md extension, partial glob match)
3. If no slug → delete most recent:
   `ls -t ~/.claude/plans/<project>/*.md | head -1`
   Then delete it.
4. Report: "Discarded plan: `<filename>`"

## Prompt Templates

### Solo Prompt

Spawn Task (subagent_type=Explore, model=opus) with:

```
Research <topic> thoroughly. Return your COMPLETE findings as
text output (do NOT write files).

Set depth based on scope: skim for targeted lookups, dig deep
for architecture and cross-cutting concerns.

Structure:

1. **Current State**: What exists now (files, patterns, architecture)
2. **Recommendation**: Suggested approach with rationale
3. **Next Steps**: Implementation phases using format:

**Phase 1: <Description>**
1. First step
2. Second step

**Phase 2: <Description>**
3. Third step
4. Fourth step

Aim for 3-7 phases. Each phase should be independently testable.
```

### Team Worker Prompt

Team workers use `subagent_type=general-purpose` (not Explore)
so they can use SendMessage for coordination.

```
You are an exploration worker on a team. Research your assigned
topic and report back.

## Your Topic
<topic text>

## Overall Context
<original user request>

## Your Task ID
<task-id>

## Protocol

1. Claim your task:
   TaskUpdate(taskId="<task-id>", status="in_progress",
     owner="explorer-<N>")

2. Research thoroughly. Use Read, Grep, Glob, Bash for
   investigation. Return findings as text (do NOT write files).

3. Structure findings:
   **Current State**: What exists now
   **Recommendation**: Suggested approach
   **Next Steps**: 2-4 implementation phases

4. When done, complete the task with your findings:
   TaskUpdate(taskId="<task-id>", status="completed",
     metadata={ notes: "<your full findings>" })

5. Send completion message to team lead:
   SendMessage(type="message", recipient="<lead-name>",
     content="Completed: <brief summary of findings>",
     summary="Completed topic <N>")

6. Wait for shutdown request. When received, approve it.

## Rules
- Only research — do NOT modify any files
- If blocked, report via SendMessage instead of guessing
- Do NOT work on other topics after completing yours
```

## Team Mode Aggregation

After all workers send completion messages (or stuck detection
fires), collect findings from each worker's task metadata:

For each topic task: `TaskGet(taskId)` → extract `metadata.notes`

Then combine:

1. Prefix each topic's findings with **Topic N: <name>**
2. Detect cross-topic connections (shared files, dependencies,
   conflicts)
3. Renumber phases globally across all topics (Phase 1-N
   sequential) so /prepare can parse them
4. If cross-topic connections found, add a **Cross-Topic
   Connections** section at the top

## Output Format

**Exploration Task**: #<id>

**Key Findings**:
- Bullet points of critical discoveries

**Recommendation**: <one paragraph>

**Plan**: `~/.claude/plans/<project>/<slug>.md` — review/edit in `$EDITOR`
before `/prepare`.

**Next**: `/prepare` to create tasks, edit the plan file first,
or `/explore --discard` if not needed.
