---
name: gt
description: >
  Wrap common Graphite CLI operations for branch management
  and stacking. Triggers: /gt
allowed-tools: Bash
argument-hint: "[log|restack|sync|info|amend|up|down|top|bottom] [flags]"
---

# Gt

Wrap Graphite CLI operations for branch management.

## Arguments

- `<command>` — Graphite subcommand
- `[flags]` — passed through to gt

Supported commands: log, restack, sync, info, amend, up,
down, top, bottom.

## Steps

### 1. Parse Command

Extract first word from `$ARGUMENTS`. Default to "help"
if empty.

### 2. Execute

For supported commands: run `gt $ARGUMENTS`.

For unknown commands or no args: display usage listing.

| Command | Action |
|---------|--------|
| log | Show branch stack |
| restack | Rebase stack |
| sync | Sync with remote |
| info | Show current branch info |
| amend | Amend current branch commit |
| up/down | Navigate stack |
| top/bottom | Jump to stack endpoints |
