# Claude Code Configuration

Portable Claude Code configuration with skills, rules, and
task-based workflow. Symlinks into `~/.claude/` for consistent
setup across machines.

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
├── skills/            # 12 skill definitions
├── statusline.py      # Custom status line script
└── tracked-repos.json
```

### Key files

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
| **explore** | `/explore "topic"` | Research topics, investigate codebases, create implementation plans stored in task metadata |
| **prepare** | `/prepare` | Convert exploration findings into tasks with team configuration |
| **implement** | `/implement` | Execute implementation plans from tasks. Detects team configs and spawns Claude teams for parallel work |
| **review** | `/review` | Senior engineer code review of current branch. Files findings as tasks |

### Branch and PR Management

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **start** | `/start <branch>` | Create a new Graphite branch |
| **commit** | `/commit` | Create conventional commits |
| **submit** | `/submit` | Sync branches and create/update PRs via Graphite |
| **gt** | `/gt <command>` | Wrap common Graphite CLI operations for branch management |
| **resume-work** | `/resume-work` | Resume work on a branch/PR after a break -- summarizes state |

### Maintenance

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **fix** | `/fix` | Convert user feedback on recent implementations into tasks |
| **debug** | `/debug` | Systematically diagnose and fix bugs, CI failures, and test failures |

### Meta

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **writing-skills** | `/writing-skills` | Create new skills with proper directory structure and frontmatter |

## Task Workflow

All plans, notes, and state use native Claude Code tasks — no
filesystem documents. The task tools are the interface:

- `TaskCreate` -- Create a new task with subject, description
- `TaskGet(taskId)` -- View full task details and metadata
- `TaskList()` -- List all tasks and their status
- `TaskUpdate(taskId)` -- Update status, assign owner, add
  metadata

### Task Metadata

- **description** -- What needs to be done
- **metadata.design** -- Exploration plans, implementation
  approach
- **metadata.notes** -- Review summaries, investigation findings
- **status** -- pending, in_progress, completed

### Typical Cycle

```
/explore "topic"     -> creates task with findings in metadata
/prepare             -> creates tasks + team configuration
/implement           -> executes via team workers (parallel)
/review              -> files findings as tasks
/commit              -> conventional commit
/submit              -> PR via Graphite
```

### Phase-Based Planning

Complex features use multi-phase implementation plans stored in
task `metadata.design`. Phase markers follow these patterns:

- `**Phase N: Description**` (bold inline)
- `### Phase N: Description` (heading)

Each phase is independently reviewable and testable. The
`/implement` skill detects phases and executes them sequentially,
allowing commits and review between phases.

## Team Swarm

The swarm system enables parallel execution of independent tasks
via Claude teams. When `/prepare` creates tasks, it generates a
team configuration. Running `/implement` on a team:

1. Detects the team configuration
2. Spawns a Claude team with one worker per task
3. Workers execute their tasks in parallel
4. Progress is tracked via task status updates

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
