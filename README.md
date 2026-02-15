# Claude Code Configuration

Portable Claude Code configuration with skills, rules, and
filesystem-based issue tracking. Symlinks into `~/.claude/` for
consistent setup across machines.

## Installation

```bash
git clone <your-repo-url> ~/dotfiles/claude-config
cd ~/dotfiles/claude-config
./install.sh
```

The installer symlinks CLAUDE.md, settings.json, statusline.py,
skills, and rules into `~/.claude/`.

## Structure

```
├── .claude/           # Claude Code project config
├── CLAUDE.md          # Global instructions for all sessions
├── install.sh         # Symlink installer
├── README.md
├── rules/             # Coding rules
│   ├── comment-quality.md
│   ├── context-budget.md
│   ├── pr-workflow.md
│   ├── style.md
│   └── test-quality.md
├── settings.json      # Model, permissions, env vars
├── skills/            # Skill definitions
└── statusline.py      # Custom status line script
```

### Key files

- **AGENTS.md** -- Instructions for agent teammates. Contains
  work CLI quick reference (`work list`, `work show`,
  `work start`, `work close`) and the "Landing the Plane"
  protocol for session completion (mandatory `git push`).
- **settings.json** -- Model set to Opus. Enables experimental
  agent teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).
  Custom statusline command.
- **rules/** -- Coding standards enforced across all sessions:
  comment quality, context budget, PR workflow, style.

## Skills

### Core Workflow

The primary development cycle:

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **explore** | `/explore "topic"` | Research topics, investigate codebases, create implementation plans stored in issue description |
| **prepare** | `/prepare` | Convert exploration findings into individual issues grouped by label |
| **implement** | `/implement` | Execute implementation plans from issues. Spawns Claude teams for parallel work |
| **review** | `/review` | Senior engineer code review of current branch. Files findings as issues |

### Branch and PR Management

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **start** | `/start <branch>` | Create a new Graphite branch, optionally linked to an issue |
| **commit** | `/commit` | Create conventional commits |
| **submit** | `/submit` | Sync branches and create/update PRs via Graphite |
| **gt** | `/gt <command>` | Wrap common Graphite CLI operations for branch management |
| **resume-work** | `/resume-work` | Resume work on a branch/PR after a break -- summarizes state |

### Maintenance

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **fix** | `/fix` | Convert user feedback on recent implementations into issues |
| **debug** | `/debug` | Systematically diagnose and fix bugs, CI failures, and test failures |
| **respond** | `/respond` | Triage PR review feedback -- analyze validity, recommend actions |
| **refine** | `/refine` | Simplify code and improve comments in uncommitted changes |

### Meta

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **writing-skills** | `/writing-skills` | Create new skills with proper directory structure and frontmatter |

## Issues Workflow

All plans, notes, and state live in issues -- no filesystem
documents. The `work` CLI is the interface:

```bash
work list --status=open  # Find available work
work show <id>           # View issue details
work create "<title>"    # Create a new issue
work edit <id>           # Update fields
work start <id>          # Claim work (open → active)
work close <id>          # Mark work complete
work comment <id> "msg"  # Add notes
work log <id>            # View history
```

### Issue Fields

- **title** -- What needs to be done
- **description** -- Plans, findings, acceptance criteria
- **priority** -- Lower number = higher priority
- **labels** -- Categorization and grouping
- **assignee** -- Who's working on it
- **status** -- open, active, done, cancelled

### Typical Cycle

```
/explore "topic"     -> creates issue with findings in description
/prepare             -> creates individual issues grouped by label
/implement           -> executes via team workers (parallel)
/review              -> files findings as issues
/commit              -> conventional commit
/submit              -> PR via Graphite
```

### Phase-Based Planning

Complex features use multi-phase implementation plans stored in
the issue description. Phase markers follow these patterns:

- `**Phase N: Description**` (bold inline)
- `### Phase N: Description` (heading)

Each phase is independently reviewable and testable. The
`/implement` skill detects phases and executes them sequentially,
allowing commits and review between phases.

## Team Execution

The team system enables parallel execution of independent tasks
via Claude teams. When `/prepare` creates issues with a shared
group label, running `/implement --label=<group>`:

1. Finds all open issues with the group label
2. Spawns a Claude team with one worker per issue
3. Workers execute their tasks in parallel
4. Progress is tracked via issue status updates

This uses the experimental `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`
feature enabled in settings.json.

## Rules

Five rule files enforce coding standards:

- **style.md** -- Simple readable code, meaningful names, small
  focused functions, no over-engineering
- **comment-quality.md** -- Comments must say what code cannot;
  no restatements, no empty docstrings
- **test-quality.md** -- Every test must catch a realistic bug;
  mocks are a last resort
- **pr-workflow.md** -- Always use Graphite (`gt submit`), leave
  PRs in draft, never force push
- **context-budget.md** -- Treat context window as finite memory;
  pipe verbose output, summarize for subagents

## What's NOT Included

Runtime and sensitive files that shouldn't be versioned:

- `.credentials.json` -- Authentication credentials
- `history.jsonl` -- Command history
- `cache/`, `projects/`, `plugins/` -- Runtime data
