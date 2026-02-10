---
name: pr-fix-gha
description: >
  Diagnose + fix failed GitHub Actions checks on a PR.
  Triggers: 'CI failing', 'checks are red', 'build broken',
  'tests fail in CI', 'lint failing on PR'.
allowed-tools: Bash, Read, Edit, Glob, Grep
argument-hint: "[PR number or leave blank for current branch PR]"
---

# PR Fix GHA

Diagnose + fix failed GitHub Actions checks on a PR.

## Steps

### 1. Identify PR

Use `$ARGUMENTS` as PR number if provided. Otherwise detect:

```bash
gh pr view --json number,title,url --jq '.number'
```

Exit if no PR found.

### 2. Fetch Failed Checks

```bash
gh pr checks {pr} --json name,state,link \
  --jq '.[] | select(.state == "FAILURE")'
```

Exit if none failed.

### 3. Get Run Logs

Extract run ID from check detailsUrl, or:

```bash
gh run list --branch $(git branch --show-current) \
  --status failure --limit 5 --json databaseId,name
```

Fetch logs:

```bash
gh run view {run_id} --log-failed 2>/dev/null || \
  gh run view {run_id} --log 2>/dev/null | tail -200
```

### 4. Diagnose

Categorize each failure:

- **Build** -- missing imports/deps, type errors, syntax,
  module resolution
- **Test** -- assertion failures, missing fixtures, timeouts,
  stale snapshots
- **Lint** -- formatting, unused imports/vars, style violations
- **Infra** -- network timeouts, resource limits, flaky tests,
  missing env vars

Extract per failure: error message, file + line,
expected vs actual.

Build errors cascade -- fix first error, recheck before
proceeding.

### 5. Present Fix Plan

Show diagnosis + proposed fixes. Await user confirmation
before applying.

### 6. Apply Fixes

For each issue: read file context, apply fix via Edit,
verify in context.

Strategies by category:

- **Lint** -- run auto-fix first (`npm run lint -- --fix`,
  `gofmt`, etc)
- **Types** -- read type definitions, fix mismatch at source
- **Tests** -- read test + implementation to determine which
  is wrong; never blindly update assertions
- **Imports** -- add missing, remove unused
- **Snapshots** -- update only if behavior change intentional

Type error in file A may originate from change in file B --
trace root cause.

### 7. Verify Locally

Run relevant commands only:

```bash
npm run lint 2>/dev/null
npm run typecheck 2>/dev/null
npm run test 2>/dev/null
go vet ./... 2>/dev/null
```

### 8. Commit + Push

1. Stage changed files by name
2. Commit: `fix: resolve failing CI checks` (details in body)
3. Ask user before pushing
4. If confirmed: `gt ss --update-only`
