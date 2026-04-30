---
name: pr-plan
description: >
  Fetch PR review comments, triage them, and produce a
  blueprint-backed fix plan. Triggers: /pr-plan, 'plan for PR
  comments', 'address PR feedback'.
allowed-tools: Bash, Read, Write, Glob, Grep
argument-hint: "[pr-number] | --continue [slug]"
---

# PR Plan

Fetch PR comments, triage validity, research fixes, and write a
`plan/` blueprint compatible with `/skill:implement`.

@rules/blueprints.md and @rules/harness-compat.md apply.

## Arguments

- `<pr-number>` — target PR
- `--continue [slug]` — continue latest or matching PR plan
- no args — current branch's PR

## Workflow

### 1. Resolve PR / Continue

- `--continue`: find `blueprint find --type plan --match pr-plan` or
  the provided slug; read and continue it.
- PR number: `gh pr view <number> --json number,title,url`.
- No args: `gh pr view --json number,title,url`.
- If no PR exists, stop and suggest `/skill:submit`.

### 2. Fetch Review Context

Run concise/parallel commands:

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
OWNER="${REPO%%/*}"
REPO_NAME="${REPO##*/}"
PR_NUM=<number>

gh api graphql --paginate -F owner="$OWNER" -F repo="$REPO_NAME" -F pr="$PR_NUM" -f query='<reviewThreads query>'
gh pr view "$PR_NUM" --json reviews,comments,reviewDecision,title,body
git diff main...HEAD
git log main..HEAD --format="%h %s"
```

Use the existing unresolved review-thread GraphQL shape from prior
versions of this skill when available. Limit large outputs and preserve
raw diff hunks for triage.

### 3. Filter Comments

Include:

- human code change requests
- human design questions/suggestions
- critical bot findings that appear valid

Skip:

- resolved threads
- acknowledgements
- author's own comments
- bot style/design nits likely to create review loops

Mark outdated threads with `[outdated]` but still triage if relevant.

### 4. Triage + Plan

For each included comment:

1. Read referenced code and nearby context.
2. Classify: `agree`, `disagree`, `question`, `already-done`.
3. For `agree`, research the minimal fix and affected files.
4. For non-agree, draft a concise reply.

### 5. Write Blueprint

```bash
file=$(blueprint create plan "PR #$PR_NUM feedback" --status draft)
```

Body:

```markdown
## PR Feedback Triage

### Agree
1. <file:line> @reviewer — <request>
   - Rationale:
   - Fix:

### Disagree
1. <file:line> @reviewer — <request>
   - Rationale:
   - Suggested reply:

### Question
...

### Already Done
...

## Plan

**Phase 1: Critical Fixes**
- Files:
- Steps:
- Verify:

**Phase 2: Improvements**
...

## Reply Drafts

- <comment id/path>: <reply>
```

Run `blueprint commit plan <slug>` after writing.

### 6. Report

```text
PR Plan: <path>
Agree: N, Disagree: N, Question: N, Already done: N
Next: /skill:implement for agreed fixes; use Reply Drafts for PR comments
```
