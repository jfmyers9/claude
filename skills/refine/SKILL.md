---
name: refine
description: >
  Simplify code + improve comments in uncommitted changes.
  Triggers: 'refine', 'clean up code', 'simplify changes'.
allowed-tools: Bash, Read, Edit, Glob, Grep
argument-hint: "[optional: file-pattern]"
---

## Identify Files

1. If `$ARGUMENTS`: use as file pattern
2. Otherwise: `git diff --name-only HEAD`
3. Filter to code files (exclude config, lock, generated)
4. No files → inform + exit

## Read Files (parallel)

Read all identified files.

## Analyze + Apply

For each file, find and fix:

**Simplify code:**
- Flatten nested conditionals → early returns/guard clauses
- Extract magic numbers → named constants (if used 2+ times)
- Replace abbreviations with clear names
- Break multi-responsibility functions
- Remove redundant defaults (`.get(key, None)` → `.get(key)`)
- Replace inline lambdas with direct expressions

**Improve comments:**
- Remove code-restating comments ("increment counter",
  "loop through items", "return result")
- Remove contextless TODOs
- Keep: why-explanations, edge case warnings, business logic,
  perf constraints
- Update inaccurate/outdated comments (don't remove)

**Doc comments** (JSDoc, docstrings, GoDoc, RustDoc):
- Preserve by default — consumed by tools + IDEs
- Remove only if vacuous (empty, or restates signature with
  zero info)
- If inaccurate → update, don't remove

## Boundaries

Do NOT:
- Add features or change behavior
- Add error handling or abstractions
- Add comments to unchanged code
- Touch code outside the diff
- Refactor beyond committed changes

## Verify

Check syntax after changes (linter/parser). Revert + note
if verification fails.

## Summary

Per file: simplifications applied, comments removed/improved.
Offer `git diff` to review.
