---
name: gt
description: Basic Graphite operations for branch management
allowed-tools: Bash
argument-hint: "sync | log | up | down | checkout"
---

# Graphite Operations

Run basic Graphite commands for branch management. This skill handles
common operations that don't need their own dedicated skill.

## Commands

Execute the appropriate `gt` command based on the argument:

- **sync**: Run `gt sync` to sync from remote, delete merged branches
- **log**: Run `gt log` to show the current stack visually
- **up**: Run `gt up` to move up the stack (to child branch)
- **down**: Run `gt down` to move down the stack (to parent branch)
- **checkout**: Run `gt checkout` for interactive branch selection

If no argument provided, default to `gt log` to show the current stack.

Show the command output to the user.
