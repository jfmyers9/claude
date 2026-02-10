---
name: continue-explore
description: |
  Continue existing exploration with feedback.
  Triggers: 'continue exploring', 'refine exploration',
  'update the plan'.
allowed-tools: Bash, Read, Task
argument-hint: "[<existing-doc>] <feedback>"
---

# Continue Explore

Shortcut for `/explore --continue`.

## Instructions

Invoke `/explore --continue $ARGUMENTS`

If no arguments: find most recent `.jim/plans/*.md`, display
summary, ask user what to refine.
