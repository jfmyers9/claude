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

Build multiple independent features in parallel, each on its own
Graphite branch. Each feature runs through a full build workflow
(architecture check, implementation, testing, review) as an
independent agent on a separate branch.

## Instructions

### 1. Parse Arguments

Parse `$ARGUMENTS` to extract multiple feature specifications.
Features can be:

- **Quoted strings**: `"add rate limiting" "add caching layer"`
- **File paths** (ending in `.md`): `plans/auth.md plans/logging.md`
- **Unquoted words** separated by spaces (only if clearly distinct
  feature names)

Split on quoted boundaries first, then treat remaining tokens as
file paths if they end in `.md`, otherwise reject ambiguous input
and ask the user to quote feature descriptions.

**Validation:**
- Minimum 2 features required. If only 1, suggest using
  `/team-build` instead and exit.
- Maximum 5 features to keep costs manageable. If more than 5,
  warn the user and exit.
- If any file path doesn't exist, warn and exit.

For each feature, determine its specification:
- If it's a `.md` file path, read the file content as the plan
- Otherwise, use the quoted string as the feature description

### 2. Pre-flight Checks

Run these checks before creating any branches:

1. **Clean working tree**: Run `git status --porcelain`. If there
   are uncommitted changes, warn the user and exit. Parallel
   builds require a clean tree to avoid carrying changes into
   feature branches.

2. **Record base branch**: Run `git branch --show-current` and
   store it. All feature branches will stack on this branch, and
   we return here at the end.

3. **Verify Graphite CLI**: Run `gt --version`. If `gt` is not
   found, tell the user to install Graphite CLI and exit.

### 3. Create Branches

For each feature, create a Graphite branch:

1. Generate a slug from the feature name: lowercase, replace
   spaces with hyphens, remove special characters, truncate
   to 40 characters. Prefix with `jm/feat-` (e.g.,
   `jm/feat-add-rate-limiting`).

2. Make sure we're on the base branch before creating each new
   branch: `git checkout {base-branch}`

3. Run `gt create {branch-name}` to create the branch on the
   Graphite stack.

4. Store the mapping: feature description/plan -> branch name.

After creating all branches, return to the base branch:
`git checkout {base-branch}`

### 4. Create the Team

Generate a timestamp in `HHMMSS` format. Use TeamCreate to
create a team named `parallel-build-{HHMMSS}`.

### 5. Create Tasks and Spawn Build Agents

Create one task per feature with TaskCreate. All tasks are
independent (no dependencies between features).

Spawn one general-purpose agent per feature, all in parallel.
Each agent receives:

- **Name**: `build-{N}` (e.g., `build-1`, `build-2`)
- **subagent_type**: general-purpose (needs full read/write)
- **Prompt**: Include the following in each agent's instructions:

```
You are building a feature on branch {branch-name}.

## Setup
1. Run: git checkout {branch-name}
2. Verify you're on the correct branch

## Feature Specification
{feature description or plan content}

## Build Workflow

Follow this workflow sequentially. You are a single agent
performing all roles.

### Step 1: Architecture Check (2 minutes max)
Quick sanity check before writing code:
- Are there obvious design flaws?
- Are file boundaries and module structure reasonable?
- Any critical blockers?

If you find a critical flaw, note it and proceed with your
best judgment on how to address it.

### Step 2: Implementation
Build the feature:
- Create/modify files as needed
- Follow existing project conventions
- Write clean, readable code
- Handle errors appropriately

### Step 3: Write and Run Tests
- Write tests covering happy paths, edge cases, errors
- Run the test suite
- Fix any failing tests
- Record pass/fail results

### Step 4: Self-Review
Review your own implementation for:
- Code quality and readability
- Error handling completeness
- Test coverage gaps
- Security considerations

Note any issues by severity (critical/high/medium/low).

### Step 5: Fix Issues
Address any critical or high severity issues found in review.
Re-run tests after fixes.

## Reporting
When done, send a message to the team lead with:
1. Status: success or failed (and why)
2. Summary of what was built
3. List of all files created or modified
4. Test results (pass/fail counts, failure details)
5. Review findings (issues by severity, what was fixed)
6. Any remaining concerns
```

Wait for ALL build agents to complete.

### 6. Collect Results

After all agents finish, gather results from each agent's
messages:
- Which features succeeded vs failed
- Files changed per feature
- Test results per feature
- Review findings per feature

### 7. Generate Aggregate Report

Generate a timestamp in `YYYYMMDD-HHMMSS` format. Save the
report to `.jim/notes/parallel-build-{timestamp}.md`:

```markdown
# Parallel Build Report

Built: {ISO timestamp}
Base Branch: {base branch}
Features: {count}

## Feature Summary

| Feature | Branch | Status | Files | Tests | Issues |
|---------|--------|--------|-------|-------|--------|
| {name} | {branch} | Success/Failed | {n} | Pass/Fail | {n} |

## Feature Details

### Feature 1: {name}
Branch: {branch}
Status: {success/failed}

#### What Was Built
{summary from agent}

#### Files Changed
- {paths}

#### Test Results
{pass/fail details}

#### Review Findings
{summary of review findings}

### Feature 2: {name}
{same structure}

## Next Steps
- Review each branch: `gt checkout {branch}`
- Submit PRs: `gt submit` on each branch
- Or use /submit on each branch individually
```

### 8. Return to Base Branch

Run `git checkout {base-branch}` to return to the starting
branch.

### 9. Shut Down Team

Send shutdown requests to all build agents and clean up the
team with TeamDelete.

### 10. Present Results

Display to the user:
- How many features were built, how many succeeded/failed
- One-line summary per feature with branch name and status
- Test results overview (all passing, or which failed)
- Path to the full aggregate report
- Suggest next steps:
  - `gt checkout {branch}` to review each feature
  - `/submit` on each branch to create PRs
  - Address any failed features manually
