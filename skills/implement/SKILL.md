---
name: implement
description: Execute plans from exploration documents
allowed-tools: Task
argument-hint: "[exploration-doc or slug] [--continue] [--review]"
---

# Implement Skill

Execute plan from exploration document. Supports multi-phase with
`--continue` to resume next phase.

## Parse Arguments

Parse `$ARGUMENTS`:
- `--review`: run code review after implementation
- `--continue`: resume next phase of active implementation
- Remaining: file path, slug, or blank for most recent

## Route: New vs Continue

**If `--continue` or arg matches `active-*.md` in `.jim/states/`:**

1. Find tracking file: `.jim/states/active-{slug}.md` or most
   recent
2. Parse: source doc path, completed phases `[x]`, next phase
   `[ ]`, branch name
3. Verify: current branch matches, not all phases complete
4. Read source doc, find "Next Steps", locate next phase
   (`**Phase N: Name**` or `### Phase N: Name`)
5. Extract phase tasks → use **Continue Implementation** below

**Otherwise (new implementation):**

1. Find doc: `.jim/plans/{arg}` or most recent
   `.jim/plans/*.md`
2. Verify: has "Recommendation" + "Next Steps" sections
3. Detect phases: parse "Next Steps" for phase markers
   - Found → extract Phase 1 tasks only
   - Not found → treat all tasks as single phase
4. Use **New Implementation** below

## New Implementation

Spawn via Task:

```
Implement plan from exploration document.

## Context

Source document: [insert absolute path to exploration doc]
Phase: [insert phase number or "single phase"]
Tasks to implement: [insert extracted tasks for this phase]

## Execute Steps

TaskCreate for each task (subject, description, activeForm).

For each task:
1. TaskUpdate → in_progress
2. Execute (read files, write code, run commands)
3. Verify success (syntax, quick tests)
4. TaskUpdate → completed
5. Fail → stop, report error, leave in_progress

## Write State Files

`mkdir -p .jim/states`. Write both files in parallel:

### Active Tracking File (multi-phase only)

Create `.jim/states/active-{slug}.md`:

```yaml
---
type: active-tracking
topic: "{topic}"
source: "{absolute path}"
branch: "{current branch}"
status: in_progress  # or "completed" if last phase
phase: {N}
total_phases: {N}
created: "{ISO timestamp}"
updated: "{ISO timestamp}"
---
```

Body: phase checklist (`[x]`/`[ ]`), current state summary,
implementation history per phase (summary, files changed, tasks
completed/failed, notes).

### Implementation State File

Write `.jim/states/{YYYYMMDD-HHMMSS}-implemented-{slug}.md`
(or `-phase{N}-{slug}.md` for multi-phase):

```yaml
---
type: implementation-state
topic: "{topic}"
source: "{absolute path}"
branch: "{current branch}"
status: completed
phase: {N}
total_phases: {N}
created: "{ISO timestamp}"
---
```

Body: source path, what planned, what implemented, tasks
completed/failed, files changed, notes.

## Post-Implementation Review

If `--review`: spawn review agent →
`/review-implementation {state file}`.
Include summary + verdict in return.

## Guidelines

- Follow plan exactly; only do what's specified
- Complete each step fully; don't commit
- Report clearly: summary + files changed

## Return Value

Implementation summary, phase completed (if multi-phase), files
list, state file paths, review summary (if --review).
If phases remain: suggest `/implement --continue`.
If complete: suggest `/review-implementation` + `/commit`.
```

## Continue Implementation

Spawn via Task:

```
Continue implementation — resume next phase.

## Context

Source document: [insert absolute path to exploration doc]
Tracking file: [insert absolute path to active tracking file]
Phase: [insert phase number to implement now]
Completed phases: [insert list of completed phases]
Tasks to implement: [insert extracted tasks for this phase]

## Execute Steps

TaskCreate for each task (subject, description, activeForm).

For each task:
1. TaskUpdate → in_progress
2. Execute (read files, write code, run commands)
3. Verify success (syntax, quick tests)
4. TaskUpdate → completed
5. Fail → stop, report error, leave in_progress

## Update State Files

`mkdir -p .jim/states`. Write both files in parallel:

### Update Active Tracking File

Update `.jim/states/active-{slug}.md`:
- Mark current phase `[x]` in checklist
- Update `phase`, `status`, `updated` in frontmatter
- Set status to "completed" if this was the last phase
- Add implementation history for this phase

### Implementation State File

Write `.jim/states/{YYYYMMDD-HHMMSS}-phase{N}-{slug}.md`:

```yaml
---
type: implementation-state
topic: "{topic}"
source: "{absolute path}"
branch: "{current branch}"
status: completed
phase: {N}
total_phases: {N}
created: "{ISO timestamp}"
---
```

Body: source path, what planned, what implemented, tasks
completed/failed, files changed, notes.

## Post-Implementation Review

If `--review`: spawn review agent →
`/review-implementation {state file}`.
Include summary + verdict in return.

## Guidelines

- Follow plan exactly; only do what's specified
- Complete each step fully; don't commit
- Report clearly: summary + files changed

## Return Value

Implementation summary, phase completed, files list, state
file paths, review summary (if --review).
If phases remain: suggest `/implement --continue`.
If complete: suggest `/review-implementation` + `/commit`.
```

## Triage

2+ independent concerns OR large scope (5+ phases) → `/team-build`
Multiple independent features → `/team-parallel-build`

## Output

Display: summary, changed files, review reminder.
