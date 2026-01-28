---
name: resume-work
description: Summarizes the current branch and PR state to help resume work on a changeset. Use when the user wants to understand the current state of their branch or resume work on a PR.
disable-model-invocation: true
allowed-tools: Bash
argument-hint: [optional: branch-name]
---

# Resume Work Skill

This skill analyzes the current branch and associated PR to provide a comprehensive summary of the changeset state, helping you resume work efficiently.

## Instructions

1. **Get current branch information**:
   - If `$ARGUMENTS` is provided, checkout that branch first: `git checkout $ARGUMENTS`
   - Get current branch name: `git branch --show-current`
   - Get base branch (usually main/master)
   - Verify the branch exists and has commits

2. **Ensure branch is up to date with origin**:
   - Check for local uncommitted changes: `git status --porcelain`
   - If there are uncommitted changes:
     - Show the user the uncommitted changes
     - Display message: "⚠️  Cannot sync branch - you have local uncommitted changes. Please commit or stash your changes before resuming."
     - Stop here and do not proceed with the rest of the skill
   - Fetch latest from origin: `git fetch origin`
   - Check if remote branch exists: `git rev-parse --verify origin/[branch-name]`
   - If remote branch exists:
     - Check if local is behind remote: `git rev-list HEAD..origin/[branch-name] --count`
     - If behind, pull changes: `git pull --ff-only origin [branch-name]`
     - If pull fails (exit code != 0), display error and stop:
       - "⚠️  Failed to pull changes from origin. Please resolve any conflicts manually before resuming."
       - Stop here and do not proceed
   - If remote branch doesn't exist, note that this is a local-only branch

3. **Get PR information** (if available):
   - Run `gh pr view --json number,title,body,state,author,createdAt,updatedAt,additions,deletions,changedFiles,reviewDecision,comments,reviews`
   - If no PR exists, note that but continue with branch analysis

4. **Analyze commits**:
   - Get commit history since base branch: `git log main..HEAD --oneline --no-decorate`
   - Get detailed last commit: `git log -1 --format=fuller`
   - Count total commits: `git rev-list --count main..HEAD`

5. **Analyze changes**:
   - Get changed files summary: `git diff main...HEAD --stat`
   - Get diff summary: `git diff main...HEAD --shortstat`
   - Identify types of changes (new files, modified files, deleted files)

6. **Check branch status**:
   - Run `git status` to see uncommitted changes
   - Check if branch is ahead/behind remote: `git rev-list --left-right --count @{upstream}...HEAD` (if remote exists)

7. **Present summary** including:
   - Branch name, base branch, created/updated dates
   - PR status (number, title, state, review status, changes) or note if none
   - Commit list with short hashes
   - Changed files summary
   - Current state (uncommitted changes, sync status)
   - Recent PR activity if applicable
   - Actionable next step recommendation

## Tips

- The skill automatically ensures the branch is synced with origin before proceeding
- If uncommitted changes are detected, the user must commit or stash them first
- If pull fails, the user must manually resolve conflicts before resuming
- If the branch has uncommitted changes, mention them prominently
- If the branch is behind main, suggest syncing
- If PR has requested changes, highlight them
- Keep the summary concise but informative
- Focus on actionable information

## Notes

- This skill only reads information; it does not make any changes to the repository
- If no PR exists but commits are ready, you might suggest creating a PR with `/ship`
- If branch needs syncing, user can use `/ship` which will handle that
