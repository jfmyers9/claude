---
name: team-review
description: Spawn a parallel code review team (reviewer, architect, devil)
argument-hint: "[optional: file pattern or branch]"
allowed-tools:
  - Task
  - Skill
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - SendMessage
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - TeamCreate
  - TeamDelete
---

# Team Review Skill

3 parallel specialists (reviewer, architect, devil) → unified review.

## Instructions

### 1. Determine Scope

- `$ARGUMENTS` with files/pattern → use that
- Feature branch → `git diff main...HEAD --name-only`
- Main + uncommitted → `git diff --name-only` + `--cached`
- No changes → inform + exit

Collect changed files + summary diff for prompts.

### 2. Create Team + Tasks

TeamCreate: `code-review-{HHMMSS}`. TaskCreate 3 tasks:
1. Code quality (reviewer)
2. Architecture (architect)
3. Adversarial (devil)

### 3. Spawn Teammates

All general-purpose, parallel:

- **reviewer-agent**: Code quality — readability, best practices,
  error handling, style. Report findings by file + severity
  (critical/important/suggestion).

- **architect-agent**: Design — patterns, coupling/cohesion,
  abstraction, maintainability. Report with tradeoff analysis.

- **devil-agent**: Stress-test — edge cases, failure modes,
  security, bad assumptions. Report as scenarios
  ("What happens when...").

Each prompt: branch, changed files (absolute paths), read files
completely (not just diff), SendMessage instructions.

**Failure handling**: Status check after 2 idle prompts. Failed →
note missing perspective. Continue with remaining (min 1). Report
completions as they arrive.

### 4. Synthesize

Save to `.jim/notes/team-review-{YYYYMMDD-HHMMSS}-{slug}.md`:

Summary (2-3 sentences), critical issues, architecture + design
findings, code quality findings, edge cases + risks,
recommendations table (priority, issue, source, action),
consensus + disagreements, failures.

### 5. Shutdown + Present

Shutdown all → TeamDelete. Show: 2-3 sentence summary, issue
count by priority, review doc path, next steps (address critical
→ `/commit`).
