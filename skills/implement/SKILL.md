---
name: implement
description: Execute plans from exploration documents
allowed-tools: Task
argument-hint: "[exploration-doc.md or leave blank for latest]"
---

# Implement Skill

Execute plan from exploration document, tracking progress via tasks.

## Agent Prompt

Spawn agent via Task with this prompt:

```
Implement plan from exploration document.

## Parse Arguments

Parse $ARGUMENTS:
- `--review` flag: if present, run code review after implementation
- File/slug: exploration document path or slug

Store review flag state.

## Find Document

If argument provided (excluding flags): read from `.jim/plans/`
Otherwise: find most recent `.jim/plans/*.md` by timestamp in filename

Verify document has "Recommendation" + "Next Steps" sections.

## Detect Phases

Parse "Next Steps" for phase markers:
- `**Phase N: Name**` or `### Phase N: Name`
- If found: extract phases + tasks
- If not: treat all tasks as single phase
- Store phase info for tracking file

## Create Task List

If phases detected:
- Create tasks from Phase 1 only
- Store remaining phases for future execution

If no phases:
- Create tasks from all "Next Steps"

Each task: TaskCreate with clear subject, description, activeForm

## Execute Steps

For each task:
1. TaskUpdate -> in_progress
2. Execute step (read files, write code, run commands)
3. Verify success (check syntax, quick tests)
4. TaskUpdate -> completed
5. Fail: stop, report error, leave task in_progress

## Write State Files

After execution (success/partial), write state files.

### Ensure Directory Exists

`mkdir -p .jim/states`

### Write Both State Files (parallel)

Active tracking + implementation state files are independent.

#### 1. Active Tracking File (if multi-phase)

Create/update `.jim/states/active-{slug}.md`:

```markdown
# Active Implementation: {topic}

Source: {absolute path}
Started: {ISO timestamp}
Branch: {current git branch}
Status: in_progress

## Phases

- [x] Phase 1: {name} (completed {ISO timestamp})
- [ ] Phase 2: {name}

## Current State

Current Phase: 1
Status: completed
Next Phase: 2

## Implementation History

### Phase 1 (completed {ISO timestamp})

{summary of what was done}

Files changed:
- {absolute/path/file.ext} - {description}

Tasks completed:
1. {subject} - {outcome}

Tasks failed/skipped: {list or "None"}

Notes: {context}
```

#### 2. Implementation State File

Extract slug from filename (remove timestamp + `.md`)
Generate timestamp YYYYMMDD-HHMMSS
Write to `.jim/states/{timestamp}-implemented-{slug}.md`:

```markdown
# Implementation: {topic}

Implemented: {ISO timestamp}
Branch: {current git branch}

## Source
{absolute path}

## What Was Planned
{brief summary}

## What Was Implemented
{summary}

### Tasks Completed
1. {subject} - {outcome}

### Tasks Failed/Skipped
{list or "None"}

## Files Changed
- {absolute/path/file.ext} - {description}

## Notes
{context}
```

## Post-Implementation Review

If --review flag present: spawn review agent via Task:

```
Review implementation at: {path to state file}

Run: /review-implementation {path to state file}

Return summary:
- Code quality assessment
- High priority issues (if any)
- Ready to commit verdict
```

Wait for completion + include summary in return value.

## Guidelines

- Follow plan: implement recommended approach only
- Stay focused: only do what plan specifies
- Be thorough: complete each step fully
- Don't commit: leave changes uncommitted for review
- Report clearly: summarize what was done + files changed

## Return Value

Return: implementation summary, phase completed (if multi-phase), files
list, issues, state file path, tracking file path (if multi-phase),
review summary (if --review), reminder for /review-implementation +
/commit
```

## Triage

3+ independent subsystems -> suggest `/team-build`
Multiple independent features -> suggest `/team-parallel-build`

## Output

Display: implementation summary, changed files, reminder to review
before committing.
