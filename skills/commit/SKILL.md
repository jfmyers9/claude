---
name: commit
description: Create a conventional commit for staged or all changes
allowed-tools: Bash
argument-hint: "[--amend] [message or leave blank for auto-generate]"
---

# Conventional Commit

Create a git commit following the Conventional Commits specification (https://www.conventionalcommits.org/en/v1.0.0/).

## Process

1. Check if `--amend` flag is present in $ARGUMENTS
2. Run `git status` to see what's changed (never use -uall flag)
3. If amending: run `git log -1 --format="%B"` to see the previous commit message and `git diff HEAD~1` to see all changes in the commit being amended plus any new staged changes
4. If not amending: run `git diff --staged` to see staged changes, or `git diff` if nothing is staged
5. If the user provided a message in $ARGUMENTS (excluding --amend), use it (ensure it follows conventional commit format)
6. If no message provided, analyze all relevant changes and generate an appropriate commit message

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

## Execute

1. Stage appropriate files with `git add <specific-files>`
2. If amending: use `git commit --amend -m "$subject" -m "$(echo "$body" | fmt -w 72)"`
3. If not amending: use `git commit -m "$subject" -m "$(echo "$body" | fmt -w 72)"`
4. Show the user the final commit
