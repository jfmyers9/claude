---
name: start
description: Start a new track of work by creating an empty Graphite branch
allowed-tools: Bash
argument-hint: "<branch-name>"
---

# Start New Work

Create a new empty branch on the Graphite stack to begin a new track of
work. This is the entry point for the workflow lifecycle.

1. Check that a branch name was provided in `$ARGUMENTS`
   - If no branch name, tell the user: "Please provide a branch name:
     `/start <branch-name>`"
   - Stop if no branch name
2. Check for uncommitted changes with `git status --porcelain`
   - If changes exist, warn: "Note: You have uncommitted changes that
     will carry forward to the new branch."
   - Do NOT block -- proceed anyway
3. Run `gt create $ARGUMENTS` to create an empty branch on the stack
4. Show the output and confirm the new branch was created
5. Suggest next step: "Use `/explore` to plan your work on this branch."
