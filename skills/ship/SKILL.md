---
name: ship
description: Sync branch with master and create a PR using git-town
allowed-tools: Bash
argument-hint: "[--sync-only]"
---

# Ship It

Run the git-town workflow to ship the current branch:

1. Check for uncommitted changes - if present, warn the user and stop
2. Run `git sync` to rebase the branch with master and push it
   - If `git sync` fails (non-zero exit code), display the error and stop
3. Check if a PR already exists using `gh pr view --json url 2>/dev/null`
   - Note: `gh` CLI is only used for read-only PR detection, never for creating PRs
4. If PR exists (or `--sync-only` flag provided): skip propose, show existing PR URL
5. If no PR exists: run `git propose` to create one
   - If `git propose` fails (non-zero exit code), display the error and stop

Wait for each command to complete and show the user the output. If there's a
PR URL (new or existing), display it prominently so the user can click it.
