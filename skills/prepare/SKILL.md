---
name: prepare
description: >
  Convert exploration or review findings into an epic with phased
  child tasks and dependency chains.
  Triggers: /prepare, "prepare work", "create tasks from plan".
allowed-tools: Bash, Read, Glob, TaskCreate, TaskUpdate, TaskGet, TaskList
argument-hint: "[task-id]"
---

# Prepare

Read plan or review findings from a task and create work
structure.

## Arguments

- `[task-id]` — source task containing plan or review findings

## Steps

1. **Find plan source**
   - If `$ARGUMENTS` is a task ID → `TaskGet(taskId)`, extract `metadata.design`
   - Otherwise → `TaskList()`, find first in_progress task with
     subject starting "Explore:" or "Review:"
   - No plan found → exit, suggest `/explore` or `/review` first

2. **Parse plan**
   - Read the design field content
   - Extract title from first heading
   - Find "Phases" or "Next Steps" section
   - Parse phases: `**Phase N: Description**` or `### Phase N:`
   - Extract tasks under each phase (numbered list items)

3. **Detect dependencies**
   - Default: sequential (each phase blocks the next)
   - Override if phase text contains parallel markers:
     - "parallel with Phase N"
     - "independent of"
     - "no dependency"
   - Phases with no detected dependency on prior phase → parallel

4. **Create task structure**
   - Epic:
     ```
     TaskCreate(
       subject: "<plan-title>",
       description: "<one-paragraph summary>\n\n## Success Criteria\n<3-5 high-level outcomes>",
       activeForm: "Preparing <plan-title>",
       metadata: { type: "epic", priority: 1 }
     )
     ```
   - For each phase:
     ```
     TaskCreate(
       subject: "Phase N: <description>",
       description: "## Acceptance Criteria\n<checklist items for this phase>",
       activeForm: "Phase N: <description>",
       metadata: { type: "task", parent_id: "<epic-id>", priority: 2 }
     )
     ```
   - Set dependencies between sequential phases:
     `TaskUpdate(phaseN+1, addBlockedBy: ["<phaseN-id>"])`
   - Skip dependency for parallel phases

5. **Finalize**
   - `TaskUpdate(epicId, status: "in_progress")`
   - Close source task: `TaskUpdate(sourceId, status: "completed")`
     (close source AFTER epic creation succeeds — failures leave
     source open for retry)

6. **Report**
   - Display epic ID and all child task IDs
   - Closed source task #<source-id>
   - Show dependency graph
   - Show parallel work fronts
   - Suggest: `/implement <epic-id>` to start execution
