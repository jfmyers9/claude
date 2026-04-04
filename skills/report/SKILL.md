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

Determine `<project>` per @rules/blueprints.md.

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

Scan for the most recent `.md` file in:
- `~/workspace/blueprints/<project>/plan/`
- `~/workspace/blueprints/<project>/spec/`

```bash
ls -t ~/workspace/blueprints/<project>/plan/*.md \
      ~/workspace/blueprints/<project>/spec/*.md \
  2>/dev/null | head -1
```

If found: read it and extract phase titles (lines matching
`**Phase N:` or `### Phase N:`) for plan-vs-reality mapping.

### 6. Generate Slug

Derive from `$branch`:
- Strip common prefixes (`feature/`, `fix/`, etc.)
- Convert to kebab-case
- Remove filler words (the, a, an, and, or)
- Truncate to max 50 chars

### 7. Write Report

Create directory and write to
`~/workspace/blueprints/<project>/report/<epoch>-<slug>.md`
where `<epoch>` is current Unix seconds.

**Frontmatter:**

```yaml
---
topic: "Report: <branch name or epic subject>"
project: <absolute path to cwd>
created: <ISO 8601 timestamp>
status: complete
branch: <branch name>
---
```

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
cd ~/workspace/blueprints && \
  git add -A <project>/ && \
  git commit -m "report(<project>): <slug>" && \
  git push || (git pull --rebase && git push)
```

If rebase fails, **stop** and alert the user with conflict details.

### 9. Report to User

Show:
- Report file path
- Commit count, files changed, lines added/removed
- Link to plan if one was used
