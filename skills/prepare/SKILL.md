---
name: prepare
description: >
  Convert exploration or review findings into an epic with phased
  child tasks and dependency chains.
  Triggers: /prepare, "prepare work", "create tasks from plan".
allowed-tools: Bash, Read, Glob, TaskCreate, TaskUpdate, TaskGet, TaskList
argument-hint: "[plan-slug | task-id]"
---

# Prepare

Read plan from a plan file or task and create work structure.

## Arguments

- `[plan-slug]` — plan file name or slug in
  `~/.claude/plans/<project>/`
- `[task-id]` — source task containing plan in metadata.design
- (no args) — auto-discover most recent plan file, fall back to
  in-progress Explore/Review/Fix/Respond task

## Plan Directory

`<project>` = `basename` of git root (or cwd if not in a repo).
Plans live at `~/.claude/plans/<project>/<slug>.md`.

## Steps

1. **Find plan source**

   Try in order:
   Determine `<project>`: `basename $(git rev-parse --show-toplevel 2>/dev/null || pwd)`

   a. If `$ARGUMENTS` matches a file in `~/.claude/plans/<project>/`:
      - Try `~/.claude/plans/<project>/$ARGUMENTS` (exact match)
      - Try `~/.claude/plans/<project>/$ARGUMENTS.md` (append .md)
      - Try glob `~/.claude/plans/<project>/*$ARGUMENTS*` (partial)
      - Read the matched file
   b. If `$ARGUMENTS` is a task ID → `TaskGet(taskId)`, extract
      `metadata.design`
   c. If no args → scan for most recent plan file:
      `ls -t ~/.claude/plans/<project>/*.md | head -1`
      If found, read the file.
   d. If no plan file → fall back to unscoped:
      `ls -t ~/.claude/plans/*.md 2>/dev/null | head -1`
   e. If still none → `TaskList()`, find first in_progress task
      with subject starting "Explore:", "Review:", "Fix:", or
      "Respond:"
   f. No plan found → exit, suggest `/explore` or `/review` first

2. **Parse plan**
   - If from plan file: skip YAML frontmatter (between `---` lines)
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
   - If source was a plan file: delete it
     `rm ~/.claude/plans/<project>/<filename>` (via Bash)
   - If source was a task: close it
     `TaskUpdate(sourceId, status: "completed")`
     (close source AFTER epic creation succeeds — failures leave
     source open for retry)

6. **Report**
   - Display epic ID and all child task IDs
   - Note source consumed (deleted plan file or closed task)
   - Show dependency graph
   - Show parallel work fronts
   - Suggest: `/implement <epic-id>` to start execution
