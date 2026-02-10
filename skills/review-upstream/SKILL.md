---
name: review-upstream
description: >
  Check tracked repos for changes since last review.
  Triggers: 'review upstream', 'check upstream',
  'what changed in X repo'.
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

Check tracked repos for changes since last review. Optionally
spawn deep exploration of significant diffs.

## Steps

### 1. Read Tracking File

Read `tracked-repos.json` at repo root.

Expected format:

```json
{
  "owner/repo": {
    "last_reviewed_sha": "abc123",
    "last_reviewed_date": "2026-02-08",
    "review_doc": ".jim/plans/YYYY...-slug.md"
  }
}
```

Missing file → tell user no repos tracked, offer to add one.

### 2. Select Repo

- `$ARGUMENTS` specifies slug → use it
- Single tracked repo → use it
- Multiple → list all with dates, ask user

### 3. Fetch Changes

```bash
gh api 'repos/{owner}/{repo}/compare/{last_sha}...HEAD' \
  --jq '{
    ahead_by: .ahead_by,
    commits: [.commits[] | {
      sha: .sha[:7],
      message: .commit.message | split("\n")[0],
      date: .commit.author.date[:10]
    }],
    files: [.files[] | {
      name: .filename, status: .status, changes: .changes
    }]
  }'
```

`ahead_by` = 0 → report "No changes since last review", exit.

### 4. Summarize

Display:

- Commit count + date range
- Files changed grouped by directory
- Key commit messages

### 5. Assess Significance

Categorize changed files:

- **Relevant**: skills/, rules/, agents/, hooks/, CLAUDE.md,
  settings.json
- **Irrelevant**: language-specific (*.rs, *.swift), CI/CD,
  README, project tests

No relevant changes → report + offer SHA update anyway.

### 6. Offer Next Action

Present options based on significance:

- "Run /team-explore on diff?" (significant changes)
- "Just update SHA?" (minor changes)
- "Skip for now?"

### 7. Update Tracking

After user approves (or after exploration completes):

```bash
gh api 'repos/{owner}/{repo}/commits?per_page=1' \
  --jq '.[0].sha'
```

Update `tracked-repos.json`:

- `last_reviewed_sha` → new HEAD
- `last_reviewed_date` → today
- `review_doc` → path if exploration was run

### 8. Adding New Repos

When user requests tracking a new repo:

1. Validate: `gh api 'repos/{owner}/{repo}'`
2. Get HEAD SHA
3. Add entry to tracked-repos.json
4. Suggest /team-explore for initial review

## Error Handling

- **Force-pushed** (compare API 404, unreachable SHA) →
  inform user, offer reset to current HEAD
- **Deleted/private** (API 403/404) → repo inaccessible,
  offer removal from tracking
- **250-commit limit** (`ahead_by` > 250) → warn results
  truncated, suggest reviewing on GitHub
- **Malformed JSON** (parse failure) → inform user, offer
  backup + recreate
