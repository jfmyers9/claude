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
│   ├── review/        # /review - senior engineer code review (branch-based)
│   ├── explore/           # /explore - deep exploration and context gathering
│   ├── continue-explore/  # /continue-explore - continue exploration with feedback
│   ├── implement/         # /implement - execute plans from exploration docs
│   ├── next-phase/        # /next-phase - continue to next phase of implementation
│   ├── review-implementation/  # /review-implementation - review recent implementation
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
- `/review` - Senior engineer code review of current branch changes (branch-based)
- `/explore <description>` - Deeply explore a prompt, gather comprehensive context, and suggest 2-3 potential approaches
- `/continue-explore [file] <feedback>` - Continue an existing exploration with user feedback
- `/implement [doc]` - Execute plans from exploration documents (uses most recent if no doc specified)
- `/next-phase [slug]` - Continue to the next phase of a multi-phase implementation
- `/review-implementation [state-file|slug]` - Review code from recent implementation with clean context

### Code Review

Two review skills serve different purposes:

**Use `/review`:**
- Manual review of current branch before shipping
- Pre-PR review of all branch changes since diverging from main
- Branch-centric: reviews everything on the current feature branch
- Exits if on main/master (must be on a feature branch)
- Saves to: `.jim/notes/review-{timestamp}-{branch}.md`

**Use `/review-implementation`:**
- After running `/implement` or `/next-phase`
- Reviews specific phase implementation with clean context window
- State-based: reads implementation state file to understand what was planned
- Assesses code quality AND adherence to plan
- Provides "Ready to Commit" verdict
- Saves to: `.jim/notes/review-impl-{timestamp}-{slug}.md`
- Can auto-find most recent implementation or accept state file path/slug

**Typical Usage:**
- Use `/review-implementation` after each phase of implementation
- Use `/review` before creating a PR (reviews entire branch)

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
/review-implementation        # Review Phase 1 changes
# Address any issues, test
/commit
/next-phase                   # Executes Phase 2
/review-implementation        # Review Phase 2 changes
# Address any issues, test
/commit
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

**Complete Workflow Example:**

```bash
# 1. Explore the feature
/explore "add user authentication with JWT tokens"

# 2. Implement Phase 1 (Foundation)
/implement
# Creates: .jim/states/active-user-authentication.md
#          .jim/states/20260201-123456-implemented-phase1-user-authentication.md

# 3. Review the implementation
/review-implementation
# Creates: .jim/notes/review-impl-20260201-123500-user-authentication.md
# Shows: Code quality assessment, adherence to plan, ready to commit verdict

# 4. Address any issues from review, then commit
/commit

# 5. Continue to Phase 2
/next-phase
# Updates: .jim/states/active-user-authentication.md
# Creates: .jim/states/20260201-124000-implemented-phase2-user-authentication.md

# 6. Review Phase 2
/review-implementation
# Automatically finds most recent implementation state file

# 7. Commit Phase 2
/commit

# 8. Continue until all phases complete
/next-phase
# If last phase: reports "All phases completed!"
```

## What's NOT included

Runtime/sensitive files that shouldn't be versioned:
- `.credentials.json` - Authentication credentials
- `history.jsonl` - Command history
- `cache/`, `projects/`, `plugins/` - Runtime data
