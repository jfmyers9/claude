---
name: pr-fix-comments
description: "Use when the user wants to address PR review feedback, fix review comments, resolve review threads, or handle requested changes on a pull request."
allowed-tools: Bash, Read, Edit, Glob, Grep
argument-hint: "[PR number or leave blank for current branch PR]"
---

# PR Fix Comments

Fetch unresolved review comments from PR, understand requested changes,
apply fixes.

## Instructions

### 1. Identify PR

Use `$ARGUMENTS` PR number or detect from current branch:

```bash
gh pr view --json number,title,url --jq '.number'
```

Exit if no PR found.

### 2. Fetch Unresolved Comments

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
  --paginate --jq '.[] | select(.position != null or .line != null)'

gh pr view {pr_number} --json reviewThreads \
  --jq '.reviewThreads[] | select(.isResolved == false)'
```

Extract: file path, line number, comment body, author, thread ID.

Exit if none found.

### 3. Display Comments

Show numbered list + prompt:

```
Unresolved PR Comments for #{pr_number}:

1. [file.ts:42] @reviewer: "Consider using const..."
2. [api.go:18] @reviewer: "Add error handling..."

Fix: (all / 1,2,3 / none)
```

Exit on "none", fix all on "all", fix selected numbers otherwise.

### 4. Plan Fixes

For each comment:
1. Read file context around line
2. Parse intent: code change / question / suggestion / style
3. Create fix plan: file, line, change, why

Display plan + request confirmation.

### 5. Apply Fixes

Per approved fix:
1. Read current file
2. Apply via Edit tool
3. Verify
4. Add imports if needed

Group by file (sequential). Different files (parallel).

### 6. Resolve Threads

Per fixed comment:

1. Draft brief reply: "Done." for simple fixes, explain for complex
2. Show proposed replies + prompt
3. Post replies:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  --method POST --field body="Done."
```

4. Resolve via GraphQL:

```bash
gh api graphql -f query='mutation {
  resolveReviewThread(input: {threadId: "{thread_node_id}"}) {
    thread { isResolved }
  }
}'
```

Note: REST API doesn't support resolving—use GraphQL mutation.

### 7. Push Changes

1. `git add <specific-files>`
2. `git commit -m "fix: address PR review comments"`
3. Ask before push
4. `gt ss --update-only` if confirmed

## Output

```
PR Review Comments Fixed

PR: #{pr_number} - {title}
Fixed: {count}/{total}
Modified: {file list}

{If skipped:}
Skipped:
- [file:line] {reason}

Committed. Push: gt ss --update-only
```

## Tips

- Read full file context, not just line
- Questions -> answer in thread, not code change
- Ambiguous -> skip + note why
- GitHub suggestion blocks -> apply directly
- Verify imports + references after fixes

## Notes

- Modifies files + creates commits
- Does NOT push automatically
- Uses `gt ss --update-only` (Graphite)
- Current branch PR by default
- Requires `gh` CLI authenticated
