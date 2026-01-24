---
name: ship
description: Sync branch with master and create a PR using git-town
allowed-tools: Bash
---

# Ship It

Run the git-town workflow to ship the current branch:

1. First run `git sync` to rebase the branch with master and push it
2. Then run `git propose` to create a PR

Wait for each command to complete and show the user the output. If git propose outputs a URL, make sure to display it prominently so the user can click it.

If there are uncommitted changes, warn the user and stop - do not commit for them.
