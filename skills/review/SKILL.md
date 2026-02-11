---
name: review
description: >
  Senior engineer code review, filing findings as beads issues.
  Triggers: 'review code', 'code review', 'review my changes'.
allowed-tools: Bash, Read, Glob, Grep
argument-hint: "[file-pattern]"
---

# Code Review Skill

Perform senior engineer code review and file findings as beads issues.

## Steps

1. **Get current branch**
   - `git branch --show-current`
   - Exit if main/master (nothing to review)

2. **Get changed files**
   - `git diff main...HEAD --name-only`
   - Filter by `$ARGUMENTS` pattern if provided
   - Exclude: lock files, dist/, build/, coverage/, binaries

3. **Check file count**
   - No files → inform user and exit
   - Too many files (>20) → warn, suggest pattern

4. **Gather context** (parallel)
   - `git log main..HEAD --format="%h %s"`
   - `git diff main...HEAD --shortstat`
   - Read each changed file
   - Get diff for each file: `git diff main...HEAD -- <file>`

5. **Review each file**
   - **Architecture**: patterns, complexity, simpler alternatives
   - **Code quality**: readability, edge cases, naming, error handling
   - **Security/Perf**: input validation, resource mgmt, async handling
   - **Testing**: coverage, edge cases, realistic failure modes

6. **File beads issues for findings**
   - Bugs → `bd create "<description>" --type bug --priority <0-3>`
   - Security → `bd create "<description>" --type bug --priority 3`
   - Design issues → `bd create "<description>" --type task --priority <1-2>`
   - Priority: 3=critical, 2=important, 1=normal, 0=low

7. **Write review summary**
   - Path: `.jim/notes/review-{YYYY-MM-DD}-{branch}.md`
   - Include: files reviewed, commit summary, key findings, beads created
   - Wrap at 80 chars

8. **Report to user**
   - Number of files reviewed
   - Number of beads issues created
   - Summary of critical findings
   - Path to detailed review notes

## Review Criteria

**Flag as bugs:**
- Uncaught exceptions or error paths
- Race conditions, deadlocks
- Memory leaks, resource exhaustion
- Input validation gaps (XSS, injection, path traversal)
- Logic errors causing incorrect behavior

**Flag as tasks:**
- Overly complex code with simpler alternatives
- Missing tests for realistic failure modes
- Poor naming or structure hindering readability
- Performance bottlenecks (N+1, blocking I/O)

**Don't flag:**
- Style preferences (unless severe)
- Missing comments (code should be self-documenting)
- Hypothetical edge cases with no realistic trigger
- Minor optimizations with negligible impact
