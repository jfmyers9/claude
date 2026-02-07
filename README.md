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
ln -sf ~/dotfiles/claude-config/agents ~/.claude/agents
ln -sf ~/dotfiles/claude-config/rules ~/.claude/rules
```

Or add to your dotfiles install script.

## Structure

```
├── CLAUDE.md          # Global instructions for all sessions
├── settings.json      # Model, plugins, permissions
├── agents/
│   ├── researcher.md  # Fast codebase researcher (haiku)
│   ├── reviewer.md    # Mentoring code reviewer (sonnet)
│   ├── architect.md   # System design analyst (sonnet)
│   ├── implementer.md # Focused code builder (inherit)
│   ├── tester.md      # Test specialist (sonnet)
│   └── devil.md       # Devil's advocate (sonnet)
├── skills/
│   ├── start/         # /start - start new work on empty Graphite branch
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
│   ├── feedback/          # /feedback - provide user feedback on implementations
│   ├── save-state/        # /save-state - save work state for later
│   ├── load-state/        # /load-state - load saved work state
│   ├── list-states/       # /list-states - list all saved states
│   ├── archive/           # /archive - archive old .jim files
│   ├── list-archive/      # /list-archive - list archived content
│   ├── team-review/       # /team-review - parallel code review team
│   ├── team-debug/        # /team-debug - adversarial debugging team
│   ├── team-build/        # /team-build - feature build team
│   └── team-explore/      # /team-explore - deep research team
└── rules/
    └── style.md       # Coding preferences
```

## Skills

- `/start <branch-name>` - Start a new track of work by creating an empty Graphite branch (auto-prefixed with `jm/`)
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
- `/feedback <feedback> [--type=bug|quality|change]` - Provide user feedback on recent implementation and apply fixes directly
- `/team-review [file pattern or branch]` - Spawn a parallel code review team (reviewer, architect, devil)
- `/team-debug <bug description>` - Spawn an adversarial debugging team with competing hypotheses
- `/team-build <feature description or doc path>` - Spawn a feature build team (implementer, tester, reviewer)
- `/team-explore <topic>` - Spawn a deep research team (researcher, architect, devil)

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

### User Feedback Workflow

While `/review-implementation` and `/address-review` handle AI-generated
feedback, the `/feedback` skill handles user-provided feedback on
implementations.

**Use `/feedback` when:**
- Something isn't working as expected (bugs)
- You have code quality concerns (naming, readability, patterns)
- You want to add or change something in the implementation

**How it works:**
1. Finds the most recent implementation context (state files or git diff)
2. Categorizes feedback (bug, quality, or change request)
3. Applies fixes directly to the code
4. Creates a feedback document in `.jim/notes/`
5. Prompts for verification that the fix addressed your concern

**Basic Usage:**
```bash
/feedback "The API call fails when username is empty"
/feedback "The function names are inconsistent" --type=quality
/feedback "Add rate limiting to the endpoint" --type=change
```

**Feedback Types:**
- `bug` - Runtime issues, errors, unexpected behavior
- `quality` - Code style, naming, readability concerns
- `change` - Feature additions or modifications

If `--type` is not specified, the skill infers the type from your feedback.

**Feedback vs. Other Skills:**

| Scenario | Use |
|----------|-----|
| AI identifies issues during review | `/address-review` |
| You find a bug while testing | `/feedback` |
| You want to refine the plan before implementation | `/continue-explore` |
| You want to change already-implemented code | `/feedback` |
| You want a fresh review of the code | `/review-implementation` |

**Example Workflows:**

*Bug fix workflow:*
```bash
/implement                            # Implement feature
# Test the implementation
/feedback "Login fails with special characters in password"
# Claude identifies the issue, applies fix
git diff                              # Review the fix
/commit
```

*Quality improvement workflow:*
```bash
/implement --review                   # Implement + AI review
/address-review                       # Fix AI-identified issues
# Manual testing
/feedback "The helper functions should be in a separate file"
git diff                              # Review changes
/commit
```

*Iterative feedback workflow:*
```bash
/implement
/feedback "Add input validation for email field"
# Claude applies changes
/feedback "Also validate the phone number format"
# Claude applies additional changes
git diff                              # Review all changes
/commit
```

*Combined AI and user feedback:*
```bash
/implement --review                   # Implement + AI review
/address-review --priority=high       # Fix critical AI issues
/feedback "The error messages should be more user-friendly"
git diff                              # Review all changes
/commit
```

**Feedback Documents:**

Each feedback session creates a document at `.jim/notes/feedback-{timestamp}.md`
containing:
- Original feedback and categorization
- Analysis of the issue
- Actions taken and files modified
- Verification steps

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
/start auth-feature           # Create branch for new work
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
/start auth-feature           # Create branch for new work
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
/start auth-feature           # Create branch for new work
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
# 1. Start a new track of work
/start jwt-auth

# 2. Explore the feature
/explore "add user authentication with JWT tokens"

# 3. Implement Phase 1 (Foundation)
/implement
# Creates: .jim/states/active-user-authentication.md
#          .jim/states/20260201-123456-implemented-phase1-user-authentication.md

# 4. Review the implementation
/review-implementation
# Creates: .jim/notes/review-impl-20260201-123500-user-authentication.md
# Shows: Code quality assessment, adherence to plan, ready to commit verdict

# 5. Address any issues from review, then commit
/commit

# 6. Continue to Phase 2 with auto-review
/next-phase --review
# Updates: .jim/states/active-user-authentication.md
# Creates: .jim/states/20260201-124000-implemented-phase2-user-authentication.md
# Runs: /review-implementation automatically
# Creates: .jim/notes/review-impl-20260201-124010-user-authentication.md
# Output includes review summary inline

# 7. Address any issues, then commit Phase 2
/commit

# 8. Continue until all phases complete
/next-phase
# If last phase: reports "All phases completed!"
```

## Custom Agents

Custom agents are specialized AI personas defined in `agents/`.
Each agent has a focused role, specific tool access, and a distinct
communication style. They can be used individually or as teammates
in team skills.

**Using agents individually:**
```
Use the researcher agent to find all files related to authentication.
Use the architect agent to analyze the module structure.
Use the devil agent to stress-test this API design.
```

### Agent Reference

| Agent | Model | Tools | Description |
|-------|-------|-------|-------------|
| **researcher** | haiku | Read, Grep, Glob, Bash | Fast codebase researcher for finding files, tracing code paths, and gathering context |
| **reviewer** | sonnet | Read, Grep, Glob, Bash | Senior code reviewer with mentoring style; has persistent user memory |
| **architect** | sonnet | Read, Grep, Glob, Bash | System design analyst in plan mode; evaluates design patterns and tradeoffs |
| **implementer** | inherit | All (acceptEdits) | Focused builder that follows plans precisely and writes clean code |
| **tester** | sonnet | Read, Grep, Glob, Bash, Write, Edit | Test specialist who writes thorough tests and validates correctness |
| **devil** | sonnet | Read, Grep, Glob, Bash | Devil's advocate who challenges assumptions, finds edge cases, and stress-tests ideas |

**Key details:**
- `researcher` uses haiku for speed on read-only research tasks
- `reviewer` has `memory: user` for cross-session learning of
  codebase patterns and conventions
- `architect` uses `permissionMode: plan` (read-only analysis with
  design proposals)
- `implementer` uses `model: inherit` (matches your current model)
  and `permissionMode: acceptEdits` (full implementation capability)
- `tester` has Write and Edit tools for creating test files
- `devil` is read-only; constructive criticism, not destructive

## Team Skills

Team skills orchestrate multiple custom agents into coordinated
teams for common development workflows. They use the experimental
Agent Teams feature (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`).

### `/team-review` - Parallel Code Review

Spawns three reviewers in parallel, each examining the code from
a different angle, then synthesizes their feedback into a unified
review document.

**Team composition:** reviewer + architect + devil

**What each reviewer focuses on:**
- **reviewer**: Code quality, readability, error handling, style
- **architect**: Design patterns, coupling, cohesion, maintainability
- **devil**: Edge cases, failure modes, security, assumptions

**Scope detection:** Automatically determines what to review from
git state (feature branch diff, uncommitted changes, or specified
files).

**Output:** Unified review saved to
`.jim/notes/team-review-{timestamp}-{branch}.md`

```bash
/team-review                    # Review current branch changes
/team-review "src/**/*.ts"      # Review specific files
```

### `/team-debug` - Adversarial Debugging

Spawns three investigators who each pursue a different hypothesis
about a bug, then synthesizes findings into a root cause analysis.

**Team composition:** 3 researcher agents

**Hypothesis categories:**
1. **Data/State** - Incorrect data, unexpected state, race conditions
2. **Logic/Control flow** - Wrong branching, missing conditions,
   algorithm errors
3. **Integration/Environment** - External dependencies, config
   issues, API misuse

**Output:** Root cause analysis saved to
`.jim/notes/debug-{timestamp}-{slug}.md`

```bash
/team-debug "Login fails when username contains special characters"
/team-debug "API returns 500 after deploying the new middleware"
```

### `/team-build` - Feature Build

Spawns a coordinated build team that implements a feature, writes
tests, and reviews the result in sequence.

**Team composition:** implementer -> tester -> reviewer (sequential)

**Workflow:**
1. **implementer** builds the feature following the plan
2. **tester** writes tests once implementation is ready
3. **reviewer** reviews both implementation and tests

**Input:** Accepts a feature description or path to an exploration
document. If no arguments, looks for the most recent exploration
in `.jim/plans/`.

**Output:** Build report saved to
`.jim/notes/build-{timestamp}-{slug}.md`

```bash
/team-build "Add rate limiting to the API endpoints"
/team-build .jim/plans/20260207-jwt-auth.md
```

### `/team-explore` - Deep Research

Spawns three specialists to explore a topic from multiple angles,
then synthesizes findings into a comprehensive exploration document
compatible with `/implement`.

**Team composition:** researcher + architect + devil (parallel)

**What each specialist does:**
- **researcher**: Broad context gathering, file discovery,
  dependency tracing
- **architect**: Architecture analysis, design pattern evaluation,
  structural considerations
- **devil**: Challenge assumptions, identify risks, find edge cases

**Output:** Exploration document saved to
`.jim/plans/{timestamp}-{topic-slug}.md` (compatible with
`/implement` and `/next-phase`)

```bash
/team-explore "How to add WebSocket support to the server"
/team-explore "Migrating from REST to GraphQL"
```

## What's NOT included

Runtime/sensitive files that shouldn't be versioned:
- `.credentials.json` - Authentication credentials
- `history.jsonl` - Command history
- `cache/`, `projects/`, `plugins/` - Runtime data
