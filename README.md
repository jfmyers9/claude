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
│   ├── next-phase/        # /next-phase - continue to next phase of implementation
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
- `/next-phase [slug]` - Continue to the next phase of a multi-phase implementation

### State Management

- `/save-state [label]` - Save current work state to `.jim/states/` for resuming later (defaults to "current")
- `/load-state [label]` - Load a saved work state to resume where you left off
- `/list-states` - List all saved states with names, dates, and summaries

### Multi-Phase Implementation Workflow

The `/implement` and `/next-phase` skills support multi-phase
implementations for complex features:

**Basic Workflow:**
```bash
/explore "add authentication feature"
/implement                    # Executes Phase 1
# Review changes, test, commit
/next-phase                   # Executes Phase 2
# Review changes, test, commit
/next-phase                   # Executes Phase 3
```

**How It Works:**

1. **Phase Detection**: When `/implement` runs, it looks for phase
   markers in the exploration document's "Next Steps" section:
   - `**Phase N: Name**` (bold inline)
   - `### Phase N: Name` (heading)

2. **Active Tracking**: For multi-phase plans, `/implement` creates
   an active tracking file at `.jim/states/active-{slug}.md` that:
   - Lists all phases with completion status
   - Tracks current progress
   - Records implementation history

3. **Progressive Execution**: Each run of `/next-phase` executes the
   next incomplete phase and updates the tracking file.

4. **Flexibility**:
   - Single-phase plans work as before (backward compatible)
   - Can pause between phases for review/testing/commits
   - Can resume anytime with `/next-phase`
   - Tracking file is human-readable markdown

**Example Phase Structure in Exploration:**

```markdown
## Next Steps

**Phase 1: Foundation**
1. Create directory structure
2. Add configuration files

**Phase 2: Implementation**
3. Build core feature
4. Add error handling

**Phase 3: Testing**
5. Write unit tests
6. Update documentation
```

## What's NOT included

Runtime/sensitive files that shouldn't be versioned:
- `.credentials.json` - Authentication credentials
- `history.jsonl` - Command history
- `cache/`, `projects/`, `plugins/` - Runtime data
