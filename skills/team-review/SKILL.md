---
name: team-review
description: |
  Spawn parallel code review team (reviewer, architect, devil).
  Triggers: 'team review', 'team code review', 'multi-perspective
  review'.
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

# Team Review

Three parallel specialists (reviewer, architect, devil) →
unified code review.

## Instructions

### 1. Determine Scope

- `$ARGUMENTS` with files/pattern → use that
- Feature branch → `git diff main...HEAD --name-only`
- Main + uncommitted → `git diff --name-only` + `--cached`
- No changes found → inform user + exit

Collect changed files + summary diff for agent prompts.

### 2. Create Team + Tasks

TeamCreate: `code-review-{HHMMSS}`. TaskCreate 3 tasks:
1. Code quality review
2. Architecture review
3. Adversarial review

### 3. Spawn Teammates

All general-purpose, spawned in parallel. Each prompt includes:
branch, changed files (absolute paths), instruction to read
full files (not just diffs), SendMessage instructions.

- **reviewer-agent**: Code quality — readability, best
  practices, error handling, style. Report findings by file +
  severity (critical/important/suggestion).

- **architect-agent**: Design — patterns, coupling/cohesion,
  abstraction, maintainability. Report with tradeoff analysis.

- **devil-agent**: Stress-test — edge cases, failure modes,
  security, bad assumptions. Report as scenarios ("What happens
  when...").

### 4. Failure Handling

Status check after 2 idle prompts. Failed → note missing
perspective. Continue with remaining (min 1 must succeed).
Report completions as they arrive.

### 5. Synthesize

Save to `.jim/notes/team-review-{YYYYMMDD-HHMMSS}-{slug}.md`:

- Summary (2-3 sentences)
- Critical issues
- Architecture + design findings
- Code quality findings
- Edge cases + risks
- Recommendations table (priority, issue, source, action)
- Consensus + disagreements
- Failures (if any)

### 6. Shutdown + Present

Shutdown all → TeamDelete. Present:
- Summary (2-3 sentences)
- Issue count by priority
- Review doc path
- Next steps (address critical → `/commit`)
