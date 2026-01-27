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

After determining the message, stage appropriate files and create the
commit following this process:

1. Stage the appropriate files using `git add <specific-files>`
2. Wrap the commit message body at 72 characters using `fmt -w 72`
3. Create the commit with the wrapped message
4. Show the user the final commit

### Message Wrapping Example

When creating commits, use git's multiple `-m` flag feature:

```bash
# 1. Generate the commit message parts
subject="<type>: <description>"
body="<long body text that needs wrapping>"

# 2. Wrap body at 72 characters
wrapped_body=$(echo "$body" | fmt -w 72)

# 3. Create commit with wrapped message
git commit -m "$subject" -m "$wrapped_body"
```

The `-m` flag can be used multiple times: first for subject,
second for body. This automatically adds the blank line between
them.
