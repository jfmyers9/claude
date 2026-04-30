---
name: split-commit
description: >
  Repackage branch into clean, tested, vertical commits. Triggers:
  'split commits', 'repackage commits', 'reorganize commits',
  'clean up branch history'. Not for single-commit branches — use
  /skill:commit instead.
argument-hint: "[base-branch] [--test='command'] [--auto]"
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Split Commit

Repackage a branch into vertical commits. Use a `plan/` blueprint for
analysis and execution state.

@rules/blueprints.md and @rules/harness-compat.md apply.

## Arguments

- `[base-branch]` — comparison base, default `gt trunk` or `main`
- `--test='command'` — command to verify each commit
- `--auto` — skip approval before rewriting commits

## Workflow

### 1. Parse Args + Noop Check

Resolve base:

```bash
base=$(gt trunk 2>/dev/null || git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/||' || echo main)
count=$(git log --oneline "$base"..HEAD | wc -l | tr -d ' ')
```

If `count` <= 1, stop: `Only $count commit(s) — use /skill:commit`.

### 2. Analyze Branch

Gather:

```bash
git log --oneline "$base"..HEAD
git diff --stat "$base"..HEAD
git diff "$base"..HEAD
```

Create a plan blueprint:

```bash
file=$(blueprint create plan "Split commits: $(git branch --show-current)" --status draft)
```

Write:

```markdown
## Commit Split Plan

### Base
<base>

### Test Command
<command or none>

### Commits

1. `type(scope): message`
   - Files: <paths>
   - Partial hunks: <file: description>
   - Dependencies: <prior commit numbers>
   - Rationale: <why this is vertical>
```

Grouping rules:

- foundational changes before consumers
- config/lock files with the feature that needs them
- new types/interfaces with first consumer
- each commit should compile independently when possible

Run `blueprint commit plan <slug>`.

### 3. Approval

If `--auto` is absent, show the plan and stop for approval.

### 4. Execute

Use git-surgeon hunk staging. Read
`skills/git-surgeon/git-surgeon.md` before partial staging.

1. Collapse branch to unstaged changes:
   ```bash
   git reset --soft "$base" && git reset HEAD
   ```
2. For each planned commit:
   - stage full files with `git add <file>`
   - stage partial hunks with patch building + `git apply --cached`
   - run test command if provided
   - if test fails due to missing dependency, stage the missing hunk and
     retry once
   - commit with the planned conventional message
3. After last planned commit, check for remaining changes. If any,
   either fold them into the correct commit or create
   `chore: clean up remaining changes`.
4. Verify:
   ```bash
   git status --short
   git log --oneline "$base"..HEAD
   ```

### 5. Complete

Append execution notes to the blueprint, set status `complete`, and run
`blueprint commit plan <slug>`.

Report final commit list.
