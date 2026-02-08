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

Check tracked repos for changes since last review and
optionally spawn a deep exploration of significant diffs.

## Instructions

### 1. Read Tracking File

Read `tracked-repos.json` (repo root). If it doesn't exist,
tell the user no repos are tracked and offer to add one.

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

If `` specifies a repo slug (e.g., `luan/dot-claude`):
use that repo. If no argument: list all tracked repos with
their last review dates. If only one repo, use it. If
multiple, ask user which to review.

### 3. Fetch Changes

Run:
```bash
gh api 'repos/{owner}/{repo}/compare/{last_sha}...HEAD' \
  --jq '{
    ahead_by: .ahead_by,
    commits: [.commits[] | {sha: .sha[:7], message: .commit.message | split("\n")[0], date: .commit.author.date[:10]}],
    files: [.files[] | {name: .filename, status: .status, changes: .changes}]
  }'
```

If `ahead_by` is 0: report "No changes since last review"
and exit.

### 4. Summarize Changes

Display concise summary:
- Number of new commits since last review
- Date range of changes
- Files changed (grouped by directory)
- Key commit messages

### 5. Assess Significance

Categorize changed files as:
- **Relevant**: skills/, rules/, agents/, hooks/, CLAUDE.md,
  settings.json
- **Irrelevant**: language-specific (*.rs, *.swift), CI/CD,
  README, tests for their projects

If no relevant files changed: report "No relevant changes"
and offer to update the SHA anyway.

### 6. Offer Deep Exploration

If relevant changes found, ask user:
- "Run `/team-explore` on the diff?" (for significant changes)
- "Just update the tracking SHA?" (for minor changes)
- "Skip for now?"

### 7. Update Tracking

If user approves (or after exploration completes):

Get the latest SHA:
```bash
gh api 'repos/{owner}/{repo}/commits?per_page=1' \
  --jq '.[0].sha'
```

Update `tracked-repos.json` with:
- New `last_reviewed_sha`
- New `last_reviewed_date` (today)
- New `review_doc` path (if exploration was run)

### 8. Adding New Repos

If user asks to track a new repo (no existing entry):
1. Validate repo exists: `gh api 'repos/{owner}/{repo}'`
2. Get current HEAD SHA
3. Add entry to tracked-repos.json
4. Suggest running `/team-explore` for initial review

## Alternatives

For repos where deeper file-level diffing is needed (e.g.,
reviewing exact line changes rather than commit summaries),
git submodules are an option. They let you pin to a specific
commit and run `git diff` locally. However, the API-based
approach used here is lighter and doesn't require cloning
external repos. Only consider submodules if the GitHub compare
API's 250-commit limit or lack of inline diffs becomes a real
pain point.

## Error Handling

- **Force-pushed repos**: If the compare API returns 404 or
  an error referencing the stored SHA, inform the user that
  the baseline SHA is unreachable (likely force-pushed) and
  offer to reset tracking to current HEAD.
- **Deleted or private repos**: If the repo API returns 403
  or 404, inform the user the repo is inaccessible and offer
  to remove it from tracked-repos.json.
- **API 250-commit limit**: If `ahead_by` exceeds 250, warn
  the user that the commit list is truncated by the GitHub
  API and suggest reviewing the repo directly on GitHub.
- **Malformed tracking file**: If `tracked-repos.json`
  cannot be parsed as valid JSON, inform the user and offer
  to back up the broken file and recreate it from scratch.
