---
name: submit
description: Sync branch and create/update PRs using Graphite
allowed-tools: Bash
argument-hint: "[--stack] [--sync-only]"
---

# Submit

Run the Graphite workflow to submit the current branch:

1. Check for uncommitted changes - if present, warn the user and stop
2. Run `gt sync` to sync from remote and rebase the stack
   - If `gt sync` fails (non-zero exit code), display the error and stop
3. If `--sync-only` flag provided: stop after sync, do not submit
4. Run `gt submit` to push and create/update PRs
   - Use `gt submit --stack` if `--stack` flag provided (submits entire stack)
   - If `gt submit` fails (non-zero exit code), display the error and stop

Wait for each command to complete and show the user the output. Display any
PR URLs prominently so the user can click them.
