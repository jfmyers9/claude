---
name: submit
description: Sync branch and create/update PRs using Graphite
allowed-tools: Bash
argument-hint: "[--stack] [--sync-only]"
---

# Submit

Graphite workflow to submit current branch:

1. Verify no uncommitted changes (warn + stop if present)
2. Run `gt restack --only` to restack branch
   - Fail on non-zero exit, display error
3. If `--sync-only` flag: stop (don't submit)
4. Run `gt submit` to push + create/update PRs
   - Use `gt submit --stack` if `--stack` flag provided
   - Fail on non-zero exit, display error

Show output for each command + display PR URLs prominently.
