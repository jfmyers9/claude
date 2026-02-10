---
name: submit
description: >
  Sync branch + create/update PRs via Graphite.
  Triggers: /submit, "submit PR", "push branch", "create PR".
allowed-tools: Bash
argument-hint: "[--stack] [--sync-only] [--ready]"
---

# Submit

## Steps

1. Verify no uncommitted changes (`git status --porcelain`)
   - Changes present → warn, stop
2. Run `gt restack --only`
   - Non-zero exit → show error, stop
3. If `--sync-only` in `$ARGUMENTS` → stop (don't submit)
4. Build submit command:
   - Base: `gt submit`
   - `--stack` in `$ARGUMENTS` → add `--stack`
   - `--ready` in `$ARGUMENTS` → add `--no-draft`
   - Default: draft PR (no extra flags)
5. Run submit command
6. Show output + display PR URLs prominently
