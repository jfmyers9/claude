---
name: debug
description: >
  Systematically diagnose and fix bugs, CI failures, and test
  failures. Triggers: /debug, debugging issues, test failures,
  CI errors
allowed-tools: Bash, Read, Glob, Grep, Edit
argument-hint: "[issue-id|error-description]"
---

# Debug Skill

Systematically diagnose and fix bugs, CI failures, and test
failures. Integrates with issues for tracking.

## Argument Parsing

Parse `$ARGUMENTS`:
- Issue ID (6-char hex or prefix) → debug that specific issue
- Error message or description → debug that problem
- No args → check for failing tests/CI on current branch

## Workflow

### 1. Issue Setup

**If issue ID provided:**
```bash
work show <id>
work start <id>
```

**If no issue:**
```bash
work create "Debug: <problem>" --priority 1 --labels bug \
  --description "## Steps to Reproduce
- <observed symptoms and error output>

## Acceptance Criteria
- Bug is fixed and verified by passing tests"
```

### 2. Gather Diagnostics (Parallel)

Run these in parallel:
```bash
git branch --show-current
git log --oneline -5
git diff --stat
gh pr checks  # or gh run list --limit 3
```

If test failure mentioned, run failing tests to reproduce.

### 3. Investigate Systematically

1. Read error output carefully
2. Trace to root cause (don't guess)
3. Read relevant source files
4. Check recent changes that may have introduced the bug
5. Use Grep/Glob to find related code

### 4. Fix the Issue

1. Make minimal, targeted changes
2. Re-run failing tests/checks to verify fix
3. If fix works: `work close <id>`
4. If fix doesn't work:
   `work comment <id> "Findings: ..."`

### 5. Report

Output format:
```
## Problem
- [what was wrong]

## Root Cause
- [traced cause]

## Fix Applied
- [minimal changes made]

## Verification
- [test results / CI status]
```

## Style Rules

- Keep concise — bullet points, not prose
- No emoji
- Steps numbered and actionable
- Prefer reading error output over guessing
- Make minimal fixes — don't refactor surrounding code
- Use parallel tool calls when gathering independent data
