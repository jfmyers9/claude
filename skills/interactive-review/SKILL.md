---
name: interactive-review
description: "Interactive code review - walk through changes file by
  file. Triggers: 'interactive review', 'review changes',
  'walk through diff', 'stage changes'."
argument-hint: "[--cached] [file-pattern]"
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - AskUserQuestion
---

# Interactive Review

Walk through uncommitted changes file by file — AI-powered
`git add -p` alternative. Review each file's diff, get a summary,
then stage or skip interactively.

## Instructions

### 1. Parse Arguments

From `$ARGUMENTS`:
- `--cached` flag: review already-staged changes instead of
  unstaged
- Remaining text: optional file pattern filter (e.g., `*.ts`,
  `src/`)

### 2. Get Changes

```bash
# Base command depends on --cached flag
git diff [--cached] --name-only
```

Also check for untracked files (unless `--cached`):
```bash
git ls-files --others --exclude-standard
```

If untracked files exist, note them to the user:
```
Note: N untracked file(s) not included in review.
Run `git add <file>` first to include new files.
```

- If no diff files and no untracked:
  - Without `--cached`: "No uncommitted changes found."
  - With `--cached`: "No staged changes found."
  - Exit immediately

### 3. Show Overview

```bash
git diff [--cached] --stat
```

Display the stat output as a table of contents so user sees the
full scope before diving in.

If only 1 file: skip overview, go straight to review loop.

### 4. Get Full Diff

```bash
git diff [--cached]
```

If file pattern provided, filter to matching files only.

Split the diff into per-file chunks by `diff --git` boundaries.

### 5. Review Loop

Initialize counters: `staged = 0`, `skipped = 0`.
Build list of files to review.

For each file:

**a. Show progress header:**
```
## [N/M] path/to/file.ext
```

**b. Show the diff:**

- Deleted files: show `File deleted` + show removed content
  in fenced `diff` block (staging = stages the deletion)
- Binary files: show `Binary file changed` instead of diff
- Renamed files: detect `rename from`/`rename to` headers in
  diff output. Show `Renamed: old/path → new/path` then
  any content diff below
- Permission/metadata only: if diff block has no content
  changes (only `old mode`/`new mode`), show
  `Permission change: 644 → 755` (or similar)
- Large diffs (>100 lines): show first 50 lines in fenced
  `diff` block + `... (N more lines)` — if user selects
  "Other" and asks to see full diff, show complete diff
  then re-present the AskUserQuestion
- Normal: show full diff in fenced `diff` block

**c. AI summary:**
```
**What changed:** Brief 1-2 sentence summary of the change.
```

**d. Running tally:**
```
Staged: X | Skipped: Y | Remaining: Z
```

**e. Present choices via AskUserQuestion:**

Options (single-select, 4 options):
- **Stage** — "Stage this file's changes"
- **Skip** — "Move to next file without staging"
- **Stage all remaining** — "Stage this and all remaining files"
- **Quit** — "Stop review, keep current staging"

User can type questions/comments via the built-in "Other"
free-text option.

**f. Process response:**

- **Stage**: run `git add <file>`, increment staged count,
  continue to next file. (In `--cached` mode, file is already
  staged — mark as "approved" and count it, no git command
  needed.)
- **Skip**: increment skipped count, continue to next file.
  (In `--cached` mode, run `git restore --staged <file>` to
  unstage the skipped file.)
- **Stage all remaining**: `git add <current-file>` + `git add`
  all remaining files, update staged count, break loop.
  (In `--cached` mode, just approve all remaining.)
- **Quit**: break loop immediately, remaining files stay
  unreviewed
- **Other (free text)**: answer the user's question or
  comment (keep answers concise to preserve context), then
  re-present the SAME file with the same AskUserQuestion
  (do not advance)

### 6. Summary

```markdown
## Review Complete

Staged: X files | Skipped: Y files | Unreviewed: Z files

### Staged Files
- path/to/file1.ext
- path/to/file2.ext

### Skipped Files
- path/to/file3.ext
```

Only show sections that have files. If nothing was staged, note
that no files were staged.

### 7. Next Steps

If files were staged: suggest `/commit` to commit staged changes.
If no files staged: inform user working tree is unchanged.

## Edge Cases

- **No changes**: exit early with clear message (step 2)
- **Single file**: skip overview, go straight to review
- **Binary files**: show filename + "Binary file changed"
- **Renamed files**: detect `rename from`/`rename to` in diff,
  show "Renamed: old → new" + content diff
- **Deleted files**: show "File deleted" + removed content diff
- **Permission-only changes**: show permission change, no
  content diff
- **Untracked files**: note count in step 2, advise user to
  `git add` new files first
- **Large diffs (>100 lines)**: truncate at 50 lines, show
  count, user can request full view via "Other"
- **--cached with no staged changes**: "No staged changes found."
- **File pattern matches nothing**: "No changes match pattern."

## Notes

- Does not modify file contents — only stages via `git add`
- Use `git restore --staged <file>` to unstage after review
- Pairs well with `/commit` after staging
- Use `--cached` to re-review already-staged changes
