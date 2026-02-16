---
name: submit
description: >
  Sync branches and create/update PRs via Graphite.
  Triggers: /submit, "submit PR", "push branch", "create PR".
allowed-tools: Bash
argument-hint: "[--stack] [--sync-only] [--ready]"
---

# Submit

Sync branches and create/update PRs via Graphite.

## Arguments

- `--stack` — submit entire stack, not just current branch
- `--sync-only` — restack only, skip PR creation
- `--ready` — mark PR as ready (not draft)

## Steps

1. **Verify clean working tree**
   - Run `git status --porcelain`
   - If output is non-empty → warn user about uncommitted changes and stop

2. **Restack branches**
   - Run `gt restack --only`
   - If exit code is non-zero → show error and stop

3. **Check for sync-only mode**
   - If `$ARGUMENTS` contains `--sync-only` → stop here (restack complete)

4. **Build submit command**
   - Base: `gt submit`
   - If `$ARGUMENTS` contains `--stack` → add `--stack`
   - If `$ARGUMENTS` contains `--ready` → add `--no-draft`
   - Default: creates draft PR (no additional flags)

5. **Execute submit**
   - Run the constructed command
   - Capture and display output

6. **Show PR URLs**
   - Extract and display PR URLs prominently from output
