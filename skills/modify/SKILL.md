---
name: modify
description: Amend the current branch and auto-restack descendants using Graphite
allowed-tools: Bash
argument-hint: "[-m \"commit message\"]"
---

# Modify Branch

Amend current branch with staged changes + auto-restack descendants:

1. Verify staged changes exist (warn if none)
2. Parse args: `-m "message"` to update commit message (optional)
3. Run `gt modify [-m "message"]`
   - Amends current branch commit with staged changes
   - Auto-restacks descendant branches
4. Display output

Graphite equivalent of `git commit --amend` with automatic stack
restacking. Use when updating commit with stacked branches above it.
