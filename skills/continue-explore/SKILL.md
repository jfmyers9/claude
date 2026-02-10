---
name: continue-explore
description: Continue an existing exploration with user feedback
allowed-tools: Bash, Read, Task
argument-hint: "[file-path] <feedback>"
---

# Continue Explore Skill

Shortcut for `/explore` with an existing document. Routes to
explore skill's continue mode.

## Instructions

Invoke `/explore $ARGUMENTS`

If no arguments: find most recent `.jim/plans/*.md`, display
summary, ask user what to refine.
