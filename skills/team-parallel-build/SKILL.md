---
name: team-parallel-build
description: Build multiple features in parallel on separate branches
argument-hint: "<feature1> <feature2> [feature3...]"
allowed-tools:
  - Task
  - Skill
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - SendMessage
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - TeamCreate
  - TeamDelete
---

# Team Parallel Build Skill

Build multiple independent features in parallel on separate Graphite
branches. Each agent runs full workflow: architecture → implementation
→ testing → review.

## Instructions

### 1. Parse Arguments

Split `$ARGUMENTS` on quoted boundaries or `.md` paths.
- Quoted strings → feature descriptions
- `.md` paths → read as plans (must exist)
- Min 2 features (else suggest `/team-build`)
- Max 5 features

### 2. Pre-flight

1. Clean tree required: `git status --porcelain` (exit if dirty)
2. Record base branch: `git branch --show-current`
3. Verify Graphite: `gt --version`

### 3. Create Branches

Per feature:
1. Slug: lowercase, hyphens, max 40 chars, prefix `jm/feat-`
2. `git checkout {base-branch}` then `gt create {branch-name}`

Return to base after all branches created.

### 4. Create Team

TeamCreate: `parallel-build-{HHMMSS}`.

### 5. Spawn Build Agents

One general-purpose agent per feature, all parallel:
- Name: `build-{N}`
- mode: acceptEdits
- Prompt includes: checkout branch, feature spec, full build
  workflow (architecture check → implement → test → self-review →
  fix critical/high issues). Report: status, summary, files,
  test results, review findings, remaining concerns.

Wait all. Report completions as they arrive.

**Failure handling**: Status check after 2 idle prompts. Failed →
mark feature "Failed", continue others. No retry (partial branch
state may exist).

### 6. Aggregate Report

Save to `.jim/notes/team-parallel-build-{YYYYMMDD-HHMMSS}-{slug}.md`:

Summary table (feature, branch, status, files, tests, issues) +
per-feature details (what built, files, tests, review findings).

### 7. Return to Base + Shutdown

`git checkout {base-branch}`. Shutdown all → TeamDelete.

### 8. Present

Feature count + success/failure split, per-feature one-liner,
test overview, report path. Next: `gt checkout {branch}` to
review, `/submit` per branch for PRs.
