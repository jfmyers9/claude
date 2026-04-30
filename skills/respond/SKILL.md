---
name: respond
description: >
  Triage PR review feedback, recommend actions, and draft replies in a
  blueprint. Triggers: /respond, 'respond to PR', 'address feedback'.
allowed-tools: Bash, Read, Write, Glob, Grep
argument-hint: "[pr-number] | --continue [slug]"
---

# Respond

Triage PR review feedback and write a `plan/` blueprint containing
valid fixes and reply drafts.

@rules/blueprints.md and @rules/harness-compat.md apply.

## Arguments

- `<pr-number>` — PR to triage
- `--continue [slug]` — continue latest or matching respond blueprint
- no args — current branch's PR

## Workflow

### 1. Resolve PR / Continue

- `--continue`: find `blueprint find --type plan --match respond` or
  provided slug; read and continue it.
- PR number: `gh pr view <number> --json number,title,url`.
- No args: `gh pr view --json number,title,url`.
- If no PR found, stop and suggest `/skill:submit`.

### 2. Fetch Comments and Diff

Gather:

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

Use unresolved review threads. Preserve file, line, author, body, and
diff hunk. Limit verbose output.

### 3. Filter

Triage:

- human change requests, design questions, and suggestions
- critical bot findings if valid

Skip:

- resolved comments
- acknowledgements
- author's own comments
- bot style nits that would create automated-review loops

### 4. Analyze

For each comment:

1. Read referenced code.
2. Determine what reviewer is asking.
3. Check if feedback is valid against current code.
4. Check if already handled elsewhere.
5. Classify exactly one:
   - `agree`
   - `disagree`
   - `question`
   - `already-done`

For `agree`, include concrete fix steps. For others, draft a reply.

### 5. Write Blueprint

```bash
file=$(blueprint create plan "Respond: PR #$PR_NUM" --status draft)
```

Body:

```markdown
## Triage

### Agree
1. [file:line] @reviewer — <request>
   - Rationale:
   - Suggested fix:

### Disagree
1. [file:line] @reviewer — <request>
   - Rationale:
   - Suggested reply:

### Question
...

### Already Done
...

## Plan

**Phase 1: Agreed Fixes**
- Files:
- Steps:
- Verify:

## Reply Drafts

- <comment id/path>: <reply>
```

Run `blueprint commit plan <slug>`.

### 6. Report

```text
Respond Plan: <path>
Agree: N, Disagree: N, Question: N, Already done: N
Next: /skill:implement for agreed fixes; post Reply Drafts as needed
```

## Rules

- Never reply to bot style nits unless human discussion is needed.
- Prefer fixing valid comments silently over debating.
- Keep reply drafts concise and non-defensive.
