---
name: start
description: >
  Create empty Graphite branch to begin new work.
  Triggers: /start, "start new branch", "begin work on".
allowed-tools: Bash
argument-hint: "<branch-name>"
---

# Start New Work

## Steps

1. Check `$ARGUMENTS` for branch name
   - Missing → tell user: `/start <branch-name>`, stop
2. Prefix with `jm/` (skip if already prefixed)
3. Check `git status --porcelain`
   - Uncommitted changes → warn (don't block)
4. Run `gt create <branch-name>`
5. Confirm branch created
6. Suggest `/explore` to plan work
