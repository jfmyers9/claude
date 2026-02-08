---
name: start
description: Start a new track of work by creating an empty Graphite branch
allowed-tools: Bash
argument-hint: "<branch-name> (auto-prefixed with jm/)"
---

# Start New Work

Create empty branch on Graphite stack to begin new work. Entry point for
workflow lifecycle.

1. Check `$ARGUMENTS` for branch name
   - If missing: tell user "Please provide a branch name: `/start <branch-name>`"
   - Stop if absent
2. Prefix with `jm/`
   - If already starts with `jm/`: use as-is
   - Else: prepend `jm/` -> `jm/$ARGUMENTS`
   - Store final name for next step
3. Check uncommitted changes: `git status --porcelain`
   - If exist: warn "Note: You have uncommitted changes that will carry
     forward to the new branch."
   - Do NOT block -- proceed anyway
4. Run `gt create {final-branch-name}` to create empty branch on stack
5. Show output + confirm branch created
6. Suggest: "Use `/explore` to plan your work on this branch."
