---
name: vibe
description: >
  Fully autonomous development workflow from prompt to commit.
  Chains research → implement → review → fix → commit → submit.
  Triggers: /vibe, "vibe this", "autonomous workflow".
allowed-tools: Bash, Read, Glob, Skill, TaskCreate, TaskUpdate, TaskGet, TaskList
argument-hint: "<prompt> [--continue] [--dry-run]"
---

# Vibe

Run the full development pipeline from a single prompt.

## Plan Directory

@rules/blueprints.md. Use `blueprint find` for file discovery.

## Arguments

- `<prompt>` — what to build (required unless `--continue`)
- `--continue` — resume a failed pipeline from last completed stage
- `--dry-run` — research only, stop before implement

## Pipeline

```
/research → /implement → /review → fix → /report → /commit → /submit
```

Each stage verifies success before proceeding. Failures halt
with a clear report.

## Step 1: Parse Arguments

Extract from `$ARGUMENTS`:

- `<prompt>`: everything except flags
- `--continue`: boolean
- `--dry-run`: boolean

If no prompt and no `--continue` → tell user:
`/vibe <what to build>`, stop.

## Step 2: Resume Check

If `--continue`:

1. `TaskList()` → find task with `metadata.type == "vibe"`
   and `status == "in_progress"`
2. If found → read `metadata.vibe_stage` to determine resume point
3. Read `metadata.vibe_prompt` as the prompt
4. Skip to the stage after `vibe_stage` (see Step 4)
5. If not found → tell user no pipeline to resume, stop

## Step 3: Create Pipeline Tracker

```
TaskCreate(
  subject: "Vibe: <prompt (truncated to 60 chars)>",
  description: "Autonomous pipeline for: <full prompt>",
  activeForm: "Vibing: <prompt (truncated to 40 chars)>",
  metadata: {
    type: "vibe",
    vibe_prompt: "<full prompt>",
    vibe_stage: "started",
    priority: 1
  }
)
TaskUpdate(taskId, status: "in_progress")
```

## Step 4: Execute Pipeline

Run stages sequentially. After each stage succeeds, update
`metadata.vibe_stage` via TaskUpdate before proceeding.

### Stage 1: Research

```
Skill("research", args="<prompt>")
```

**Verify**: Plan file exists — check via
`blueprint find --type spec,plan,review`.
**Update**: `TaskUpdate(trackerId, metadata: { vibe_stage: "research" })`
**Report**: `[1/7] Researched: plan at <path>`

If `--dry-run` → stop here. Report plan file, suggest
`/implement` or `/vibe --continue` when ready.

### Stage 2: Implement

```
Skill("implement", args="--no-report")
```

**Verify**: `TaskList()` → all children of epic have
`status == "completed"`.
**Update**: `TaskUpdate(trackerId, metadata: { vibe_stage: "implement" })`
**Report**: `[2/7] Implemented: N/N tasks completed`

If some tasks failed, report failures but continue to commit
if any code was changed (`git diff --stat` is non-empty).

### Stage 3: Review

```
Skill("review")
```

**Verify**: Review file exists via
`blueprint find --type review`.
**Update**: `TaskUpdate(trackerId, metadata: { vibe_stage: "review" })`
**Report**: `[3/7] Reviewed: findings at <path>`

If review fails, log warning but continue to report (non-blocking).

### Stage 4: Fix Review Findings

Find the review task: `TaskList()` → find task with
`subject` starting with "Review:" and `status == "in_progress"`.

If no review task or no findings → skip, report
`[4/7] Fix: skipped (no findings)`.

If findings exist:
1. Read `metadata.design` from the review task
2. Create tasks from findings via `Skill("fix")`
3. Run `Skill("implement", args="--no-report")` to fix them
4. Complete the review task:
   `TaskUpdate(reviewTaskId, status: "completed")`

**Update**: `TaskUpdate(trackerId, metadata: { vibe_stage: "fix" })`
**Report**: `[4/7] Fixed: N/N review findings addressed`

If fix fails, log warning but continue to report (non-blocking).

### Stage 5: Report

```
Skill("report")
```

**Verify**: Report file exists via
`blueprint find --type report`.
**Update**: `TaskUpdate(trackerId, metadata: { vibe_stage: "report" })`
**Report**: `[5/7] Report: <path>`

If report fails, log warning but continue to commit (non-blocking).

### Stage 6: Commit

Check `git diff --stat` first. If empty → skip, report
`[6/7] Commit: skipped (no changes)`.

```
Skill("commit")
```

**Verify**: `git log -1 --oneline` shows a new commit.
**Update**: `TaskUpdate(trackerId, metadata: { vibe_stage: "commit" })`
**Report**: `[6/7] Committed: <commit oneline>`

### Stage 7: Submit

```
Skill("submit")
```

**Verify**: `gt ls` shows PR created/updated.
**Update**: `TaskUpdate(trackerId, metadata: { vibe_stage: "submit" })`
**Report**: `[7/7] Submitted: PR created/updated`

If submit fails, log warning (non-blocking) — code is committed.

## Step 5: Finalize

```
TaskUpdate(trackerId, status: "completed")
```

Report full summary:

```
Pipeline complete:
[1/7] Researched: plan at <path>
[2/7] Implemented: N/N tasks completed
[3/7] Reviewed: findings at <path>
[4/7] Fixed: N/N review findings addressed
[5/7] Report: <path>
[6/7] Committed: <commit oneline>
[7/7] Submitted: PR created/updated
```

## Error Handling

If ANY stage fails:

1. Do NOT update `vibe_stage` (it stays at last successful stage)
2. Leave tracker task in_progress
3. Report:
   ```
   Pipeline halted at stage N (<stage-name>).
   Error: <details>

   Completed:
   [1/7] Researched: ...
   [2/7] Implemented: ...

   Resume: `/vibe --continue`
   Or run manually: `/<failed-skill> [args]`
   ```

## Stage Count

- Default: 7 stages (`[N/7]`)
- With `--dry-run`: 1 stage (`[N/1]`)

Adjust the `[N/M]` denominator based on active flags.
