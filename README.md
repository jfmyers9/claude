# Claude Code Configuration

Portable Claude Code configuration with skills, rules, and
beads-based issue tracking. Symlinks into `~/.claude/` for
consistent setup across machines.

## Installation

**Prerequisites:** beads (`bd`) CLI installed and on PATH.
The installer will auto-install it, or install manually:

```bash
# Recommended (Linux, macOS, FreeBSD)
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Alternatives
npm install -g @beads/bd
brew install beads          # macOS only
go install github.com/steveyegge/beads/cmd/bd@latest
```

```bash
git clone <your-repo-url> ~/dotfiles/claude-config
cd ~/dotfiles/claude-config
./install.sh
```

The installer symlinks CLAUDE.md, settings.json, statusline.py,
skills, and rules into `~/.claude/`.

## Structure

```
├── .beads/            # Beads issue tracking data
├── .claude/           # Claude Code project config
├── AGENTS.md          # Agent instructions for beads workflow
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

- **AGENTS.md** -- Instructions for agent teammates. Contains
  beads CLI quick reference (`bd ready`, `bd show`, `bd update`,
  `bd close`, `bd sync`) and the "Landing the Plane" protocol
  for session completion (mandatory `git push`).
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
| **explore** | `/explore "topic"` | Research topics, investigate codebases, create implementation plans stored in beads `design` field |
| **prepare** | `/prepare` | Convert exploration findings into a beads epic with child issues and swarm configuration |
| **implement** | `/implement <epic>` | Execute implementation plans from beads issues. Detects swarm epics and spawns Claude teams for parallel work |
| **review** | `/review` | Senior engineer code review of current branch. Files findings as beads issues |

### Branch and PR Management

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **start** | `/start <branch>` | Create a new Graphite branch, optionally linked to a beads issue |
| **commit** | `/commit` | Create conventional commits with automatic beads sync |
| **submit** | `/submit` | Sync branches and create/update PRs via Graphite with beads state sync |
| **gt** | `/gt <command>` | Wrap common Graphite CLI operations for branch management |
| **resume-work** | `/resume-work` | Resume work on a branch/PR after a break -- summarizes state |

### Maintenance

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **fix** | `/fix` | Convert user feedback on recent implementations into beads issues |
| **debug** | `/debug` | Systematically diagnose and fix bugs, CI failures, and test failures |

### Meta

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **writing-skills** | `/writing-skills` | Create new skills with proper directory structure and frontmatter |

## Beads Workflow

All plans, notes, and state live in beads -- no filesystem
documents. The `bd` CLI is the interface:

```bash
bd ready          # Find available work
bd show <id>      # View issue details (description, design, notes)
bd list           # List all issues
bd create         # Create a new issue
bd update <id>    # Update status, claim work
bd close <id>     # Mark work complete
bd sync           # Sync beads state with git
bd lint           # Validate beads data integrity
```

### Beads Fields

- **description** -- What needs to be done
- **design** -- Exploration plans, implementation approach
- **notes** -- Review summaries, investigation findings
- **acceptance_criteria** -- Definition of done
- **status** -- Tracking state (open, in_progress, closed)

### Typical Cycle

```
/explore "topic"     -> creates bead with findings in design field
/prepare             -> creates epic + child issues + swarm config
/implement <epic>    -> executes via swarm workers (parallel)
/review              -> files findings as beads issues
/commit              -> conventional commit + beads sync
/submit              -> PR via Graphite + beads sync
```

### Phase-Based Planning

Complex features use multi-phase implementation plans stored in
the beads `design` field. Phase markers follow these patterns:

- `**Phase N: Description**` (bold inline)
- `### Phase N: Description` (heading)

Each phase is independently reviewable and testable. The
`/implement` skill detects phases and executes them sequentially,
allowing commits and review between phases.

## Beads Swarm

The swarm system enables parallel execution of independent tasks
via Claude teams. When `/prepare` creates an epic with child
issues, it generates a swarm configuration. Running `/implement`
on a swarm epic:

1. Detects the swarm configuration on the epic
2. Spawns a Claude team with one worker per child issue
3. Workers execute their tasks in parallel
4. Progress is tracked via beads status updates

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
