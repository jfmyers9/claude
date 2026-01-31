---
name: next-phase
description: Continue to the next phase of a multi-phase implementation
allowed-tools: [Task]
argument-hint: "[slug or leave blank for latest active implementation]"
---

# Next Phase Skill

Continue to the next phase of a multi-phase implementation by reading the
active tracking file and executing the next set of tasks.

## Agent Prompt

Spawn a general-purpose agent via Task with this prompt:

```
Continue to the next phase of a multi-phase implementation.

## Find Active Tracking File

If argument provided:
- Look for `.jim/states/active-{argument}.md`
- If not found, report error and suggest running `/implement` first

If no argument:
- Find most recent `active-*.md` file in `.jim/states/`
- If none found, report error and suggest running `/implement` first

## Read Tracking File

Parse the active tracking file to determine:
- Source exploration document path
- Which phases are complete (marked with [x])
- Which phase is next (first uncompleted phase)
- Current branch name

## Verify State

1. Check current git branch matches tracking file branch
   - If different, warn user but continue
   - Note branch change in updated tracking file

2. Check if all phases are complete
   - If yes, report "All phases completed!" and exit
   - Suggest reviewing changes and using `/commit`

3. Identify next phase to execute
   - Find first phase marked `[ ]` (incomplete)
   - Extract phase name and number

## Load Source Exploration Document

Read the exploration document from the path in tracking file.

Find the "Next Steps" section and locate the next phase:
- Look for phase markers matching the phase number
- Patterns: `**Phase N: Name**` or `### Phase N: Name`
- Extract tasks for that phase

If phase not found in source document:
- Report error: phase structure may have changed
- Suggest using `/continue-explore` to update the plan
- Do not execute any tasks

## Execute Phase Tasks

Create TaskList from the next phase's tasks:
- For each task in the phase:
  - TaskCreate with clear subject, description, and activeForm
  - Steps should be concrete and verifiable

For each task in order:
1. TaskUpdate to in_progress
2. Execute the step (read files, write code, run commands as needed)
3. Verify the step succeeded (check syntax, run relevant tests if quick)
4. TaskUpdate to completed
5. If step fails: stop, report the error, leave task in_progress

## Update Active Tracking File

After executing phase (whether all tasks succeed or some fail):

1. Mark the completed phase with [x] and timestamp:
   ```markdown
   - [x] Phase N: Name (completed 2026-01-30T22:30:00Z)
   ```

2. Update "Current State" section:
   ```markdown
   Current Phase: N
   Status: completed
   Next Phase: N+1 (or "all complete" if last phase)
   ```

3. Add to "Implementation History" section:
   ```markdown
   ### Phase N (completed {ISO timestamp})

   {summary of what was done in this phase}

   Files changed:
   - {absolute/path/to/file1.ext} - {brief description}
   - {absolute/path/to/file2.ext} - {brief description}

   Tasks completed:
   1. {task subject} - {outcome}
   2. {task subject} - {outcome}

   Tasks failed/skipped: {list or "None"}

   Notes: {any additional context}
   ```

4. If all phases are now complete, update status to "completed"

## Write Implementation State File

Also write a separate implementation state file for this phase:

Extract the slug from active tracking filename:
- Example: `active-multi-phase-workflow.md` -> `multi-phase-workflow`

Generate current timestamp in `YYYYMMDD-HHMMSS` format
Create filename: `{timestamp}-implemented-phase{N}-{slug}.md`

Write to `.jim/states/{filename}` with standard implementation state format
(see /implement skill for format details).

## Guidelines

- **Follow the plan**: Execute the next phase as specified
- **Stay focused**: Only do what the phase specifies
- **Be thorough**: Complete each step fully before moving on
- **Don't commit**: Leave changes uncommitted for user review
- **Report clearly**: Summarize what phase was done and what files changed

## Return Value

Return:
- Which phase was completed (e.g., "Phase 2: Core Features")
- Summary of what was implemented
- List of files created/modified
- Any issues encountered
- Path to the active tracking file
- Path to the implementation state file
- If more phases remain: suggest using `/next-phase` to continue
- If all complete: note that implementation is finished
- Note that user should review changes and use /commit when ready
```

## Output

Display to user: phase summary, what was implemented, changed files,
next steps, and reminder to review changes before committing.
