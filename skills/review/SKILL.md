---
name: review
description: >
  Senior engineer code review, filing findings as beads issues.
  Triggers: 'review code', 'code review', 'review my changes'.
allowed-tools: Bash, Read, Glob, Grep, Task
argument-hint: "[file-pattern] | <beads-id> | --continue"
---

# Code Review

Orchestrate code review via beads workflow and Task delegation.
All findings stored in beads design field — no filesystem plans.

## Arguments

- `<file-pattern>` — new review, optionally filtering files
- `<beads-id>` — continue existing review issue
- `--continue` — resume most recent in_progress review

## Workflow

### New Review

1. **Get branch context**
   - `git branch --show-current` → exit if main/master
   - `git diff main...HEAD --name-only` → changed files
   - Filter by `$ARGUMENTS` pattern if provided
   - Exclude: lock files, dist/, build/, coverage/, binaries

2. **Create review bead**
   - `bd create "Review: {branch}" --type task --priority 2`
   - `bd update <id> --status in_progress`

3. **Determine review mode**
   - ≤15 changed files → **Solo Mode**: single Review subagent
   - >15 changed files → **Team Mode**: spawn parallel reviewers

4. **Solo Mode**: Spawn single Task subagent (see below)
5. **Team Mode**: Split files into groups of ~8, spawn one
   subagent per group, aggregate findings

6. **Store findings**
   - `bd update <id> --design "<phase-structured-findings>"`
   - Leave bead open (in_progress)

7. **Report results** (see Output Format)

### Continue Review

1. Resolve issue ID:
   - If `$ARGUMENTS` matches a beads ID → use it
   - If `--continue` → `bd list --status=in_progress --type task`,
     find first with title starting "Review:"
2. Load existing context: `bd show <id> --json` → extract design
3. Spawn Review subagent with existing findings + new instructions
4. Update design: `bd update <id> --design "<updated-findings>"`
5. Report results

## Review Subagent Prompt

Spawn Task (subagent_type=Explore, model=sonnet) with:

```
You are a senior engineer performing a code review.

## Branch
<branch-name>

## Commits
<git log main..HEAD --format="%h %s">

## Changed Files
<file list>

## Diffs
<git diff main...HEAD for each file>

Review each file for:
- **Architecture**: patterns, complexity, simpler alternatives
- **Code quality**: readability, edge cases, naming, error handling
- **Security/Perf**: input validation, resource mgmt, async handling
- **Testing**: coverage, edge cases, realistic failure modes

Return COMPLETE findings as text (do NOT write files). Structure
findings as phases for downstream task creation:

**Phase 1: Critical Issues**
<bugs, security issues, logic errors — numbered list>

**Phase 2: Design Improvements**
<architecture, complexity, naming — numbered list>

**Phase 3: Testing Gaps**
<missing tests, edge cases, failure modes — numbered list>

Only include phases that have findings. Skip empty phases.
For each finding include: file, line(s), what's wrong, suggested fix.

## Review Criteria

**Flag as critical (Phase 1):**
- Uncaught exceptions or error paths
- Race conditions, deadlocks
- Memory leaks, resource exhaustion
- Input validation gaps (XSS, injection, path traversal)
- Logic errors causing incorrect behavior

**Flag as improvements (Phase 2):**
- Overly complex code with simpler alternatives
- Poor naming or structure hindering readability
- Performance bottlenecks (N+1, blocking I/O)

**Flag as testing gaps (Phase 3):**
- Missing tests for realistic failure modes
- Untested edge cases with real-world impact

**Don't flag:**
- Style preferences (unless severe)
- Missing comments (code should be self-documenting)
- Hypothetical edge cases with no realistic trigger
- Minor optimizations with negligible impact
```

For team mode, each subagent gets a subset of files. After all
return, concatenate findings and deduplicate across phases.

For continuations, prepend: "Previous findings:\n<existing-design>
\n\nContinue reviewing, focusing on: <new-instructions>"

After agent(s) return, store full findings:
`bd update <id> --design "$(cat <<'EOF'\n<findings>\nEOF\n)"`

## Team Mode Details

When >15 files changed:

1. Split changed files into groups of ~8
2. Spawn parallel Task subagents (one per group), all in a
   single message for true parallel execution
3. Each subagent reviews its file group using the prompt above
4. Aggregate results:
   - Merge Phase 1 findings from all subagents
   - Merge Phase 2 findings from all subagents
   - Merge Phase 3 findings from all subagents
   - Deduplicate cross-file findings
5. Store consolidated findings in design field

## Output Format

**Review Issue**: #<id>

**Summary**: <files reviewed, commits covered>

**Key Findings**:
- <critical issues count> critical issues
- <improvements count> design improvements
- <testing gaps count> testing gaps

**Next**: `bd edit <id> --design` to review findings,
`/prepare <id>` to create tasks.

## Guidelines

- Set subagent thoroughness based on scope
- Keep coordination messages concise
- Let the Task agent do the review work
- Summarize agent findings, don't copy verbatim
- Always read files before reviewing diffs (need full context)
