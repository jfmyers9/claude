---
name: implement
description: |
  Execute plans from exploration documents. Multi-phase support.
  Triggers: 'implement', 'build this', 'execute plan',
  'implement the plan'.
allowed-tools: Task
argument-hint: "[exploration-doc or slug] [--continue] [--review]"
---

# Implement

Execute plan from exploration doc via Task agent. Supports
multi-phase with `--continue` to resume next phase.

## Parse Arguments

- `--review` → run code review after implementation
- `--continue` → resume next phase of active implementation
- Remaining → file path, slug, or blank (most recent)

## Routing

**Continue mode** (`--continue` or arg matches `active-*.md`):

1. Find `.jim/states/active-{slug}.md` or most recent
2. Parse: source doc, completed `[x]`/next `[ ]` phases, branch
3. Verify branch matches + phases remain
4. Read source doc → find "Next Steps" → locate next phase
   (`**Phase N: Name**` or `### Phase N: Name`)
5. Extract tasks → **Phase Continuation** below

**New implementation** (otherwise):

1. Find doc: `.jim/plans/{arg}` or most recent `.jim/plans/*.md`
2. Verify has "Recommendation" + "Next Steps" sections
3. Detect phases in "Next Steps":
   - Found → extract Phase 1 tasks only
   - Not found → single phase, all tasks
4. → **Implementation** below

## Implementation

Spawn Task:

```
Implement plan from exploration document.

## Context
Source document: [absolute path]
Phase: [N or "single phase"]
Tasks: [extracted tasks for this phase]

## Execute

TaskCreate per task (subject, description, activeForm).
Per task:
1. TaskUpdate → in_progress
2. Execute: read files, write code, run commands
3. Verify: syntax checks, quick tests
4. TaskUpdate → completed
5. On failure → stop, report error, leave in_progress

## Write State Files

`mkdir -p .jim/states`

### Active Tracking (multi-phase only)

Create `.jim/states/active-{slug}.md`:

```yaml
---
type: active-tracking
topic: "{topic}"
source: "{absolute path}"
branch: "{branch}"
status: in_progress
phase: {N}
total_phases: {N}
created: "{ISO timestamp}"
updated: "{ISO timestamp}"
---
```

Body: phase checklist (`[x]`/`[ ]`), current state summary,
files changed per phase, task outcomes.

### Implementation State

Write `.jim/states/{YYYYMMDD-HHMMSS}-implemented-{slug}.md`
(multi-phase: `-phase{N}-{slug}.md`):

```yaml
---
type: implementation-state
topic: "{topic}"
source: "{absolute path}"
branch: "{branch}"
status: completed
phase: {N}
total_phases: {N}
created: "{ISO timestamp}"
---
```

Body: source path, plan summary, tasks completed/failed,
files changed, notes.

## Guidelines
- Follow plan exactly — only what's specified
- Complete each step fully; don't commit
- Report: summary + files changed
```

## Phase Continuation

Spawn Task:

```
Continue implementation — next phase.

## Context
Source document: [absolute path]
Tracking file: [absolute path to active-*.md]
Phase: [N]
Completed phases: [list]
Tasks: [extracted tasks for this phase]

## Execute

TaskCreate per task (subject, description, activeForm).
Per task:
1. TaskUpdate → in_progress
2. Execute: read files, write code, run commands
3. Verify: syntax checks, quick tests
4. TaskUpdate → completed
5. On failure → stop, report error, leave in_progress

## Update State Files

### Active Tracking
- Mark current phase `[x]`
- Update `phase`, `status`, `updated` in frontmatter
- Set status "completed" if last phase
- Add implementation history for this phase

### Implementation State
Write `.jim/states/{YYYYMMDD-HHMMSS}-phase{N}-{slug}.md`
(same schema as new implementation state file above).

## Guidelines
- Follow plan exactly — only what's specified
- Complete each step fully; don't commit
- Report: summary + files changed
```

## Post-Implementation

If `--review`: spawn `/review-implementation {state file}`.
Include summary + verdict in return.

## Return

Summary, phase completed (if multi-phase), files list,
state file paths, review summary (if --review).
- Phases remain → suggest `/implement --continue`
- Complete → suggest `/review-implementation` + `/commit`

## Triage

- 2+ independent concerns or 5+ phases → `/team-build`
- Multiple independent features → `/team-parallel-build`
