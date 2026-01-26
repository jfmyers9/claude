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

2. **Get PR information** (if available):
   - Run `gh pr view --json number,title,body,state,author,createdAt,updatedAt,additions,deletions,changedFiles,reviewDecision,comments,reviews`
   - If no PR exists, note that but continue with branch analysis

3. **Analyze commits**:
   - Get commit history since base branch: `git log main..HEAD --oneline --no-decorate`
   - Get detailed last commit: `git log -1 --format=fuller`
   - Count total commits: `git rev-list --count main..HEAD`

4. **Analyze changes**:
   - Get changed files summary: `git diff main...HEAD --stat`
   - Get diff summary: `git diff main...HEAD --shortstat`
   - Identify types of changes (new files, modified files, deleted files)

5. **Check branch status**:
   - Run `git status` to see uncommitted changes
   - Check if branch is ahead/behind remote: `git rev-list --left-right --count @{upstream}...HEAD` (if remote exists)

6. **Present summary** in this format:

```markdown
## 📋 Branch Summary: [branch-name]

**Base branch**: [main/master]
**Created**: [from first commit date]
**Last updated**: [from last commit date]

### PR Status
[If PR exists:]
- **#[number]**: [title]
- **State**: [OPEN/MERGED/CLOSED]
- **Author**: [author]
- **Review Status**: [APPROVED/CHANGES_REQUESTED/PENDING]
- **Changes**: +[additions] -[deletions] across [N] files

[If PR has description, include it]

[If no PR:]
No PR created yet for this branch.

### Commits ([N] total)
[List commits with short hashes and messages]

### Changed Files ([N] files)
[Show git diff --stat output]

### Current State
- Uncommitted changes: [yes/no - list if yes]
- Branch sync: [up to date / ahead / behind / diverged]

### Recent PR Activity
[If PR exists and has comments/reviews, show last 2-3]

---

**Ready to resume work!** The branch is [summary of state - e.g., "ready for review", "has pending changes", "needs rebasing", etc.]
```

## Tips

- If the branch has uncommitted changes, mention them prominently
- If the branch is behind main, suggest syncing
- If PR has requested changes, highlight them
- Keep the summary concise but informative
- Focus on actionable information

## Notes

- This skill only reads information; it does not make any changes to the repository
- If no PR exists but commits are ready, you might suggest creating a PR with `/ship`
- If branch needs syncing, user can use `/ship` which will handle that
