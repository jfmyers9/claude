# Claude Code Configuration

Portable Claude Code configuration with skills, rules, and
task-based workflow. Symlinks into `~/.claude/` for consistent
setup across machines.

## Prerequisites

- [Graphite CLI](https://graphite.dev/docs/graphite-cli) --
  branch management and PR submission
- [GitHub CLI](https://cli.github.com/) (`gh`) -- PR metadata
  and issue operations
- Python 3 -- statusline script
- git
- macOS Keychain -- statusline quota tracking reads credentials
  via the `security` command (optional; statusline degrades
  gracefully without it)

## Installation

```bash
git clone <your-repo-url> ~/dotfiles/claude-config
cd ~/dotfiles/claude-config
./install.sh
```

The installer removes any existing targets then symlinks
CLAUDE.md, settings.json, statusline.py, skills/, and rules/
into `~/.claude/`. Set `CLAUDE_CONFIG_DIR` to override the
target directory.

## Structure

```
├── .claude/           # Claude Code project config
│   └── CLAUDE.md      # Project-scoped instructions
├── CLAUDE.md          # Global instructions for all sessions
├── install.sh         # Symlink installer
├── README.md
├── rules/             # 6 coding rules
│   ├── comment-quality.md
│   ├── context-budget.md
│   ├── pr-workflow.md
│   ├── skill-editing.md
│   ├── style.md
│   └── test-quality.md
├── settings.json      # Model, permissions, env vars
├── skills/            # 14 skill definitions
└── statusline.py      # Custom two-line status bar
```

## Configuration

### Settings (`settings.json`)

| Key | Value | Purpose |
|-----|-------|---------|
| `model` | `opus` | Default model for all sessions |
| `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `1` | Enable agent team spawning |
| `env.BASH_DEFAULT_TIMEOUT_MS` | `300000` | 5-minute bash timeout |
| `permissions.deny` | `Task(test-runner)` | Block test-runner subagent type |
| `skipDangerousModePermissionPrompt` | `true` | Skip dangerous mode confirmation |
| `statusLine` | command: `python3 ~/.claude/statusline.py` | Custom statusline |
| `attribution` | empty commit/PR strings | Disable author attribution |

### Instructions (`CLAUDE.md`)

Two layers of instructions, both loaded into every session:

- **`CLAUDE.md`** (root) -- Global instructions: Graphite
  workflow, conciseness, efficiency, context budget, task
  tracking, text formatting (80-char wrapping)
- **`.claude/CLAUDE.md`** -- Project-scoped instructions:
  multi-phase implementation guidelines with phase marker
  patterns

### Status Line (`statusline.py`)

Two-line statusline using the Ayu Dark color palette:

```
Line 1:  model | ●●●●○○○○○○ 42% 84k/200k | 󰅐 3m22s | 󰇁 $1.47
Line 2:  5h: ●●○○○○○○ 24% 3h41m | 7d: ●●●○○○○○ 38% 4d12h | NORMAL
```

- **Line 1**: model name, context usage (dot bar + percentage +
  tokens), session duration, session cost
- **Line 2**: 5-hour quota bar, 7-day quota bar, vim mode,
  agent name

Quota data is fetched from the Anthropic API via macOS Keychain
credentials, cached for 60 seconds. Colors shift from
cyan → orange → red based on burn rate relative to remaining
window time.

## Skills

### Core Workflow

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **explore** | `/explore <topic> \| <task-id> \| --continue \| --team` | Research topics, investigate codebases, create plans in task metadata |
| **prepare** | `/prepare [task-id]` | Convert exploration findings into epic with phased child tasks |
| **implement** | `/implement [task-id] [--solo]` | Execute plans from tasks; spawns teams for parallel work |
| **review** | `/review [file-pattern] [--team] \| <task-id> \| --continue` | Senior engineer code review, files findings as tasks |

### Branch and PR Management

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **start** | `/start <branch-name>` | Create a new Graphite branch |
| **commit** | `/commit [--amend] [--fixup <commit>] [message]` | Create conventional commits |
| **submit** | `/submit [--stack] [--sync-only] [--ready]` | Sync branches and create/update PRs via Graphite |
| **gt** | `/gt [log\|restack\|sync\|info\|amend\|up\|down\|top\|bottom] [flags]` | Wrap common Graphite CLI operations |
| **resume-work** | `/resume-work [branch-name\|PR#]` | Resume work after a break -- summarizes state |

### Maintenance

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **fix** | `/fix [feedback-text]` | Convert user feedback into tasks (does not implement) |
| **debug** | `/debug [task-id\|error-description]` | Diagnose and fix bugs, CI failures, test failures |
| **refine** | `/refine [file-pattern]` | Simplify code and improve comments in uncommitted changes |
| **respond** | `/respond [pr-number] \| <task-id> \| --continue` | Triage PR review feedback, recommend actions |

### Meta

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **writing-skills** | `/writing-skills <skill-name> <description>` | Create new skills with proper structure and frontmatter |

## Task Workflow

All plans, notes, and state use native Claude Code tasks -- no
filesystem documents. The task tools are the interface:

- `TaskCreate` -- create a new task with subject, description
- `TaskGet(taskId)` -- view full task details and metadata
- `TaskList()` -- list all tasks and their status
- `TaskUpdate(taskId)` -- update status, assign owner, add
  metadata

### Task Metadata

- **description** -- what needs to be done
- **metadata.design** -- exploration plans, implementation
  approach
- **metadata.notes** -- review summaries, investigation findings
- **status** -- pending, in_progress, completed

### Typical Cycle

```
/explore "topic"     -> research, findings in task metadata
/prepare             -> epic + phased child tasks
/implement           -> execute via team workers (parallel)
/review              -> code review, findings as tasks
/respond             -> triage PR feedback
/fix                 -> convert feedback to tasks
/debug               -> diagnose failures
/refine              -> simplify code, improve comments
/commit              -> conventional commit
/submit              -> PR via Graphite
/resume-work         -> pick up where you left off
```

### Phase-Based Planning

Complex features use multi-phase implementation plans stored in
task `metadata.design`. Phase markers follow these patterns:

- `**Phase N: Description**` (bold inline)
- `### Phase N: Description` (heading)

Each phase is independently reviewable and testable. The
`/implement` skill detects phases and executes them
sequentially, allowing commits and review between phases.

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

Six rule files enforce coding standards:

- **style.md** -- simple readable code, meaningful names, small
  focused functions, no over-engineering
- **comment-quality.md** -- comments must say what code cannot;
  no restatements, no empty docstrings
- **test-quality.md** -- every test must catch a realistic bug;
  mocks are a last resort
- **pr-workflow.md** -- always use Graphite, leave PRs in draft,
  never force push
- **context-budget.md** -- treat context window as finite memory;
  pipe verbose output, summarize for subagents
- **skill-editing.md** -- preserve skill cohesion; integrate new
  features into existing structure, don't append (scoped to
  `skills/**/*.md`)

## What's NOT Included

Runtime and sensitive files that shouldn't be versioned:

- `.credentials.json` -- authentication credentials
- `history.jsonl` -- command history
- `cache/`, `projects/`, `plugins/` -- runtime data
