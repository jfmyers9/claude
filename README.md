# Claude Code Configuration

Portable Claude Code configuration with skills, rules, and
filesystem-based issue tracking. Symlinks into `~/.claude/` for
consistent setup across machines.

## Installation

```bash
git clone <your-repo-url> ~/workspace/claude
cd ~/workspace/claude
./install.sh
```

The installer symlinks CLAUDE.md, settings.json, statusline.py,
skills, and rules into `~/.claude/`.

## Structure

```
├── .claude/
│   ├── CLAUDE.md          # Project-level instructions
│   └── settings.json      # Project-level settings
├── CLAUDE.md              # Global instructions for all sessions
├── install.sh             # Symlink installer
├── rules/                 # Coding rules (6 files)
│   ├── comment-quality.md
│   ├── context-budget.md
│   ├── pr-workflow.md
│   ├── skill-editing.md
│   ├── style.md
│   └── test-quality.md
├── settings.json          # Model, permissions, env vars
├── skills/                # Skill definitions (15 skills)
├── statusline.py          # Custom status line script
└── .work/                 # Issue tracker data (auto-generated)
```

### Key Files

- **settings.json** -- Model set to Opus. Enables agent teams
  (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Sets bash timeout
  to 5 minutes. Skips dangerous mode permission prompt.
- **rules/** -- Coding standards enforced across all sessions:
  comment quality, context budget, PR workflow, skill editing,
  style, test quality.

## Skills

### Core Workflow

The primary development cycle:

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **explore** | `/explore "topic"` | Research topics, create implementation plans stored in issues |
| **prepare** | `/prepare` | Convert exploration findings into child issues under a parent |
| **implement** | `/implement` | Execute issues. Spawns teams for parallel work via `--parent` |
| **review** | `/review` | Senior engineer code review. Files findings as issues |

### Branch and PR Management

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **start** | `/start <branch>` | Create Graphite branch, optionally linked to an issue |
| **worktree** | `/worktree add <name>` | Create git worktrees for isolated parallel development |
| **commit** | `/commit` | Create conventional commits |
| **submit** | `/submit` | Sync branches and create/update PRs via Graphite |
| **gt** | `/gt <command>` | Wrap common Graphite CLI operations |
| **resume-work** | `/resume-work` | Resume work on a branch/PR -- summarizes state and suggests next action |

### Maintenance

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **fix** | `/fix` | Convert user feedback into issues |
| **debug** | `/debug` | Diagnose and fix bugs, CI failures, test failures |
| **respond** | `/respond` | Triage PR review feedback -- analyze validity, recommend actions |
| **refine** | `/refine` | Simplify code and improve comments in uncommitted changes |

### Meta

| Skill | Trigger | Purpose |
|-------|---------|---------|
| **writing-skills** | `/writing-skills` | Create new skills with proper structure and frontmatter |

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
```

### Typical Cycle

```
/explore "topic"     -> creates issue with findings in description
/prepare             -> creates child issues under a parent
/implement           -> executes via team workers (parallel)
/review              -> files findings as issues
/commit              -> conventional commit
/submit              -> PR via Graphite
```

### Phase-Based Planning

Complex features use multi-phase plans stored in issue
descriptions. Phase markers:

- `**Phase N: Description**` (bold inline)
- `### Phase N: Description` (heading)

Each phase is independently reviewable and testable. `/prepare`
creates one child issue per phase under a parent issue.

## Team Execution

The team system enables parallel execution of independent tasks.
When `/prepare` creates child issues under a parent, running
`/implement --parent=<id>`:

1. Finds all open child issues of the parent
2. Spawns a Claude team with one worker per issue
3. Workers implement their tasks in parallel
4. Progress tracked via issue status updates

Also supports `--label=<group>` for label-based grouping.

## Rules

Six rule files enforce coding standards:

- **style.md** -- Simple readable code, meaningful names, small
  focused functions, no over-engineering
- **comment-quality.md** -- Comments must say what code cannot;
  no restatements, no empty docstrings
- **test-quality.md** -- Every test must catch a realistic bug;
  mocks are a last resort
- **pr-workflow.md** -- Always use Graphite, leave PRs in draft,
  never force push
- **context-budget.md** -- Treat context window as finite memory;
  pipe verbose output, summarize for subagents
- **skill-editing.md** -- Integrate changes into existing skill
  structure; don't append standalone sections

## What's NOT Included

Runtime and sensitive files that shouldn't be versioned:

- `.credentials.json` -- Authentication credentials
- `history.jsonl` -- Command history
- `cache/`, `projects/`, `plugins/` -- Runtime data
