---
name: worktree
description: >
  Manage git worktrees for parallel development with Graphite
  and issue tracking.
  Triggers: /worktree, "new worktree", "parallel branch".
allowed-tools: Bash, Read, Glob, Grep
argument-hint: "<add|list|remove|status> [branch-name] [issue-id]"
---

# Worktree

Manage git worktrees for isolated parallel development. Each
worktree gets its own directory, branch, and Claude Code session.

## Arguments

- `add <branch-name> [issue-id]` — create worktree + branch
- `list` — show all worktrees
- `remove <branch-name>` — remove a worktree
- `status` — show worktrees with branch, last commit, issue

No arguments or `help` → show usage.

## Conventions

- Worktree root: `../<repo-basename>-wt/`
- Branch prefix: `jm/` (added if missing)
- Main worktree stays on `main` — don't modify it during
  parallel work

## Workflow

### 0. Verify Prerequisites

Run `work list 2>/dev/null` — if it fails, run `work init`.
Verify `git rev-parse --git-dir` succeeds (must be in a repo).
Detect repo basename: `basename $(git rev-parse --show-toplevel)`

### 1. Parse Arguments

Extract subcommand and args from `$ARGUMENTS`:
- First word → subcommand (add/list/remove/status/help)
- Remaining → branch name and optional issue ID
- No args → show usage and stop

### 2. Route Subcommand

#### `add <branch-name> [issue-id]`

1. **Normalize branch name**
   - Prefix with `jm/` if not already prefixed

2. **Check constraints**
   - `git worktree list --porcelain` — verify branch isn't
     already checked out in another worktree
   - If branch exists and is checked out → error, stop

3. **Compute worktree path**
   ```
   repo_root=$(git rev-parse --show-toplevel)
   repo_name=$(basename "$repo_root")
   wt_root="$(dirname "$repo_root")/${repo_name}-wt"
   # Strip jm/ prefix for directory name
   dir_name=${branch_name#jm/}
   wt_path="${wt_root}/${dir_name}"
   ```

4. **Create worktree directory**
   ```
   mkdir -p "$wt_root"
   ```

5. **Create Graphite branch from main worktree**
   ```
   gt create "$branch_name" --no-interactive
   ```
   If this fails (branch already exists), try checking it out
   instead.

6. **Create the worktree**
   ```
   git worktree add "$wt_path" "$branch_name"
   ```

7. **Initialize Graphite in worktree**
   ```
   cd "$wt_path" && gt track
   ```

8. **Link issue (if ID provided)**
   - `work start <id>`
   - `work comment <id> "Branch: <branch-name>, Worktree: <wt_path>"`

9. **Create issue (if no ID provided)**
   - Ask user: "Create issue for this worktree?"
   - If yes:
     ```
     work create "<branch-name>" --priority 2 \
       --description "Worktree: <wt_path>"
     ```
     - `work start <new-id>`

10. **Print session instructions**
    ```
    Worktree created: <wt_path>
    Branch: <branch_name>

    To start working:
      cd <wt_path> && claude
    ```
    If `tmux` is available (`command -v tmux`), also suggest:
    ```
    Or open in new tmux window:
      tmux new-window -c "<wt_path>" -n "<dir_name>"
    ```

#### `list`

Run `git worktree list` and display results.

#### `remove <branch-name>`

1. **Normalize branch name** — prefix `jm/` if needed
2. **Compute worktree path** (same as add)
3. **Safety checks**
   - `cd "$wt_path" && git status --porcelain` — if uncommitted
     changes exist → warn user and ask for confirmation
   - `git log @{u}..HEAD 2>/dev/null` — if unpushed commits
     exist → warn user and ask for confirmation
4. **Remove worktree**
   ```
   git worktree remove "$wt_path"
   git worktree prune
   ```
5. **Clean up empty wt root**
   - If `$wt_root` is empty after removal → `rmdir "$wt_root"`
6. Report removal complete

#### `status`

1. `git worktree list --porcelain` — parse each worktree
2. For each non-bare worktree:
   - Branch name (from HEAD)
   - Last commit (short hash + subject)
   - Check if branch has a linked work issue:
     `work list --format=json` and search for branch name
     in comments/descriptions
3. Display as table:
   ```
   PATH                          BRANCH        LAST COMMIT      ISSUE
   /Users/jim/workspace/repo     main          abc1234 msg...   —
   ../repo-wt/feature-auth       jm/feat-auth  def5678 msg...   #a1b2c3
   ```

#### `help` (or no args)

Print:
```
Usage: /worktree <command> [args]

Commands:
  add <name> [issue-id]  Create worktree + Graphite branch
  list                   Show all worktrees
  remove <name>          Remove a worktree (with safety checks)
  status                 Show worktrees with details

Examples:
  /worktree add feature-auth
  /worktree add feature-auth abc123
  /worktree remove feature-auth
  /worktree status
```

## Safety

- **gt sync warning**: If user runs gt sync from a worktree,
  warn that this can affect other worktrees with unstaged
  changes. Recommend running gt sync only from the main
  worktree.
- **Same branch guard**: Cannot checkout a branch that's already
  in another worktree. Give clear error with the path of the
  existing worktree.
- **Remove guards**: Warn on uncommitted changes or unpushed
  commits before removing a worktree.
