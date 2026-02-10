---
name: resume-work
description: |
  Summarize current branch + PR state to help resume work.
  Triggers: 'resume work', 'resume', 'catch me up',
  'what's the status of this branch'.
allowed-tools: Bash, Write
argument-hint: "[optional: branch-name]"
---

# Instructions

1. **Get branch**:
   - If `$ARGUMENTS` provided: `git checkout $ARGUMENTS`
   - `git branch --show-current`
   - Identify base branch (main/master)

2. **Sync with origin**:
   - `git status --porcelain` → if uncommitted changes, warn
     "commit or stash first" and stop
   - `git fetch origin`
   - Check remote exists:
     `git rev-parse --verify origin/{branch}`
   - If remote exists + behind:
     `git pull --ff-only origin {branch}`
   - Pull failure → warn "resolve conflicts manually", stop
   - No remote → note as local-only

3. **Gather context** (parallel):
   - `gh pr view --json number,title,state,reviewDecision,additions,deletions,changedFiles,updatedAt --jq '{number,title,state,reviewDecision,additions,deletions,changedFiles,updatedAt}'`
   - `gh pr view --json comments --jq '[.comments[-5:][] | {author:.author.login,body:.body[:200],createdAt}]'`
   - `gh pr view --json reviews --jq '[.reviews[-5:][] | {author:.author.login,state,body:.body[:200]}]'`
   - `git log main..HEAD --oneline --no-decorate`
   - `git log -1 --format=fuller`
   - `git rev-list --count main..HEAD`
   - `git diff main...HEAD --stat`
   - `git status`
   - `git rev-list --left-right --count @{upstream}...HEAD`
     (if remote exists)

4. **Present summary**:
   - Branch name, base, dates
   - PR status (number, title, state, review decision,
     +/-/files) or "No PR"
   - Commits with short hashes
   - Changed files summary (new/modified/deleted)
   - Sync status (ahead/behind remote + main)
   - PR comments/reviews if any
   - Next step recommendation

5. **Save session context**:
   - Sanitize branch: replace `/` with `-`
   - `mkdir -p .jim/states`
   - Write `.jim/states/session-{sanitized-branch}.md`:

     ```markdown
     # Session Context
     Updated: {ISO timestamp}
     Branch: {branch}
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

   - Auto-consumed by `/explore` + other skills
   - Fully rewritten each run (fresh state)
