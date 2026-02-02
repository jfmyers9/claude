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
│   ├── address-review/    # /address-review - address feedback from code reviews
│   ├── save-state/        # /save-state - save work state for later
│   ├── load-state/        # /load-state - load saved work state
│   ├── list-states/       # /list-states - list all saved states
│   ├── archive/           # /archive - archive old .jim files
│   └── list-archive/      # /list-archive - list archived content
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
- `/implement [--review] [doc]` - Execute plans from exploration documents (uses most recent if no doc specified). Use `--review` to automatically run code review after implementation.
- `/next-phase [--review] [slug]` - Continue to the next phase of a multi-phase implementation. Use `--review` to automatically run code review after phase completion.
- `/review-implementation [state-file|slug]` - Review code from recent implementation with clean context
- `/address-review [--priority=high|medium|low] [review-doc|slug]` - Address feedback from code reviews with automated fixes. Defaults to high priority issues only.

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

### Review and Fix Cycle

After a code review identifies issues, you can use `/address-review` to
automatically apply fixes for clear, actionable feedback:

**Workflow:**
```bash
/implement --review              # Implement + auto-review
/address-review                  # Apply automated fixes for high priority issues
/review-implementation           # Verify fixes addressed the concerns (optional)
/commit                          # Commit when clean
```

**How it works:**
1. Reads the review document (most recent, by slug, or by path)
2. Extracts recommendations from the "Recommendations" table and
   "Areas for Improvement" sections
3. Filters by priority level (default: high priority only)
4. Applies safe, automated fixes using the Edit tool
5. Generates a summary of what was fixed and what requires manual
   intervention
6. Saves fix summary to `.jim/notes/fixes-{timestamp}-{slug}.md`

**Priority Filtering:**
```bash
/address-review --priority=high     # Only high priority (default)
/address-review --priority=medium   # High and medium priority
/address-review --priority=low      # All priorities
```

**When to use automated fixes:**
- Simple refactoring (renaming, extracting constants)
- Code style improvements
- Comment additions/removals
- Import additions
- Clear, unambiguous suggestions from review

**When to fix manually:**
- Architecture changes
- Complex logic modifications
- Security vulnerability fixes
- Performance optimizations
- Anything requiring judgment or design decisions

**Note:** `/address-review` is conservative and only applies fixes it's
confident about. Complex issues are flagged in the summary for manual
intervention. Always review the changes with `git diff` before committing.

### State Management

- `/save-state [label]` - Save current work state to `.jim/states/` for resuming later (defaults to "current")
- `/load-state [label]` - Load a saved work state to resume where you left off
- `/list-states` - List all saved states with names, dates, and summaries

### Archive Management

The `.jim/archive/` directory stores old files that you want to keep but not have
Claude access during normal operations. Archived files are ignored by default.

- `/archive <file-path or pattern>` - Move old files from `.jim/` to `.jim/archive/`
- `/list-archive [subdirectory]` - List archived content (optionally filter by plans, states, notes, or scratch)

**When to archive:**
- Old exploration documents that are no longer active
- Completed implementation state files from past projects
- Review notes from merged features
- Any `.jim/` content you want to preserve but not clutter your workspace

**Accessing archived content:**
- Use `/list-archive` to see what's archived
- Ask Claude to "access the archive" or "check archived content" to read archived files
- Manually move files back from `.jim/archive/` if needed

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

**Workflow with Auto-Review:**
```bash
/explore "add authentication feature"
/implement --review           # Executes Phase 1 and runs review automatically
# Address any issues, test
/commit
/next-phase --review          # Executes Phase 2 and runs review automatically
# Address any issues, test
/commit
```

**Workflow with Automated Fixes:**
```bash
/explore "add authentication feature"
/implement --review           # Executes Phase 1 and runs review automatically
/address-review               # Apply automated fixes for high priority issues
git diff                      # Review the automated fixes
/commit
/next-phase --review          # Executes Phase 2 and runs review automatically
/address-review               # Apply automated fixes
/commit
```

**Workflow Variations:**

*Fix all phases at the end:*
```bash
/implement
/next-phase
/next-phase
# All phases complete
/review-implementation        # Review everything
/address-review               # Fix all high priority issues at once
/commit
```

*Selective priority fixing:*
```bash
/implement --review
/address-review --priority=high    # Auto-fix critical issues
# Manually address medium priority issues
git diff                           # Review all changes
/commit
```

*Skip automation (manual fixes only):*
```bash
/implement --review
# Review identifies issues
# Address all issues manually
/review-implementation        # Verify fixes (optional)
/commit
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

**Auto-Review Flag:**

Both `/implement` and `/next-phase` support an optional `--review` flag that
automatically runs code review after implementation completes:

- When `--review` is present, the skill spawns a review agent in a clean
  context window after implementation
- The review agent runs `/review-implementation` on the just-created state file
- Review findings are included in the command output
- Review document is still saved to `.jim/notes/`
- Saves time by combining implementation and review in one command

**When to use `--review`:**
- For rapid iteration when you trust the implementation quality
- When you want immediate feedback without switching contexts
- For small to medium changes where review is quick

**When to run review separately:**
- For large implementations where review needs careful attention
- When you want to test changes before reviewing
- When you need to address implementation issues first

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

# 5. Continue to Phase 2 with auto-review
/next-phase --review
# Updates: .jim/states/active-user-authentication.md
# Creates: .jim/states/20260201-124000-implemented-phase2-user-authentication.md
# Runs: /review-implementation automatically
# Creates: .jim/notes/review-impl-20260201-124010-user-authentication.md
# Output includes review summary inline

# 6. Address any issues, then commit Phase 2
/commit

# 7. Continue until all phases complete
/next-phase
# If last phase: reports "All phases completed!"
```

## What's NOT included

Runtime/sensitive files that shouldn't be versioned:
- `.credentials.json` - Authentication credentials
- `history.jsonl` - Command history
- `cache/`, `projects/`, `plugins/` - Runtime data
