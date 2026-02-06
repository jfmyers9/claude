---
name: pr-fix-gha
description: "Use when CI is failing, GitHub Actions checks are red, the build is broken, tests fail in CI, or lint/type checks fail on a pull request."
allowed-tools: Bash, Read, Edit, Glob, Grep
argument-hint: "[PR number or leave blank for current branch PR]"
---

# PR Fix GHA Skill

Diagnose and fix failed GitHub Actions checks on a pull request.
Fetches logs, identifies failure types, and applies targeted fixes.

## Instructions

### 1. Identify the PR

If `$ARGUMENTS` contains a PR number, use it. Otherwise, detect
from current branch:

```bash
gh pr view --json number,title,url --jq '.number'
```

If no PR is found, inform the user and exit.

### 2. Fetch Failed Checks

Get all checks and their statuses:

```bash
gh pr checks {pr_number} --json name,state,link \
  --jq '.[] | select(.state == "FAILURE")'
```

If no checks have failed, inform the user and exit.

Display failed checks:

```
Failed Checks for PR #{pr_number}:

1. lint (failed)
2. test-unit (failed)
3. build (failed)

Fetching logs...
```

### 3. Fetch Failure Logs

For each failed check, get the run logs:

```bash
gh run view {run_id} --log-failed 2>/dev/null || \
  gh run view {run_id} --log 2>/dev/null | tail -200
```

To find the run ID from the check:

```bash
gh pr checks {pr_number} --json name,state,detailsUrl \
  --jq '.[] | select(.state == "FAILURE")'
```

Extract the run ID from the details URL, or list runs:

```bash
gh run list --branch $(git branch --show-current) \
  --status failure --limit 5 --json databaseId,name
```

### 4. Diagnose Failures

Parse the logs to categorize each failure. Common categories:

**Build Failures:**
- Missing imports or dependencies
- Type errors (TypeScript, Go, etc.)
- Syntax errors
- Module resolution failures

**Test Failures:**
- Assertion failures (expected vs actual)
- Missing fixtures or test data
- Timeout issues
- Snapshot mismatches

**Lint Failures:**
- Formatting violations
- Unused imports or variables
- Style rule violations
- Missing type annotations

**Infrastructure Failures:**
- Network timeouts
- Resource limits
- Flaky tests (check if re-run might help)
- Missing environment variables

For each failure, extract:
- The specific error message
- The file and line number
- What the check expected vs what it got

### 5. Create Fix Plan

Present a diagnosis and fix plan:

```
Diagnosis:

1. lint: Unused import in src/auth.ts:3 (auto-fixable)
2. test-unit: Assertion failure in test/auth.test.ts:42
   - Expected: "authenticated"
   - Got: "pending"
3. build: Type error in src/api.ts:18
   - Property 'name' does not exist on type 'User'

Fix Plan:

1. Remove unused import from src/auth.ts
2. Update test assertion to match new behavior
3. Add 'name' property to User type

Proceed with fixes? (y/n)
```

Wait for user confirmation before applying fixes.

### 6. Apply Fixes

For each fixable issue:

1. **Read the file** to understand full context
2. **Apply the fix** using Edit tool
3. **Verify** the fix makes sense in context

**Category-specific fix strategies:**

- **Lint fixes**: Run the project's linter with auto-fix if available
  (`npm run lint -- --fix`, `ruff check --fix`, `gofmt`, etc.)
- **Type errors**: Read the type definitions, fix the mismatch
- **Test failures**: Read the test AND the implementation to
  understand if the test or code is wrong
- **Import errors**: Add missing imports, remove unused ones
- **Snapshot mismatches**: Update snapshots if behavior change is
  intentional

**Important:** For test failures, determine whether the test is
wrong or the code is wrong. Don't blindly update tests to pass.

### 7. Verify Locally

After applying fixes, run checks locally if possible:

```bash
# Try common check commands
npm run lint 2>/dev/null
npm run typecheck 2>/dev/null
npm run test 2>/dev/null
go vet ./... 2>/dev/null
```

Only run commands that are relevant to the failures found.
Don't fail if local tools aren't available.

### 8. Commit and Push

After fixes are applied and verified:

1. Stage changed files: `git add <specific-files>`
2. Commit: `fix: resolve failing CI checks`
   - Include details in commit body about what was fixed
3. Ask user before pushing
4. If confirmed, push using Graphite: `gt ss --update-only`

## Output

Display summary to user:

```
GHA Failures Fixed

PR: #{pr_number} - {title}
Checks Fixed: {count} of {total failed}
Files Modified: {list}

Fixes Applied:
- lint: Removed unused import (src/auth.ts)
- build: Added missing type property (src/api.ts)

{If any checks were not fixable:}
Unresolved:
- test-unit: Requires understanding of intended behavior
  (test/auth.test.ts:42)

{If infrastructure failure:}
Note: {check_name} appears to be an infrastructure issue.
  Consider re-running: gh run rerun {run_id}

Changes committed. Push with: gt ss --update-only
```

## Tips

- Read the full log output, not just the last error line
- Build errors often cascade — fix the first error and re-check
- Lint failures are usually the easiest to auto-fix
- For test failures, understand the intent before changing anything
- Infrastructure failures (timeouts, network) may just need a re-run
- Type errors in one file can be caused by changes in another file

## Notes

- This skill modifies files and creates commits
- It does NOT push automatically — always asks first
- Uses `gt ss --update-only` for Graphite-compatible pushes
- Works with the current branch's PR by default
- Requires `gh` CLI to be authenticated
- For infrastructure failures, suggest re-running instead of fixing
