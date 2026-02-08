---
name: review-upstream
description: "Check tracked repos for changes since last review. Triggers: 'review upstream', 'check upstream', 'what changed in X repo'."
argument-hint: "[repo-slug]"
user-invocable: true
allowed-tools:
  - Task
  - Skill
  - AskUserQuestion
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Review Upstream

Check tracked repos for changes + optionally spawn deep exploration of significant diffs.

## Instructions

### 1. Read Tracking File

Read `tracked-repos.json` (repo root). If missing, tell user no repos tracked + offer to add one.

Format:
```json
{
  "owner/repo": {
    "last_reviewed_sha": "abc123",
    "last_reviewed_date": "2026-02-08",
    "review_doc": ".jim/plans/YYYY...-slug.md"
  }
}
```

### 2. Select Repo

If `$ARGUMENTS` specifies repo slug (e.g., `luan/dot-claude`): use that. If no argument: list all tracked repos + dates. Single repo -> use it. Multiple -> ask user.

### 3. Fetch Changes

```bash
gh api 'repos/{owner}/{repo}/compare/{last_sha}...HEAD' \
  --jq '{
    ahead_by: .ahead_by,
    commits: [.commits[] | {sha: .sha[:7], message: .commit.message | split("\n")[0], date: .commit.author.date[:10]}],
    files: [.files[] | {name: .filename, status: .status, changes: .changes}]
  }'
```

If `ahead_by` = 0: report "No changes since last review" -> exit.

### 4. Summarize Changes

Display summary:
- New commit count
- Date range
- Files changed (by directory)
- Key commit messages

### 5. Assess Significance

Categorize files:
- **Relevant**: skills/, rules/, agents/, hooks/, CLAUDE.md, settings.json
- **Irrelevant**: language-specific (*.rs, *.swift), CI/CD, README, project tests

No relevant changes -> report "No relevant changes" + offer SHA update anyway.

### 6. Offer Deep Exploration

Relevant changes found:
- "Run `/team-explore` on diff?" (significant)
- "Just update SHA?" (minor)
- "Skip for now?"

### 7. Update Tracking

On approval (or after exploration):

```bash
gh api 'repos/{owner}/{repo}/commits?per_page=1' \
  --jq '.[0].sha'
```

Update `tracked-repos.json`:
- `last_reviewed_sha` (new)
- `last_reviewed_date` (today)
- `review_doc` (if exploration run)

### 8. Adding New Repos

Track new repo (no existing entry):
1. Validate: `gh api 'repos/{owner}/{repo}'`
2. Get HEAD SHA
3. Add to tracked-repos.json
4. Suggest `/team-explore` for initial review

## Alternatives

File-level diffing (exact line changes vs summaries) -> git submodules. Pin specific commit + run `git diff` locally. API approach lighter, no external clone. Use submodules only if 250-commit limit or missing inline diffs becomes blocker.

## Error Handling

- **Force-pushed**: Compare API 404 + unreachable SHA -> inform user (likely force-pushed), offer reset to HEAD
- **Deleted/private**: API 403/404 -> repo inaccessible, offer removal from tracked-repos.json
- **API 250-commit limit**: `ahead_by` > 250 -> warn truncated, suggest GitHub review
- **Malformed JSON**: tracked-repos.json parse fails -> inform user, offer backup + recreate
