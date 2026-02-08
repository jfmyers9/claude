---
name: create
description: Create a new stacked branch with staged changes using Graphite
allowed-tools: Bash
argument-hint: "[branch-name] [-m \"commit message\"]"
---

# Create Stacked Branch

Create branch stacked on current branch via Graphite:

1. Verify staged changes exist; warn if not
2. Parse args:
   - `branch-name` -> use as branch name
   - `-m "message"` -> use as commit message
   - Neither -> prompt or auto-generate from staged changes
3. Run `gt create [branch-name] [-m "message"]`
   - Creates branch + stages changes as commit
   - Auto-stacks on current branch
4. Show output + new branch name

Branch joins current stack; submit with `/submit --stack` for full stack PRs.
