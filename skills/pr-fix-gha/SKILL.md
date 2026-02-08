---
name: pr-fix-gha
description: "Use when CI is failing, GitHub Actions checks are red, the build is broken, tests fail in CI, or lint/type checks fail on a pull request."
allowed-tools: Bash, Read, Edit, Glob, Grep
argument-hint: "[PR number or leave blank for current branch PR]"
---

# PR Fix GHA

Diagnose + fix failed GitHub Actions checks. Fetches logs, identifies
failure types, applies targeted fixes.

## Steps

### 1. Identify PR

If `$ARGUMENTS` has PR number, use it. Otherwise detect from branch:

```bash
gh pr view --json number,title,url --jq '.number'
```

Exit if not found.

### 2. Fetch Failed Checks

```bash
gh pr checks {pr_number} --json name,state,link \
  --jq '.[] | select(.state == "FAILURE")'
```

Exit if none. Display with example output.

### 3. Get Run Logs

```bash
gh run view {run_id} --log-failed 2>/dev/null || \
  gh run view {run_id} --log 2>/dev/null | tail -200
```

Find run ID from detailsUrl or:

```bash
gh run list --branch $(git branch --show-current) \
  --status failure --limit 5 --json databaseId,name
```

### 4. Diagnose Failures

Parse logs, categorize:

**Build:** Missing imports/deps, type errors, syntax, module resolution
**Test:** Assertions, missing fixtures, timeouts, snapshots
**Lint:** Formatting, unused imports/vars, style, missing types
**Infrastructure:** Network timeouts, resource limits, flaky, env vars

Extract per failure: error message, file + line, expected vs actual.

### 5. Present Fix Plan

Show diagnosis + plan, await user confirmation.

### 6. Apply Fixes

Per issue:
1. Read file for context
2. Apply fix with Edit
3. Verify in context

**Strategies:**
- **Lint:** Run auto-fix (`npm run lint -- --fix`, `gofmt`, etc)
- **Types:** Read definitions, fix mismatch
- **Tests:** Read test + impl to determine which is wrong (don't blindly
  update tests)
- **Imports:** Add missing, remove unused
- **Snapshots:** Update if behavior change intentional

### 7. Verify Locally

```bash
npm run lint 2>/dev/null
npm run typecheck 2>/dev/null
npm run test 2>/dev/null
go vet ./... 2>/dev/null
```

Only relevant commands. Don't fail if unavailable.

### 8. Commit + Push

1. `git add <files>`
2. `fix: resolve failing CI checks` (+ details in body)
3. Ask before pushing
4. If yes: `gt ss --update-only`

## Output

Summary: PR info, fixed count, files modified, fixes applied, unresolved,
infra notes.

## Tips

- Read full logs, not last line
- Build errors cascade — fix first error + recheck
- Lint easiest to auto-fix
- Test failures: understand intent before changing
- Infra failures: may need re-run only
- Type error in one file -> caused by change in another

## Notes

- Modifies files + commits
- Does NOT push without asking
- Uses `gt ss --update-only`
- Needs `gh` authenticated
