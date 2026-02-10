---
name: modify
description: >
  Amend current branch + auto-restack descendants via Graphite.
  Triggers: /modify, "amend branch", "update branch commit".
allowed-tools: Bash
argument-hint: "[-m \"commit message\"]"
---

# Modify Branch

Graphite equivalent of `git commit --amend` with automatic
stack restacking.

## Steps

1. Verify staged changes exist (`git diff --cached --quiet`)
   - Nothing staged → warn user, stop
2. Parse `$ARGUMENTS`: `-m "message"` → pass to gt modify
3. Run `gt modify [-m "message"]`
4. Show output

Use when updating a commit that has stacked branches above it.
