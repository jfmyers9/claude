---
name: submit
description: >
  Sync branches and create/update PRs via Graphite with beads state sync.
  Triggers: /submit, "submit PR", "push branch", "create PR".
allowed-tools: Bash
argument-hint: "[--stack] [--sync-only] [--ready]"
---

# Submit Workflow

Syncs branches and creates/updates PRs via Graphite with beads state integration.

## Steps

1. **Sync beads state**
   - Run `bd sync` to export beads state to JSONL

2. **Verify clean working tree**
   - Run `git status --porcelain`
   - If output is non-empty → warn user about uncommitted changes and stop

3. **Restack branches**
   - Run `gt restack --only`
   - If exit code is non-zero → show error and stop

4. **Check for sync-only mode**
   - If `$ARGUMENTS` contains `--sync-only` → stop here (restack complete)

5. **Build submit command**
   - Base: `gt submit`
   - If `$ARGUMENTS` contains `--stack` → add `--stack`
   - If `$ARGUMENTS` contains `--ready` → add `--no-draft`
   - Default: creates draft PR (no additional flags)

6. **Execute submit**
   - Run the constructed command
   - Capture and display output

7. **Show PR URLs**
   - Extract and display PR URLs prominently from output

8. **Optional: Create PR gate**
   If beads is initialized and a PR was created:
   ```bash
   PR_NUM=$(gh pr view --json number -q .number)
   bd gate create --await "gh:pr:$PR_NUM" --timeout 48h
   ```
   This creates a gate that other beads workflows can wait on
   (e.g., a deployment task blocked until PR merges).
   Only create if there's a downstream workflow that needs it.
