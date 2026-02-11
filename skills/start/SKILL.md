---
name: start
description: >
  Create a new Graphite branch and optionally link to a beads issue.
  Triggers: /start, "start new branch", "begin work on".
allowed-tools: Bash
argument-hint: "<branch-name> [beads-issue-id]"
---

# Start New Branch Workflow

Creates a new Graphite branch with optional beads issue linking.

## Steps

1. **Parse arguments**
   - Extract branch name from `$ARGUMENTS`
   - Extract optional beads issue ID
   - If no branch name → tell user: `/start <branch-name> [issue-id]`, stop

2. **Normalize branch name**
   - Prefix with `jm/` if not already prefixed

3. **Check working directory**
   - Run `git status --porcelain`
   - If uncommitted changes exist → warn user but continue

4. **Create Graphite branch**
   - Run `gt create <branch-name>`

5. **Link beads issue (if ID provided)**
   - `bd update <id> --status in_progress`
   - `bd update <id> --notes "Branch: <branch-name>"`

6. **Create beads issue (if no ID provided)**
   - Ask user: "Create beads issue for this branch?"
   - If yes:
     - `bd create "<branch-name>" --type task --priority 2 --description "## Acceptance Criteria
- <what this branch work should accomplish>"`
     - Validate: `bd lint <new-id>` — if it fails, `bd edit <new-id> --description` to fix violations
     - `bd update <new-id> --status in_progress`

7. **Confirm completion**
   - Report branch created + issue linked/created
   - Suggest: `/explore` to plan work or `/implement` to start building
