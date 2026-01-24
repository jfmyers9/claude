---
name: commit
description: Create a conventional commit for staged or all changes
allowed-tools: Bash
argument-hint: "[message or leave blank for auto-generate]"
---

# Conventional Commit

Create a git commit following the Conventional Commits specification (https://www.conventionalcommits.org/en/v1.0.0/).

## Process

1. Run `git status` to see what's changed (never use -uall flag)
2. Run `git diff --staged` to see staged changes, or `git diff` if nothing is staged
3. If the user provided a message in $ARGUMENTS, use it (ensure it follows conventional commit format)
4. If no message provided, analyze the changes and generate an appropriate commit message

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]
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
- Keep the first line under 72 characters
- Use imperative mood ("add feature" not "added feature")
- If changes span multiple concerns, prefer the most significant type
- Stage specific files rather than using `git add -A`

## Execute

After determining the message, stage appropriate files and create the commit. Show the user the final commit.
