---
name: gt
description: >
  Wrap common Graphite CLI operations for branch management and stacking.
  Triggers: /gt
allowed-tools: Bash
argument-hint: "[log|restack|sync|info|amend|up|down|top|bottom] [flags]"
---

Parse `$ARGUMENTS` for Graphite subcommand and flags.

**Supported operations:**
- `log` → show branch stack
- `restack` → rebase stack
- `sync` → sync with remote
- `info` → show current branch info
- `amend` → amend current branch commit
- `up`/`down`/`top`/`bottom` → navigate stack
- No args or `help` → list commands

**After state-changing ops** (restack, sync, amend): run `bd sync`

**Implementation:**

```bash
cmd="${ARGUMENTS%% *}"
[ -z "$cmd" ] && cmd="help"

case "$cmd" in
  log|restack|sync|info|amend|up|down|top|bottom)
    gt $ARGUMENTS
    case "$cmd" in
      restack|sync|amend)
        echo ""
        echo "Syncing beads..."
        bd sync
        ;;
    esac
    ;;
  help|*)
    echo "Usage: /gt [command] [flags]"
    echo ""
    echo "Commands:"
    echo "  log      Show branch stack"
    echo "  restack  Rebase stack"
    echo "  sync     Sync with remote"
    echo "  info     Show current branch info"
    echo "  amend    Amend current branch commit"
    echo "  up       Move up in stack"
    echo "  down     Move down in stack"
    echo "  top      Jump to top of stack"
    echo "  bottom   Jump to bottom of stack"
    ;;
esac
```
