---
name: interactive-review
description: >
  Walk through changes file by file, stage or skip
  interactively. Triggers: 'interactive review',
  'review changes', 'walk through diff', 'stage changes'.
allowed-tools: Bash, Read, Glob, Grep, AskUserQuestion
argument-hint: "[--cached] [file-pattern]"
---

## Parse Arguments

From `$ARGUMENTS`:
- `--cached` → review staged changes instead of unstaged
- Remaining text → file pattern filter

## Get Changes

```bash
git diff [--cached] --name-only
```

Without `--cached`, also check untracked:
```bash
git ls-files --others --exclude-standard
```
If untracked exist, note count + advise `git add` first.

No changes → exit ("No uncommitted/staged changes found.")
Pattern matches nothing → exit ("No changes match pattern.")

## Show Overview

`git diff [--cached] --stat` — skip if only 1 file.

## Review Loop

Initialize: `staged = 0`, `skipped = 0`.

For each file:

1. **Progress header:** `## [N/M] path/to/file.ext`

2. **Show diff** (fenced `diff` block):
   - Deleted → "File deleted" + removed content
   - Binary → "Binary file changed"
   - Renamed → "Renamed: old → new" + content diff
   - Permission-only → "Permission change: 644 → 755"
   - Large (>100 lines) → first 50 lines +
     "... (N more lines)". Full view via "Other".
   - Normal → full diff

3. **AI summary:** 1-2 sentence description of change

4. **Running tally:**
   `Staged: X | Skipped: Y | Remaining: Z`

5. **AskUserQuestion** (single-select, 4 options):
   - **Stage** — stage this file
   - **Skip** — move to next without staging
   - **Stage all remaining** — stage this + rest
   - **Quit** — stop, keep current staging

6. **Process response:**
   - Stage → `git add <file>`, increment staged.
     (--cached mode: already staged, just count.)
   - Skip → increment skipped, next file.
     (--cached mode: `git restore --staged <file>`.)
   - Stage all → `git add` current + remaining, update
     count, break loop.
     (--cached mode: approve all remaining.)
   - Quit → break immediately
   - Other (free text) → answer concisely, re-present
     same file (do not advance)

## Summary

```
## Review Complete

Staged: X files | Skipped: Y files | Unreviewed: Z files

### Staged Files
- path/to/file.ext

### Skipped Files
- path/to/file.ext
```

Only show sections with files. If files staged → suggest
`/commit`.
