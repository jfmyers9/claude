---
name: commit
description: "Conventional commit with --amend, --fixup, or auto-generate"
allowed-tools: Bash
argument-hint: "[--amend] [--fixup <commit>] [message]"
---

# Conventional Commit

https://www.conventionalcommits.org/en/v1.0.0/

## Process

1. Check $ARGUMENTS for `--amend` or `--fixup` flag
2. Run in parallel:
   - `git status` (no -uall)
   - `git diff --cached`
   - If amending: `git log -1 --format="%B"` + `git diff HEAD~1`
   - If fixup: `git log --oneline -10`
   - Else: `git diff --staged` or `git diff`
3. If nothing staged:
   - Check `git diff --name-only` for tracked changes
   - If tracked: ask stage all or pick specific files
   - If none: inform nothing to commit + exit
4. Use provided message if in $ARGUMENTS (validate conventional format)
5. Else analyze changes + generate message

## Format

```
<type>[scope]: <description>

[body @ 72 char wrap]
```

Types: feat, fix, docs, style, refactor, perf, test, chore

## Rules

- No co-authorship attribution
- Subject < 72 chars
- Body @ 72 char wraps
- Imperative mood
- Multiple concerns → most significant type
- Stage specific files (no `git add -A`)
- NEVER `--no-verify`

## Hook Failure

On pre-commit hook failure:
1. Read hook output
2. Fix issue
3. `git add <files>`
4. Create new commit (NOT --amend; failed commit never happened)

## Execute

```bash
git add <specific-files>
# Amend:
git commit --amend -m "$subject" -m "$(echo "$body" | fmt -w 72)"
# Fixup:
git commit --fixup <target-hash>  # from $ARGUMENTS or prompt user
# Normal:
git commit -m "$subject" -m "$(echo "$body" | fmt -w 72)"
```

Show final commit to user
