---
name: ship
description: Sync branch with master and create a PR using git-town
allowed-tools: Bash
argument-hint: "[--sync-only]"
---

# Ship It

Run the git-town workflow to ship the current branch:

1. First run `git sync` to rebase the branch with master and push it
2. Check if a PR already exists for this branch using `gh pr view --json url 2>/dev/null`
3. If PR exists (or `--sync-only` flag provided): skip propose, just show the existing PR URL
4. If no PR exists: run `git propose` to create one

Wait for each command to complete and show the user the output. If there's a PR URL (new or existing), make sure to display it prominently so the user can click it.

If there are uncommitted changes, warn the user and stop - do not commit for them.
