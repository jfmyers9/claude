---
name: create
description: Create a new stacked branch with staged changes using Graphite
allowed-tools: Bash
argument-hint: "[branch-name] [-m \"commit message\"]"
---

# Create Stacked Branch

Create a new branch stacked on top of the current branch using Graphite:

1. Check for staged changes - if none, warn the user to stage changes first
2. Parse arguments:
   - If `branch-name` provided, use it
   - If `-m "message"` provided, use it as commit message
   - If neither provided, prompt user or auto-generate from staged changes
3. Run `gt create [branch-name] [-m "message"]`
   - This creates a new branch with staged changes as a commit
   - The branch is automatically stacked on the current branch
4. Show the output and new branch name to the user

The new branch becomes part of the current stack and can be submitted with
`/submit --stack` to create PRs for the entire stack.
