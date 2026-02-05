---
name: refine
description: Simplifies code and improves comments in uncommitted changes before committing. Removes unnecessary complexity and low-value comments.
allowed-tools: Bash, Read, Edit, Glob, Grep
argument-hint: [optional: file-pattern]
---

# Refine Skill

This skill reviews uncommitted code changes and refines them by simplifying implementation and improving comments. Use this before committing to ensure code is clean, readable, and well-documented.

## Instructions

1. **Identify files to review**:
   - If `$ARGUMENTS` is provided, use it as a file pattern (e.g., "*.py", "src/**/*.ts")
   - Otherwise, get all modified and new files: `git diff --name-only HEAD`
   - Filter to only include code files (exclude config, lock files, generated files)
   - If no files found, inform user and exit

2. **Read all files in parallel**:
   - Read all identified code files simultaneously to gather context

3. **For each file** (can process independent files in parallel):
   - Analyze the code for:
     - **Unnecessary complexity**: Nested conditionals, overly abstract code, premature optimization
     - **Clever code**: Code that prioritizes brevity over clarity
     - **Over-engineering**: Abstractions, helpers, or utilities used only once
     - **Best practice violations**: Poor naming, inconsistent patterns, code smells
   - Analyze comments for:
     - **Low-value comments**: Comments that restate what the code does
     - **Obvious comments**: Comments explaining self-explanatory code
     - **Outdated comments**: Comments that don't match the implementation
     - **Missing valuable comments**: Complex logic that needs explanation

4. **Apply refinements**:
   - Simplify complex code:
     - Flatten nested conditionals where possible
     - Extract magic numbers to named constants (only if used multiple times)
     - Use clear variable names instead of abbreviations
     - Break down large functions (only if they do multiple things)
   - Improve comments:
     - Remove comments that just restate the code
     - Remove comments like "// set variable" or "// call function"
     - Keep comments that explain "why" not "what"
     - Keep comments that explain non-obvious behavior or edge cases
     - Keep comments that provide important context or warnings
   - **Do NOT**:
     - Add features or change behavior
     - Add error handling that wasn't there
     - Add abstractions unless removing complexity
     - Add comments to code you didn't change
     - Refactor code beyond the changes being committed

5. **Verify changes**:
   - After editing each file, verify it's still valid:
     - Check syntax if possible (run linter, parser check, etc.)
     - If verification fails, revert the change and note the issue
   - Keep track of all refinements made

6. **Present summary**:
   - Show a summary of refinements for each file:
     - Simplifications applied
     - Comments removed
     - Comments improved
   - Ask if user wants to see the detailed diff: `git diff`

## Refactoring Principles

**Simplicity over cleverness:**
- Three similar lines is better than a premature abstraction
- Explicit is better than implicit
- Readable is better than concise

**When to remove comments:**
- `// Create user object` above `user = new User()` - Remove
- `// Loop through items` above `for (item in items)` - Remove
- `// Return result` above `return result` - Remove
- `// TODO: fix this` without context - Remove or make specific

**When to keep comments:**
- Explaining why a non-obvious approach was chosen
- Documenting edge cases or gotchas
- Explaining business logic or domain-specific behavior
- Warning about performance implications or limitations

**When to simplify code:**
- Remove redundant defaults (`.get(key, None)` → `.get(key)`)
- Replace inline lambdas with direct expressions
- Flatten unnecessary nesting

## Tips

- Focus on changes being committed, not the entire codebase
- Don't refactor working code that isn't being changed
- Preserve the original intent and behavior
- When in doubt, prefer simpler code over clever abstractions
- Only remove comments if they're truly low-value
- If code is complex, consider if it can be simplified rather than just adding comments
- Run tests after refinements if available

## Notes

- This skill modifies files in place
- Changes are not committed automatically
- Use `git diff` to review all changes before committing
- If the skill makes unwanted changes, use `git restore <file>` to revert
- Consider running this skill as part of your pre-commit workflow
