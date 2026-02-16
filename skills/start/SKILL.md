---
name: start
description: >
  Create a new Graphite branch.
  Triggers: /start, "start new branch", "begin work on".
allowed-tools: Bash
argument-hint: "<branch-name>"
---

# Start New Branch Workflow

Creates a new Graphite branch.

## Steps

1. **Parse arguments**
   - Extract branch name from `$ARGUMENTS`
   - If no branch name → tell user: `/start <branch-name>`, stop

2. **Normalize branch name**
   - Prefix with `jm/` if not already prefixed

3. **Check working directory**
   - Run `git status --porcelain`
   - If uncommitted changes exist → warn user but continue

4. **Create Graphite branch**
   - Run `gt create <branch-name>`

5. **Confirm completion**
   - Report branch created
   - Suggest: `/explore` to plan work or `/implement` to start building
