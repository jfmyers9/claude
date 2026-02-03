---
name: modify
description: Amend the current branch and auto-restack descendants using Graphite
allowed-tools: Bash
argument-hint: "[-m \"commit message\"]"
---

# Modify Branch

Amend the current branch with staged changes using Graphite:

1. Check for staged changes - if none, warn the user to stage changes first
2. Parse arguments:
   - If `-m "message"` provided, use it to update the commit message
   - Otherwise, keep the existing commit message
3. Run `gt modify [-m "message"]`
   - This amends the current branch's commit with staged changes
   - Graphite automatically restacks all descendant branches
4. Show the output to the user

This is the Graphite equivalent of `git commit --amend` but with automatic
restacking of the entire stack. Use this when you need to update a commit
that has other branches stacked on top of it.
