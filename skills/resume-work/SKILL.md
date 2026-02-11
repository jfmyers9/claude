---
name: resume-work
description: >
  Resume work on a branch/PR after a break. Triggers: /resume-work, /resume
allowed-tools: Bash
argument-hint: "[branch-name|PR#]"
---

# Resume Work

Gather context on current work and suggest next action.

## Usage

```bash
/resume-work              # Current branch
/resume-work my-branch    # Specific branch
/resume-work 123          # PR number
```

## Implementation

```bash
# Parse arguments
BRANCH="$ARGUMENTS"
if [[ -z "$BRANCH" ]]; then
  BRANCH=$(git branch --show-current)
elif [[ "$BRANCH" =~ ^[0-9]+$ ]]; then
  # PR number provided - get branch from PR
  BRANCH=$(gh pr view "$BRANCH" --json headRefName -q .headRefName 2>/dev/null || echo "")
  if [[ -z "$BRANCH" ]]; then
    echo "Error: PR #$ARGUMENTS not found"
    exit 1
  fi
  git checkout "$BRANCH" 2>/dev/null || true
else
  # Branch name provided - checkout
  git checkout "$BRANCH" 2>/dev/null || true
fi

# Gather context in parallel
{
  echo "=== BRANCH ==="
  git branch --show-current

  echo -e "\n=== RECENT COMMITS ==="
  git log --oneline -10

  echo -e "\n=== STATUS ==="
  git status -sb

  echo -e "\n=== PR INFO ==="
  gh pr view --json number,title,state,isDraft,reviewDecision,statusCheckRollup,url 2>/dev/null || echo "No PR found"

  echo -e "\n=== CI CHECKS ==="
  gh pr checks 2>/dev/null || echo "No PR found"

  echo -e "\n=== REVIEW COMMENTS ==="
  PR_NUM=$(gh pr view --json number -q .number 2>/dev/null)
  if [[ -n "$PR_NUM" ]]; then
    REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
    gh api "repos/$REPO/pulls/$PR_NUM/comments" --jq '.[] | select(.in_reply_to_id == null) | "- \(.path):\(.line) (@\(.user.login)): \(.body | split("\n")[0])"' 2>/dev/null | head -20 || echo "No unresolved comments"
  else
    echo "No PR found"
  fi

  echo -e "\n=== BEADS STATUS ==="
  if command -v bd &>/dev/null; then
    echo "In Progress:"
    bd list --status=in_progress 2>/dev/null | head -10 || echo "None"
    echo -e "\nReady to Work:"
    bd ready 2>/dev/null | head -5 || echo "None"
  else
    echo "Beads not available"
  fi
}

# Output is piped through to show raw data
# Skill should then summarize and suggest next action
```

## Summary Format

After gathering context, summarize:

**Branch:** `branch-name`
**Commits:** Last 3 commit messages
**PR:** #123 (draft/ready) - title
**Review:** Approved | Changes requested | Pending
**CI:** ✓ Passing | ✗ Failing (list failures)
**Comments:** N unresolved (summarize key ones)
**Beads:** N in progress, M ready

## Next Action Suggestions

Priority order:

1. **CI failing** → "Fix failing checks: [check names]"
2. **Changes requested** → "Address N review comments"
3. **Unresolved comments** → "Respond to review feedback"
4. **Beads in progress** → "Continue work on: [issue title]"
5. **Draft PR, all passing** → "Mark PR ready for review"
6. **Ready PR, approved, passing** → "Merge PR"
7. **No PR** → "Create PR with /submit"
8. **All clear** → "Review changes with /review or wait for review"

## Notes

- Checkout branch if specified and it exists
- Handle both PR numbers and branch names as input
- Limit output to prevent context overflow (head -N on long lists)
- Show only top-level review comments (in_reply_to_id == null)
- Skip beads if not installed
- Use -sb for compact git status
