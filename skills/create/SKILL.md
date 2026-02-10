---
name: create
description: >
  Create stacked branch with staged changes via Graphite.
  Triggers: /create, "create branch", "new branch with changes".
allowed-tools: Bash
argument-hint: "[branch-name] [-m \"commit message\"]"
---

# Create Stacked Branch

## Steps

1. Verify staged changes exist (`git diff --cached --quiet`)
   - Nothing staged → warn user, stop
2. Parse `$ARGUMENTS`:
   - `branch-name` → use as branch name
   - `-m "message"` → use as commit message
   - Neither → auto-generate from staged diff
3. Run `gt create [branch-name] [-m "message"]`
4. Show output + new branch name

Branch joins current stack. Use `/submit --stack` for full
stack PRs.
