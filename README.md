# Claude Code Configuration

My portable Claude Code configuration for consistent setup across machines.

## Usage

Clone this repo and symlink the directories to `~/.claude/`:

```bash
git clone <your-repo-url> ~/dotfiles/claude-config

# Symlink individual files and directories
ln -sf ~/dotfiles/claude-config/CLAUDE.md ~/.claude/CLAUDE.md
ln -sf ~/dotfiles/claude-config/settings.json ~/.claude/settings.json
ln -sf ~/dotfiles/claude-config/skills ~/.claude/skills
ln -sf ~/dotfiles/claude-config/rules ~/.claude/rules
```

Or add to your dotfiles install script.

## Structure

```
├── CLAUDE.md          # Global instructions for all sessions
├── settings.json      # Model, plugins, permissions
├── skills/
│   ├── ship/          # /ship - git sync && git propose
│   ├── commit/        # /commit - conventional commits
│   ├── resume-work/   # /resume-work - branch and PR summary
│   ├── refine/        # /refine - simplify code and improve comments
│   ├── explore/           # /explore - deep exploration and context gathering
│   ├── continue-explore/  # /continue-explore - continue exploration with feedback
│   ├── implement/         # /implement - execute plans from exploration docs
│   ├── save-state/        # /save-state - save work state for later
│   ├── load-state/        # /load-state - load saved work state
│   └── list-states/       # /list-states - list all saved states
└── rules/
    └── style.md       # Coding preferences
```

## Skills

- `/ship` - Runs git-town workflow: sync branch with master and create PR
- `/commit [message]` - Create a conventional commit (auto-generates message if not provided)
- `/resume-work [branch]` - Summarize current branch and PR state to help resume work
- `/refine [pattern]` - Simplify code and improve comments in uncommitted changes before committing
- `/explore <description>` - Deeply explore a prompt, gather comprehensive context, and suggest 2-3 potential approaches
- `/continue-explore [file] <feedback>` - Continue an existing exploration with user feedback
- `/implement [doc]` - Execute plans from exploration documents (uses most recent if no doc specified)

### State Management

- `/save-state [label]` - Save current work state to `.jim/states/` for resuming later (defaults to "current")
- `/load-state [label]` - Load a saved work state to resume where you left off
- `/list-states` - List all saved states with names, dates, and summaries

## What's NOT included

Runtime/sensitive files that shouldn't be versioned:
- `.credentials.json` - Authentication credentials
- `history.jsonl` - Command history
- `cache/`, `projects/`, `plugins/` - Runtime data
