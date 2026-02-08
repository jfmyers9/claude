---
name: resume-work
description: Summarizes the current branch and PR state to help resume work on a changeset. Use when the user wants to understand the current state of their branch or resume work on a PR.
disable-model-invocation: true
allowed-tools: Bash
argument-hint: [optional: branch-name]
---

# Resume Work Skill

Analyzes branch + PR state to summarize changeset for resuming work.

## Instructions

1. **Get branch info**:
   - Checkout `$ARGUMENTS` if provided: `git checkout $ARGUMENTS`
   - Get name: `git branch --show-current`
   - Identify base branch (main/master)
   - Verify exists + has commits

2. **Sync with origin**:
   - Check uncommitted: `git status --porcelain`
   - If any: show changes, warn "Cannot sync - commit or stash first", stop
   - Fetch: `git fetch origin`
   - Check remote exists: `git rev-parse --verify origin/[branch-name]`
   - If exists:
     - Check behind: `git rev-list HEAD..origin/[branch-name] --count`
     - If behind, pull: `git pull --ff-only origin [branch-name]`
     - On failure: warn "resolve conflicts manually", stop
   - If no remote: note as local-only branch

3. **Gather context in parallel**:
   - `gh pr view --json number,title,body,state,author,createdAt,updatedAt,additions,deletions,changedFiles,reviewDecision,comments,reviews`
   - `git log main..HEAD --oneline --no-decorate`
   - `git log -1 --format=fuller`
   - `git rev-list --count main..HEAD`
   - `git diff main...HEAD --stat`
   - `git diff main...HEAD --shortstat`
   - `git status`
   - `git rev-list --left-right --count @{upstream}...HEAD` (if remote)

   Identify change types (new, modified, deleted).

4. **Present summary**:
   - Branch name, base, dates
   - PR status (number, title, state, review, changes) or "No PR"
   - Commits with short hashes
   - Changed files summary
   - Current state (uncommitted, sync status)
   - PR activity
   - Next step recommendation

5. **Save session context** (overwrite):
   - Sanitize branch name: replace `/` with `-`
   - Ensure `.jim/states/` exists: `mkdir -p .jim/states`
   - Write `.jim/states/session-{sanitized-branch-name}.md`:
     ```markdown
     # Session Context
     Updated: {ISO timestamp}
     Branch: {branch-name}
     Base: {base-branch}
     ## PR Status
     {number, title, state, or "No PR"}
     ## Recent Commits
     {commit list}
     ## Changed Files
     {file summary}
     ## Current State
     {uncommitted changes, sync status}
     ```
   - Auto-used by `/explore` + other skills
   - Fully rewritten each run (fresh state)

## Tips

- Auto-syncs branch before proceeding
- Uncommitted changes block resume → commit/stash first
- Pull failures require manual conflict resolution
- Highlight uncommitted changes prominently
- Suggest sync if behind main
- Highlight PR requested changes
- Keep concise + actionable

## Notes

- Read-only (no repo changes)
- No PR + ready commits → suggest `/ship`
- Behind main → user can `/ship` to sync
