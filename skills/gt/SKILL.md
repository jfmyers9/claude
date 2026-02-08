---
name: gt
description: Basic Graphite operations for branch management
allowed-tools: Bash
argument-hint: "restack | log | up | down | checkout"
---

# Graphite Operations

Execute `gt` commands for branch management.

## Commands

- **restack**: `gt restack --only` (restack current branch)
- **log**: `gt log` (show stack visually)
- **up**: `gt up` (move to child branch)
- **down**: `gt down` (move to parent branch)
- **checkout**: `gt checkout` (interactive selection)

Default: `gt log`

Output result to user.
