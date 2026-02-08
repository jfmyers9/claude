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

Spawn a team of three specialists to review code in parallel, then
synthesize their feedback into a unified review.

## Instructions

### 1. Determine Review Scope

Figure out what to review:

- If `$ARGUMENTS` specifies files or a pattern, use that as the scope
- Otherwise, determine scope from git state:
  - Get current branch: `git branch --show-current`
  - If on a feature branch: review changes vs main
    (`git diff main...HEAD --name-only`)
  - If on main with uncommitted changes: review uncommitted changes
    (`git diff --name-only` and `git diff --cached --name-only`)
- If no changes found, inform the user and exit

Collect the list of changed files and a summary diff to include in
teammate prompts.

### 2. Create the Team

Generate a timestamp in `HHMMSS` format (e.g., `162345`). Use TeamCreate
to create a team named `code-review-{HHMMSS}` (e.g., `code-review-162345`).
This avoids name collisions when multiple reviews run concurrently.

### 3. Create Tasks

Create three tasks with TaskCreate:

1. **Code quality review** - Assigned to the reviewer agent.
   Review for readability, best practices, error handling, naming,
   and code style.

2. **Architecture review** - Assigned to the architect agent.
   Review for design patterns, coupling, cohesion, abstraction
   levels, and maintainability.

3. **Adversarial review** - Assigned to the devil agent.
   Review for edge cases, failure modes, security concerns,
   incorrect assumptions, and missing error handling.

### 4. Spawn Teammates

Spawn three teammates using the Task tool with `team_name` and
`name` parameters:

- **reviewer-agent** (subagent_type: `reviewer`): Give it the list
  of changed files and ask it to review for code quality. Tell it
  to read each file completely, check the diff, and focus on
  readability, best practices, error handling, and style. Ask it
  to report findings organized by file with severity levels
  (critical, important, suggestion).

- **architect-agent** (subagent_type: `architect`): Give it the
  list of changed files and ask it to review architecture and
  design. Tell it to read each file, analyze the overall structure,
  and focus on design patterns, coupling/cohesion, abstraction
  levels, and maintainability. Ask it to report findings with
  clear tradeoff analysis.

- **devil-agent** (subagent_type: `devil`): Give it the list of
  changed files and ask it to stress-test the changes. Tell it to
  read each file, look for edge cases, failure modes, security
  concerns, and incorrect assumptions. Ask it to report findings
  as specific scenarios ("What happens when...").

Include in each teammate's prompt:
- The branch name and review scope
- The list of changed files (absolute paths)
- A reminder to read files completely, not just the diff
- Instructions to send their findings back via SendMessage

### 5. Coordinate and Collect Results

Wait for all three teammates to complete their reviews. As results
come in, acknowledge receipt.

### 6. Synthesize and Present

After all three reviews are in, synthesize into a unified review:

```markdown
# Team Code Review: [branch-name]

Reviewed: [ISO timestamp]
Branch: [branch-name]
Files: [count] files reviewed
Reviewers: reviewer, architect, devil

## Summary

[2-3 sentences: overall assessment combining all perspectives]

## Critical Issues

[Issues flagged by any reviewer as critical/high-priority.
Include which reviewer flagged it.]

## Architecture & Design

[Findings from the architect, supplemented by related findings
from other reviewers]

## Code Quality

[Findings from the reviewer, supplemented by related findings
from other reviewers]

## Edge Cases & Risks

[Findings from the devil, supplemented by related findings
from other reviewers]

## Recommendations

| Priority | Issue | Source | Action |
|----------|-------|--------|--------|
| High | ... | architect | ... |
| Medium | ... | reviewer | ... |
| Low | ... | devil | ... |

## Consensus & Disagreements

[Note where reviewers agree and any areas where they have
different perspectives. This is valuable signal.]
```

Save the review to `.jim/notes/team-review-{timestamp}-{branch}.md`
(sanitize branch name, replacing `/` with `-`).

### 7. Shut Down Team

Send shutdown requests to all teammates and clean up the team.

### 8. Present Results

Display to the user:
- Brief summary (2-3 sentences)
- Count of issues by priority
- Path to the full review document
- Suggest next steps (e.g., address critical issues, then `/commit`)
