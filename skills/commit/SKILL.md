---
name: commit
description: "Use when the user wants to commit, save changes, create a conventional commit, amend a commit, or make a fixup commit."
allowed-tools: Bash
argument-hint: "[--amend] [--fixup <commit>] [message or leave blank for auto-generate]"
---

# Conventional Commit

Create a git commit following the Conventional Commits specification (https://www.conventionalcommits.org/en/v1.0.0/).

## Process

1. Check if `--amend` or `--fixup` flag is present in $ARGUMENTS
2. **Run in parallel** (these are independent reads):
   - `git status` to see what's changed (never use -uall flag)
   - `git diff --cached` to check if anything is staged
   - If amending: `git log -1 --format="%B"` and `git diff HEAD~1`
   - If fixup: `git log --oneline -10` to show recent commits
   - If not amending/fixup: `git diff --staged` (or `git diff` if
     nothing staged)
3. **If nothing is staged** (`git diff --cached` is empty):
   - Check if there are tracked file changes (`git diff --name-only`)
   - If tracked changes exist: ask the user whether to stage all
     tracked changes or let them pick specific files
   - If no tracked or untracked changes: inform the user there's
     nothing to commit and exit
4. If the user provided a message in $ARGUMENTS (excluding flags), use it (ensure it follows conventional commit format)
5. If no message provided, analyze all relevant changes and generate an appropriate commit message

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body wrapped at 72 characters]
```

Example with wrapped body:
```
feat: add user authentication system

Implement JWT-based authentication with refresh tokens. The system
validates credentials against the user database and returns signed
tokens with configurable expiration times.
```

Types:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Formatting, missing semicolons, etc (not CSS)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or correcting tests
- **chore**: Build process, auxiliary tools, libraries

## Rules

- Do NOT add co-authorship attribution
- Keep the first line (subject) under 72 characters
- Wrap body text at 72 characters per line for terminal readability
- Use imperative mood ("add feature" not "added feature")
- If changes span multiple concerns, prefer the most significant type
- Stage specific files rather than using `git add -A`
- NEVER use `--no-verify` to skip pre-commit hooks

## Hook Failure Recovery

If the commit fails due to a pre-commit hook:

1. Read the hook output to understand what failed
2. Fix the issue (formatting, lint errors, etc.)
3. Re-stage the affected files with `git add <files>`
4. Create a **new** commit (do NOT use `--amend` — the failed commit
   never happened, so amending would modify the previous commit)

## Execute

1. Stage appropriate files with `git add <specific-files>`
2. If amending: use `git commit --amend -m "$subject" -m "$(echo "$body" | fmt -w 72)"`
3. If fixup: use `git commit --fixup <target-commit-hash>`
   - The target commit is determined from `$ARGUMENTS` (e.g.,
     `--fixup abc123` or `--fixup HEAD~2`)
   - If no target specified, show the recent commits from step 2
     and ask the user which commit to fix up
4. If normal: use `git commit -m "$subject" -m "$(echo "$body" | fmt -w 72)"`
5. Show the user the final commit
