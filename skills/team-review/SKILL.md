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

Spawn 3 parallel specialists (reviewer, architect, devil) -> synthesize feedback into unified review.

## Process

### 1. Determine Review Scope

Determine what to review:
- `$ARGUMENTS` with files/pattern -> use that scope
- Otherwise, determine from git state:
  - Get current branch: `git branch --show-current`
  - Feature branch -> review vs main: `git diff main...HEAD --name-only`
  - Main + uncommitted -> `git diff --name-only` + `git diff --cached --name-only`
- No changes found -> inform user + exit

Collect changed files + summary diff for teammate prompts.

### 2. Create Team

Generate timestamp `HHMMSS` format (e.g., `162345`). TeamCreate: `code-review-{HHMMSS}`. Prevents collisions when reviews run concurrently.

Report: "Review team created. 3 reviewers analyzing {count} files..."

### 3. Create Tasks

TaskCreate 3 tasks:

1. **Code quality** - reviewer agent: readability, best practices, error handling, naming, style
2. **Architecture** - architect agent: design patterns, coupling, cohesion, abstraction, maintainability
3. **Adversarial** - devil agent: edge cases, failure modes, security, incorrect assumptions

### 4. Spawn Teammates

Task tool with `team_name` + `name`:

- **reviewer-agent** (subagent_type: `general-purpose`): Review code quality. Read files completely, check diff. Focus: readability, best practices, error handling, style. Report by file + severity (critical/important/suggestion).

- **architect-agent** (subagent_type: `general-purpose`): Review design. Read files, analyze structure. Focus: design patterns, coupling/cohesion, abstraction, maintainability. Report with tradeoff analysis.

- **devil-agent** (subagent_type: `general-purpose`): Stress-test changes. Read files, find edge cases, failure modes, security concerns, bad assumptions. Report as scenarios ("What happens when...").

Include in each prompt:
- Branch name + review scope
- Changed files (absolute paths)
- Reminder to read files completely, not just diff
- SendMessage instructions for results

### 5. Collect Results

Wait for 3 reviews. Report completions as they arrive:
"{agent} review complete ({done}/3)."

**Failure handling**: If a reviewer fails (error message, idle
without results after 2 prompts, reports cannot complete):
1. Send status check: "Status update? What progress so far?"
2. If no substantive response after second prompt, mark as failed
3. Continue with remaining reviewers (min 1 must succeed)
4. Note missing perspective in synthesis (e.g., "Architecture
   review unavailable due to agent failure")

After all: "All reviews in. Synthesizing unified feedback..."

### 6. Synthesize

Create unified review:

```markdown
# Team Code Review: [branch-name]

Reviewed: [ISO timestamp]
Branch: [branch-name]
Files: [count]
Reviewers: reviewer, architect, devil

## Summary
[2-3 sentences: combined assessment]

## Critical Issues
[Any critical/high-priority flags with sources]

## Architecture & Design
[Architect findings + related notes from others]

## Code Quality
[Reviewer findings + related notes from others]

## Edge Cases & Risks
[Devil findings + related notes from others]

## Recommendations

| Priority | Issue | Source | Action |
|----------|-------|--------|--------|
| High | ... | ... | ... |
| Medium | ... | ... | ... |
| Low | ... | ... | ... |

## Consensus & Disagreements
[Agreement + different perspectives]

## Failures
[Agent failures, or "None"]
```

Save to `.jim/notes/team-review-{timestamp}-{branch}.md` (branch name: `/` -> `-`).

### 7. Shut Down Team

Send shutdown requests to all teammates. After confirmed, call TeamDelete.

### 8. Present Results

Show user:
- 2-3 sentence summary
- Issue count by priority
- Review document path
- Next steps (address critical, then `/commit`)
