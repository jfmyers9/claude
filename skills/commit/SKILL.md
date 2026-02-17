---
name: commit
description: >
  Create conventional commits with auto-generated messages. Use after making changes, when saving progress,
  done with a change, ready to commit, or finished implementing. Triggers: /commit, "commit this".
allowed-tools: Bash
argument-hint: "[--amend] [--fixup <commit>] [message]"
---

# Commit

Create conventional commits.

## Arguments

- `[message]` — commit message (generated if omitted)
- `--amend` — amend the previous commit
- `--fixup <commit>` — create fixup commit for specified hash

## Autonomy

Default to acting without prompting. Only ask for user input when:
- Changed files span clearly unrelated features with no common theme
- Sensitive files (.env, credentials) are in the diff
- There is literally nothing to commit

In all other cases, proceed silently. The user will provide
instructions if they want commits shaped differently.

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
     - If tracked changes exist: stage all with `git add -u` (tracked only)
     - Only ask user if changed files span clearly unrelated features/modules
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
