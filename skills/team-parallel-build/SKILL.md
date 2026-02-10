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
branches. Each runs full build workflow (architecture → implementation →
testing → review) as independent agent.

## Instructions

### 1. Parse Arguments

Parse `$ARGUMENTS` to extract multiple feature specs. Accept:
- Quoted strings: `"add rate limiting" "add caching layer"`
- File paths (`.md` suffix): `plans/auth.md plans/logging.md`

Split on quoted boundaries first, then treat tokens as `.md` paths.
Reject ambiguous input; ask user to quote descriptions.

Validation:
- Min 2 features (else suggest `/team-build`, exit)
- Max 5 features (else warn, exit)
- All `.md` paths must exist

For each feature: if `.md` file → read content as plan; else → use
quoted string as description.

### 2. Pre-flight Checks

Before creating branches:

1. Clean tree: `git status --porcelain`. Exit if uncommitted changes
   (parallel builds need clean state).

2. Record base: `git branch --show-current`. Stack all features
   on this branch; return here at end.

3. Verify Graphite: `gt --version`. Exit if not installed.

### 3. Create Branches

For each feature:

1. Slug: lowercase + hyphens, remove special chars, truncate 40 chars,
   prefix `jm/feat-` (e.g., `jm/feat-add-rate-limiting`)

2. Ensure on base: `git checkout {base-branch}` before each new branch

3. Create: `gt create {branch-name}`

4. Store mapping: feature → branch name

After all branches: `git checkout {base-branch}`

### 4. Create Team

Generate timestamp `HHMMSS`. Use TeamCreate: name=`parallel-build-{HHMMSS}`.

Report: "Team parallel-build-{HHMMSS} created. Building {N} features
in parallel on separate branches."

### 5. Spawn Build Agents

Create one task per feature (TaskCreate). All independent, no dependencies.

Spawn one general-purpose agent per feature in parallel.

Each agent:
- Name: `build-{N}` (e.g., `build-1`, `build-2`)
- subagent_type: general-purpose
- mode: acceptEdits
- Prompt: Include instructions below

```
You are building feature on branch {branch-name}.

Setup
1. git checkout {branch-name}
2. Verify correct branch

Feature Specification
{feature description or plan content}

Build Workflow (sequential, all roles performed by you)

Architecture Check (2 min max)
- Design flaws?
- File boundaries + module structure reasonable?
- Critical blockers?
If critical flaw found: note + proceed with best judgment.

Implementation
- Create/modify files as needed
- Follow project conventions
- Clean, readable code
- Handle errors appropriately

Tests
- Cover happy paths, edge cases, errors
- Run test suite
- Fix failures
- Record results

Self-Review
- Code quality + readability
- Error handling complete?
- Test coverage gaps?
- Security issues?
Note issues by severity (critical/high/medium/low).

Fix Issues
- Address critical + high severity issues from review
- Re-run tests after fixes

Reporting
Send message to team lead:
1. Status (success/failed + why)
2. Build summary
3. Files created/modified
4. Test results (pass/fail counts + failures)
5. Review findings (severity + fixes applied)
6. Remaining concerns
```

Wait for ALL agents to complete.

**Agent failure handling**: If an agent fails (error message, goes
idle without results after 2 prompts):
1. Send status check: "Status update? What progress so far?"
2. If still no response, mark feature as "Failed"
3. Continue collecting results from other agents
4. Do NOT retry -- each agent is on its own branch, partial state
   may exist. Note in report for manual recovery.

Report agent completions as they arrive:
"build-{N} complete ({done}/{total}). Feature: {name} -- {status}."

### 6. Collect Results

Gather from each agent's messages:
- Success vs failed features
- Files changed per feature
- Test results per feature
- Review findings per feature

### 7. Aggregate Report

Generate timestamp `YYYYMMDD-HHMMSS`. Save to `.jim/notes/parallel-build-{timestamp}.md`:

```markdown
# Parallel Build Report

Built: {ISO timestamp}
Base Branch: {base branch}
Features: {count}

## Summary

| Feature | Branch | Status | Files | Tests | Issues |
|---------|--------|--------|-------|-------|--------|
| {name} | {branch} | Success/Failed | {n} | Pass/Fail | {n} |

## Details

### Feature 1: {name}
Branch: {branch}
Status: {success/failed}

**Built**
{summary from agent}

**Files Changed**
- {paths}

**Tests**
{pass/fail details}

**Review**
{findings summary}

### Feature 2: {name}
{same structure}

## Next
- Review: `gt checkout {branch}`
- Submit: `gt submit` per branch
- `/submit` per branch individually
```

### 8. Return to Base

`git checkout {base-branch}`

### 9. Shut Down Team

Send shutdown requests to all agents. After confirmed, call TeamDelete.

### 10. Results to User

- Feature count + success/failure split
- Per-feature one-liner (branch + status)
- Test overview (all pass or failures listed)
- Report path
- Suggest next:
  - `gt checkout {branch}` review each
  - `/submit` per branch for PRs
  - Fix failed features manually
