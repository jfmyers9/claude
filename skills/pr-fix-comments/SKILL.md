---
name: pr-fix-comments
description: "Use when the user wants to address PR review feedback, fix review comments, resolve review threads, or handle requested changes on a pull request."
allowed-tools: Bash, Read, Edit, Glob, Grep
argument-hint: "[PR number or leave blank for current branch PR]"
---

# PR Fix Comments Skill

Fetch unresolved review comments from a GitHub PR, understand the
requested changes, and apply fixes.

## Instructions

### 1. Identify the PR

If `$ARGUMENTS` contains a PR number, use it. Otherwise, detect
from current branch:

```bash
gh pr view --json number,title,url --jq '.number'
```

If no PR is found, inform the user and exit.

### 2. Fetch Unresolved Review Comments

Fetch all review comments and filter to unresolved threads:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
  --paginate --jq '.[] | select(.position != null or .line != null)'
```

Also fetch review threads to identify which are resolved:

```bash
gh pr view {pr_number} --json reviewThreads \
  --jq '.reviewThreads[] | select(.isResolved == false)'
```

Parse each unresolved thread to extract:
- File path
- Line number (or line range)
- Comment body (the requested change)
- Comment author
- Thread ID (for resolving later)

If no unresolved comments are found, inform the user that all
review threads are resolved and exit.

### 3. Display Comments

Present unresolved comments as a numbered list:

```
Unresolved PR Comments for #{pr_number}:

1. [file.ts:42] @reviewer: "Consider using a const here..."
2. [api.go:18] @reviewer: "This needs error handling..."
3. [test.py:7] @reviewer: "Missing edge case test..."

Which comments to fix? (all / 1,2,3 / none)
```

Wait for user confirmation. If user says "none", exit.
If user says "all", fix everything. Otherwise, fix the
specified numbers.

### 4. Plan Fixes

For each selected comment:

1. **Read the file** to understand full context around the
   commented line
2. **Parse the comment** to understand what's being asked:
   - Is it a specific code change request?
   - Is it a question needing a code-level answer?
   - Is it a suggestion with a code block?
   - Is it a style/convention request?
3. **Create a fix plan** — one line per comment:
   - File, line, what to change, why

Display the fix plan and ask for confirmation before proceeding.

### 5. Apply Fixes

For each approved fix:

1. Read the file for current content
2. Apply the change using Edit tool
3. Verify the edit was applied correctly
4. If the fix requires importing something, add the import

Group fixes by file. Apply fixes to the same file sequentially
to avoid conflicts. Different files can be processed in parallel.

### 6. Resolve Threads

After fixes are applied, for each fixed comment:

1. Reply to the thread with a brief resolution message:
   - Simple fixes: "Done."
   - Non-trivial fixes: Brief explanation of what was changed

2. Show proposed replies to user before posting:

```
Thread replies:

1. [file.ts:42] Reply: "Done."
2. [api.go:18] Reply: "Added error handling with retry."

Post these replies and resolve threads? (y/n)
```

3. If confirmed, post replies:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments\
/{comment_id}/replies \
  --method POST --field body="Done."
```

4. After replying, resolve each thread via GraphQL:

```bash
gh api graphql -f query='mutation {
  resolveReviewThread(input: {
    threadId: "{thread_node_id}"
  }) {
    thread { isResolved }
  }
}'
```

Use the thread's `node_id` (GraphQL ID) obtained from the
review threads query in Step 2. The REST API does not support
resolving threads -- the GraphQL mutation is required.

### 7. Push Changes

After all fixes are applied:

1. Stage changed files: `git add <specific-files>`
2. Commit with message: `fix: address PR review comments`
3. Ask user before pushing
4. If confirmed, push using Graphite: `gt ss --update-only`

## Output

Display summary to user:

```
PR Review Comments Fixed

PR: #{pr_number} - {title}
Comments Fixed: {count} of {total}
Files Modified: {list}

{If any comments were skipped:}
Skipped Comments:
- [file:line] Reason: {too complex / unclear request / etc.}

Changes committed. Push with: gt ss --update-only
```

## Tips

- Read the full file context, not just the commented line
- Some comments are questions, not change requests — answer them
  in the thread reply rather than changing code
- If a comment is ambiguous, skip it and note why
- GitHub review suggestions (```suggestion blocks) contain exact
  code to use — apply them directly
- Check that fixes don't break imports or references

## Notes

- This skill modifies files and creates commits
- It does NOT push automatically — always asks first
- Uses `gt ss --update-only` for Graphite-compatible pushes
- Works with the current branch's PR by default
- Requires `gh` CLI to be authenticated
