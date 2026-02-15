---
name: submit
description: >
  Sync branches and create/update PRs via Graphite.
  Triggers: /submit, "submit PR", "push branch", "create PR".
allowed-tools: Bash
argument-hint: "[--stack] [--sync-only] [--ready]"
---

# Submit Workflow

Syncs branches and creates/updates PRs via Graphite.

## Steps

1. **Verify clean working tree**
   - Run `git status --porcelain`
   - If output is non-empty → warn user about uncommitted changes
     and stop

2. **Worktree detection**
   - Run `git rev-parse --git-common-dir` and `git rev-parse --git-dir`
   - If they differ → working in a worktree
   - Run `gt track 2>/dev/null` to ensure Graphite tracks this
     worktree's branch

3. **Restack branches**
   - Run `gt restack --only`
   - If exit code is non-zero → show error and stop

4. **Check for sync-only mode**
   - If `$ARGUMENTS` contains `--sync-only` → stop here
     (restack complete)

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

8. **Transition active issue to review**
   - Run `work list --status=active --format=json 2>/dev/null`
   - Find issue linked to current branch (match branch name or
     check issue description)
   - If found: `work review <id>` to signal code is in PR review
   - If no active issue found → skip silently
