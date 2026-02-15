---
name: start
description: >
  Create a new Graphite branch and optionally link to an issue.
  Triggers: /start, "start new branch", "begin work on".
allowed-tools: Bash
argument-hint: "<branch-name> [issue-id]"
---

# Start New Branch Workflow

Creates a new Graphite branch with optional issue linking.

## Steps

0. **Verify work tracker**
   Run `work list 2>/dev/null` — if it fails, run `work init`
   first.

1. **Parse arguments**
   - Extract branch name from `$ARGUMENTS`
   - Extract optional issue ID
   - If no branch name → tell user: `/start <branch-name>
     [issue-id]`, stop

2. **Normalize branch name**
   - Prefix with `jm/` if not already prefixed

3. **Check working directory**
   - Run `git status --porcelain`
   - If uncommitted changes exist → warn user but continue

4. **Create Graphite branch**
   - Run `gt create <branch-name>`

5. **Link issue (if ID provided)**
   - `work start <id>`
   - `work comment <id> "Branch: <branch-name>"`

6. **Create issue (if no ID provided)**
   - Ask user: "Create issue for this branch?"
   - If yes:
     ```
     work create "<branch-name>" --priority 2 \
       --description "<what this branch work should accomplish>"
     ```
     - `work start <new-id>`

7. **Confirm completion**
   - Report branch created + issue linked/created
   - Suggest: `/explore` to plan work or `/implement` to start
     building
