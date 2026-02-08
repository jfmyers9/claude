---
name: refine
description: Simplifies code + improves comments in uncommitted changes. Removes unnecessary complexity + low-value comments.
allowed-tools: Bash, Read, Edit, Glob, Grep
argument-hint: [optional: file-pattern]
---

# Refine Skill

Reviews uncommitted code changes + refines by simplifying implementation + improving comments. Use before committing to ensure clean, readable, well-documented code.

## Instructions

1. **Identify files to review**:
   - If `$ARGUMENTS`: use as file pattern (e.g., "*.py", "src/**/*.ts")
   - Otherwise: `git diff --name-only HEAD`
   - Filter to code files only (exclude config, lock, generated files)
   - Exit if none found

2. **Read files in parallel**

3. **Analyze each file**:
   - **Code**: unnecessary complexity (nested conditionals, overly abstract, premature optimization), clever code (brevity over clarity), over-engineering (abstractions used once), best practice violations
   - **Comments**: low-value (restates code), obvious (explains self-explanatory code), outdated (doesn't match implementation), missing valuable (complex logic needs explanation)
   - **Doc comments** (JSDoc, docstrings, GoDoc, RustDoc): preserve by default (see preservation rules below)

4. **Apply refinements**:
   - Flatten nested conditionals
   - Extract magic numbers → named constants (if multiple uses)
   - Replace abbreviations w/ clear names
   - Break functions doing multiple things
   - Remove comments restating code (e.g., "// set variable", "// call function")
   - Keep: "why" explanations, edge case warnings, context, business logic
   - **Do NOT**: add features, change behavior, add error handling, add abstractions (unless removing complexity), add comments to unchanged code, refactor beyond committed changes

5. **Verify changes**:
   - Check syntax (linter, parser check)
   - Revert + note issues if verification fails
   - Track all refinements

6. **Summary**:
   - Simplifications applied + comments removed + comments improved per file
   - Offer: `git diff`

## Refactoring Principles

**Simplicity > cleverness**: 3 lines > premature abstraction. Explicit > implicit. Readable > concise.

**Remove**:
- `// Create user object` → `user = new User()`
- `// Loop through items` → `for (item in items)`
- `// Return result` → `return result`
- `// TODO: fix this` (without context)

**Keep**:
- Why non-obvious approach chosen
- Edge cases + gotchas
- Business logic + domain rules
- Performance warnings + limitations

**Doc Comment Preservation**:

Preserve by default: JSDoc (`/** */`), Python docstrings (`"""`), GoDoc, RustDoc (`///`). API documentation consumed by tools + IDEs.

Remove only if vacuous:
- Empty doc comment
- Restates signature with zero info (e.g., `/** Gets name. */ getName()`)

If inaccurate/outdated: **update**, don't remove.

**Code simplification**:
- Remove redundant defaults (`.get(key, None)` → `.get(key)`)
- Replace inline lambdas w/ direct expressions
- Flatten unnecessary nesting

## Tips

- Focus on committed changes, not entire codebase
- Don't refactor unchanged working code
- Preserve original intent + behavior
- Prefer simpler code when in doubt
- Remove comments only if truly low-value
- Complex code → simplify rather than comment
- Run tests after refinements if available

## Notes

- Modifies files in place
- Changes not auto-committed
- Review w/ `git diff` before committing
- Revert w/ `git restore <file>` if needed
- Consider pre-commit workflow
