---
name: resume-work
description: >
  Resume work on a branch/PR after a break. Triggers: /resume-work, /resume
allowed-tools: Bash
argument-hint: "[branch-name|PR#]"
---

# Resume Work

Gather context on current work and suggest next action.

## Arguments

- `<branch-name>` — checkout and resume specific branch
- `<PR#>` — resolve branch from PR number
- (no args) — use current branch

## Steps

### 0. Verify Work Tracker

Run `work list 2>/dev/null` — if it fails, run `work init`
first.

### 1. Resolve Branch

Parse `$ARGUMENTS`:
- Empty → `git branch --show-current`
- Numeric → resolve via
  `gh pr view "$ARGUMENTS" --json headRefName -q .headRefName`,
  then checkout
- Otherwise → `git checkout "$ARGUMENTS"`

Exit if branch can't be resolved.

### 2. Gather Context

Run in parallel:

```bash
git branch --show-current
git log --oneline -10
git status -sb

gh pr view --json number,title,state,isDraft,reviewDecision,statusCheckRollup,url \
  2>/dev/null || echo "No PR"
gh pr checks 2>/dev/null || echo "No PR"
```

Fetch unresolved review comments (top-level only):

```bash
PR_NUM=$(gh pr view --json number -q .number 2>/dev/null)
if [[ -n "$PR_NUM" ]]; then
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
  gh api "repos/$REPO/pulls/$PR_NUM/comments" \
    --jq '.[] | select(.in_reply_to_id == null) |
      "- \(.path):\(.line) (@\(.user.login)): \(.body | split("\n")[0])"' \
    2>/dev/null | head -20
fi
```

Fetch issue state and recent activity if `work` is available:

```bash
work list --status=active --roots --format=short 2>/dev/null | head -10
work list --status=open --roots --format=short 2>/dev/null | head -5
work history --since=yesterday 2>/dev/null | head -15
```

### 3. Summarize

Format gathered data as:

```
**Branch:** `branch-name`
**Commits:** Last 3 commit messages
**PR:** #123 (draft/ready) - title
**Review:** Approved | Changes requested | Pending
**CI:** Passing | Failing (list failures)
**Comments:** N unresolved (summarize key ones)
**Issues:** N active, M open
**Recent Activity:** Key changes since yesterday
```

### 4. Suggest Next Action

Pick the first matching condition:

1. **CI failing** → "Fix failing checks: [check names]"
2. **Changes requested** → "`/respond` to triage N comments"
3. **Unresolved comments** → "`/respond` to triage feedback"
4. **Active issues** → "Continue: [issue title]"
5. **Draft PR, all passing** → "Mark PR ready for review"
6. **Ready PR, approved** → "Merge PR"
7. **No PR** → "`/submit` to create PR"
8. **All clear** → "`/review` or wait for review"

### 5. Maintenance

Run periodic cleanup after showing the user their state:

```bash
work gc --days=30 2>/dev/null || true
```

## Notes

- Limit output with `head -N` to prevent context overflow
- Only top-level comments (`in_reply_to_id == null`)
- Skip issues commands if `work` not installed
