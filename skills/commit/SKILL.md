---
name: commit
description: >
  Create conventional commit. Triggers: /commit, "commit this",
  "commit changes". Supports --amend, --fixup, or auto-generated
  message.
allowed-tools: Bash
argument-hint: "[--amend] [--fixup <commit>] [message]"
---

# Conventional Commit

## Steps

1. Parse `$ARGUMENTS` for flags: `--amend`, `--fixup <hash>`
2. Gather info (parallel):
   - `git status` (never -uall)
   - `git diff --cached`
   - Amend → `git log -1 --format="%B"` + `git diff HEAD~1`
   - Fixup → `git log --oneline -10`
3. If nothing staged:
   - Check `git diff --name-only` for tracked changes
   - Tracked changes exist → ask user: stage all or pick files
   - Nothing at all → report "nothing to commit", stop
4. Message:
   - Provided in `$ARGUMENTS` → validate conventional format
   - Absent → analyze diff, generate message
5. Commit:
   - `git commit -m "$subject" -m "$body"` (normal)
   - `git commit --amend -m "$subject" -m "$body"` (amend)
   - `git commit --fixup <hash>` (fixup)
6. Show final commit

## Message Format

```
<type>[scope]: <description>

[body wrapped at 72 chars]
```

Types: feat fix docs style refactor perf test chore

## Rules

- Subject < 72 chars, imperative mood
- Body wrapped at 72 chars
- Multiple concerns → most significant type wins
- Stage specific files only (never `git add -A` or `git add .`)
- NEVER use `--no-verify`
- No co-authorship attribution

## Hook Failure Recovery

Failed commit never happened — do NOT `--amend`:

1. Read hook output
2. Fix issues
3. `git add <fixed-files>`
4. New commit (same message)
