---
name: report
description: >
  Post-implementation execution report summarizing commits, files
  changed, and plan-vs-reality. Triggers: 'report', 'execution
  report', 'what was built'.
allowed-tools: Bash, Read, Glob, Grep
argument-hint: "[--branch <name>]"
---

# Report

Generate a post-implementation execution report and write it to
the blueprints repo.

## Arguments

- No args: auto-detect from current branch
- `--branch <name>`: override branch detection

## Steps

### 1. Derive Project

```bash
project=$(blueprint project)
```

### 2. Detect Branches

```bash
trunk=$(gt trunk 2>/dev/null || echo main)
branch=$(git branch --show-current)
```

Parse `$ARGUMENTS` for `--branch <name>` — if present, override
`$branch`.

### 3. Check for Commits

```bash
git log --oneline "$trunk".."$branch"
```

If empty (trunk == HEAD), report "No implementation commits found
on `$branch`" and **stop**.

### 4. Gather Git Data

Run in parallel:

```bash
# Commit list
git log --oneline "$trunk".."$branch"
```

```bash
# Diff stats
git diff --stat "$trunk".."$branch"
```

```bash
# Created files
git diff --diff-filter=A --name-only "$trunk".."$branch"
```

```bash
# Modified files
git diff --diff-filter=M --name-only "$trunk".."$branch"
```

```bash
# Deleted files
git diff --diff-filter=D --name-only "$trunk".."$branch"
```

### 5. Find Source Plan (Optional)

```bash
plan_file=$(blueprint find --type plan,spec)
```

If found, extract `$SOURCE_SLUG`: `SOURCE_SLUG=$(basename "$plan_file" .md)`

Read it and extract phase titles (lines matching
`**Phase N:` or `### Phase N:`) for plan-vs-reality mapping.

### 6. Generate Slug

```bash
slug=$(blueprint slug "$branch")
```

### 7. Write Report

Create the report file:
```bash
file=$(blueprint create report "Report: <branch name>" --status complete --branch "$branch")
```
If source plan was found in step 5:
```bash
blueprint link "$file" "$SOURCE_SLUG"
```

Write the body content into `$file` (append after frontmatter).

**Body sections** (in order):

- **Summary** — 2-3 sentence editorial overview of what was
  implemented. Curate context, don't just echo the git log.

- **Commits** — table with columns: Hash, Message. One row per
  commit.

- **Files Changed** — three sublists: Created, Modified, Deleted.
  Each shows file paths. Omit empty sublists.

- **Stats** — lines added/removed, file count. From diff stats.

- **Plan vs Reality** (only if plan found in step 5) — each plan
  phase mapped to outcome: completed, partial, or skipped. Brief
  note on deviations.

- **Watchouts** — prose on deviations from plan, stuck or failed work, edge cases discovered during implementation, and follow-up suggestions. If nothing notable, write "None."

### 8. Commit-on-Write

Per @rules/blueprints.md:

```sh
blueprint commit report <slug>
```

If `blueprint commit` exits non-zero, STOP and alert the user
with the error output.

### 9. Report to User

Show:
- Report file path
- Commit count, files changed, lines added/removed
- Link to plan if one was used
