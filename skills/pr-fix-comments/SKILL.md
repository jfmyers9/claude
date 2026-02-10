---
name: pr-fix-comments
description: >
  Fetch unresolved PR review comments + apply fixes.
  Triggers: 'address PR feedback', 'fix review comments',
  'resolve review threads', 'handle requested changes'.
allowed-tools: Bash, Read, Edit, Glob, Grep
argument-hint: "[PR number or leave blank for current branch PR]"
---

# PR Fix Comments

Fetch unresolved review comments, apply fixes, resolve threads.

## Steps

### 1. Identify PR

Use `$ARGUMENTS` as PR number if provided. Otherwise detect:

```bash
gh pr view --json number,title,url --jq '.number'
```

Exit if no PR found.

### 2. Fetch Unresolved Threads

```bash
gh pr view {pr} --json reviewThreads \
  --jq '.reviewThreads[] | select(.isResolved == false)'
```

Also fetch inline comments for position data:

```bash
gh api repos/{owner}/{repo}/pulls/{pr}/comments \
  --paginate \
  --jq '.[] | select(.position != null or .line != null)'
```

Extract per thread: file path, line number, comment body,
author, thread ID (node_id).

Exit if none found.

### 3. Display + Prompt

Show numbered list:

```
Unresolved comments on #{pr}:

1. [file.ts:42] @reviewer: "Consider using const..."
2. [api.go:18] @reviewer: "Add error handling..."

Fix: (all / 1,2,3 / none)
```

- "none" → exit
- "all" → fix all
- numbers → fix selected

### 4. Plan Fixes

For each selected comment:

1. Read file context around referenced line
2. Classify intent: code change / question / suggestion / style
3. Create fix plan: file, line, change, rationale

Questions → answer in thread reply, no code change.
Ambiguous → skip + note reason.
GitHub suggestion blocks → apply directly.

Display plan, await confirmation.

### 5. Apply Fixes

For each approved fix:

1. Read current file state
2. Apply change via Edit
3. Verify surrounding context intact
4. Add imports if needed

Group by file: sequential within file, parallel across files.

### 6. Resolve Threads

For each fixed comment:

1. Reply via REST API ("Done." for simple, explanation for
   complex):

```bash
gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies \
  --method POST --field body="Done."
```

2. Resolve via GraphQL (REST doesn't support resolving):

```bash
gh api graphql -f query='mutation {
  resolveReviewThread(input: {threadId: "{node_id}"}) {
    thread { isResolved }
  }
}'
```

Show proposed replies before posting. Await confirmation.

### 7. Commit + Push

1. Stage changed files by name
2. Commit: `fix: address PR review comments`
3. Ask user before pushing
4. If confirmed: `gt ss --update-only`
