---
name: explore
description: >
  Research topics, investigate codebases, and create
  implementation plans.
  Triggers: 'explore', 'investigate', 'research'.
allowed-tools: Bash, Read, Write, Task, TaskCreate, TaskUpdate, TaskGet, TaskList
argument-hint: "<topic or question> | <task-id> | --continue | --discard | --team"
---

# Explore

Orchestrate exploration via native tasks and Task delegation.

## Arguments

- `<topic>` — new exploration on this topic
- `<task-id>` — continue existing exploration task
- `--continue` — resume most recent exploration (checks task list
  first, then falls back to most recent plan file)
- `--discard [slug]` — delete the most recent (or specified) plan
  file without preparing it
- `--team` — force team mode for parallel multi-topic exploration

## Plan Directory

Plans are scoped by project to avoid collisions across repos:
`~/.claude/plans/<project>/` where `<project>` is the `basename`
of the git root directory (or cwd if not in a repo).

Create the directory on first write: `mkdir -p ~/.claude/plans/<project>/`

## Slug Generation

Generate via: `Bash("tools/bin/slug '<topic>'")`

## Plan File Format

```markdown
---
topic: <original topic text>
project: <absolute path to current working directory>
created: <ISO 8601 timestamp>
status: draft
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
   - Numbered list items (`1.` / `2.` / `-` / `*`) → extract each as a topic
   - Comma-separated phrases with "and" → split on commas
   - Multiple sentences ending in `?` → each is a topic
   - `--team` flag present → force team mode

   If 2+ topics detected OR `--team` flag → **Team Mode** (step 4b)
   Otherwise → **Solo Mode** (step 4a)

4. Spawn exploration agent(s) using the subagent prompt template below.

   **a) Solo Mode** — spawn a single Task (subagent_type=Explore,
   model=opus). Use 3-7 phases in the prompt.

   **b) Team Mode** — spawn N parallel Task subagents in a **SINGLE
   message** (subagent_type=Explore, model=opus), one per topic.
   Cap at 5 agents; group excess topics together. Each prompt adds:
   - "This is part of a multi-topic exploration."
   - A `## Your Topic` section with the specific topic
   - An `## Overall Context` section with the original user request
   - Use 2-4 phases per topic instead of 3-7

5. Store findings:
   a. Write plan file: `Write("~/.claude/plans/<project>/<slug>.md", <frontmatter + findings>)`
      Or use: `Bash("tools/bin/planfile create --topic '<topic>' --project $(pwd) --slug '<slug>' --body '<body>'")`
   b. Store in task: `TaskUpdate(taskId, metadata: { design: "<findings>", plan_file: "<slug>.md" })`
   For Team Mode, run aggregation first (see Team Mode Aggregation).

6. Report results (see Output Format)

### Continue Exploration

1. Resolve source:
   - If `$ARGUMENTS` matches a task ID → `TaskGet(taskId)`
   - If `--continue` → `TaskList()`, find first in_progress
     "Explore:" task. If none found, find most recent plan file
     in `~/.claude/plans/<project>/` via
     `ls -t ~/.claude/plans/<project>/*.md | head -1`
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

1. Determine `<project>`: `basename $(git rev-parse --show-toplevel 2>/dev/null || pwd)`
2. If slug provided after `--discard`:
   - Delete `~/.claude/plans/<project>/<slug>.md` (try with/without
     .md extension, partial glob match)
3. If no slug → delete most recent:
   Find most recent: `Bash("tools/bin/planfile latest --project $(pwd)")`
   Then delete it.
4. Report: "Discarded plan: `<filename>`"

## Subagent Prompt Template

All exploration agents (solo and team) use this structure:

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

Aim for <N> phases. Each phase should be independently testable.
```

- **Solo**: `<N>` = 3-7 phases
- **Team**: `<N>` = 2-4 phases per topic; prepend topic/context
  headers (see step 4b)

## Team Mode Aggregation

After ALL subagents return, combine their output before storing:

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
