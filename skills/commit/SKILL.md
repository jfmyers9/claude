---
name: commit
description: >
  Create conventional commits. Triggers: /commit, "commit this".
allowed-tools: Bash
argument-hint: "[--amend] [--fixup <commit>] [message]"
---

# Commit

Create conventional commits.

## Arguments

- `[message]` — commit message (generated if omitted)
- `--amend` — amend the previous commit
- `--fixup <commit>` — create fixup commit for specified hash

## Steps

1. **Parse Arguments**
   - Extract `--amend` flag from `$ARGUMENTS`
   - Extract `--fixup <hash>` from `$ARGUMENTS`
   - Extract commit message (remaining text)

2. **Gather Context (Parallel)**
   - `git status` (never use -uall flag)
   - `git diff --cached` (staged changes)
   - If `--amend`: `git log -1 --format="%B"` and `git diff HEAD~1`

3. **Validate Staged Changes**
   - If nothing staged:
     - Check `git diff --name-only` for tracked changes
     - If tracked changes exist: ask user to stage all or pick files
     - If nothing at all: report "nothing to commit" and stop

4. **Handle Commit Message**
   - If message provided: validate conventional format `<type>[scope]: <description>`
   - If no message: generate conventional commit message
   - Format multi-line bodies: wrap at 72 characters
   - For `--fixup`: no message validation needed

5. **Execute Commit**
   - Normal: `git commit -m "message"`
   - Amend: `git commit --amend -m "message"`
   - Fixup: `git commit --fixup <hash>`
   - Use HEREDOC for multi-line messages

6. **Show Result**
   - Display final commit with `git log -1 --oneline`
