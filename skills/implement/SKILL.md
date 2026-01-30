---
name: implement
description: Execute plans from exploration documents
allowed-tools: [Task]
argument-hint: "[exploration-doc.md or leave blank for latest]"
---

# Implement Skill

Execute the plan from an exploration document, tracking progress via tasks.

## Agent Prompt

Spawn a general-purpose agent via Task with this prompt:

```
Implement the plan from an exploration document.

## Find the Document

If argument provided: read that file from `.jim/plans/`
Otherwise: find most recent `.jim/plans/*.md` file by timestamp in filename

Verify the document has "Recommendation" and "Next Steps" sections.

## Create Task List

Parse the "Next Steps" section. For each actionable step:
- TaskCreate with clear subject, description, and activeForm
- Steps should be concrete and verifiable

## Execute Steps

For each task in order:
1. TaskUpdate to in_progress
2. Execute the step (read files, write code, run commands as needed)
3. Verify the step succeeded (check syntax, run relevant tests if quick)
4. TaskUpdate to completed
5. If step fails: stop, report the error, leave task in_progress

## Write State File

After executing steps (whether all succeed or some fail), write an implementation
state file to track what was done.

### Generate Filename

1. Extract the slug from the source exploration document filename:
   - Example: `20260129-015102-ship-command-bail-on-failure.md` -> `ship-command-bail-on-failure`
   - Remove the timestamp prefix and `.md` extension
2. Generate current timestamp in `YYYYMMDD-HHMMSS` format
3. Create filename: `{timestamp}-implemented-{slug}.md`

### Ensure Directory Exists

Run: `mkdir -p .jim-state`

### Write State File

Write to `.jim/states/{filename}` with this format:

```markdown
# Implementation: {topic from exploration doc title}

Implemented: {ISO timestamp}
Branch: {current git branch}

## Source

{absolute path to exploration document}

## What Was Planned

{brief summary of the recommendation from source document}

## What Was Implemented

{summary of what was actually done}

### Tasks Completed

1. {task subject} - {brief outcome}
2. {task subject} - {brief outcome}

### Tasks Failed/Skipped

{list any tasks that weren't completed, or "None"}

## Files Changed

- {absolute/path/to/file1.ext} - {brief description of change}
- {absolute/path/to/file2.ext} - {brief description of change}

## Notes

{any additional context, issues, or follow-up needed}
```

## Guidelines

- **Follow the plan**: Implement the recommended approach, not alternatives
- **Stay focused**: Only do what the plan specifies
- **Be thorough**: Complete each step fully before moving on
- **Don't commit**: Leave changes uncommitted for user review
- **Report clearly**: Summarize what was done and what files changed

## Return Value

Return:
- Summary of what was implemented
- List of files created/modified
- Any issues encountered
- Path to the implementation state file in `.jim/states/`
- Note that user should review changes and use /commit when ready
```

## Output

Display to user: implementation summary, changed files, and reminder to
review changes before committing.
