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

## Parse Arguments

Parse $ARGUMENTS for:
- `--review` flag: if present, run code review after implementation
- File/slug: exploration document path or slug (remaining arguments)

Store the review flag state for later use.

## Find the Document

If argument provided (excluding flags): read that file from `.jim/plans/`
Otherwise: find most recent `.jim/plans/*.md` file by timestamp in filename

Verify the document has "Recommendation" and "Next Steps" sections.

## Detect Phases

Parse the "Next Steps" section for phase markers:
- Look for patterns like `**Phase N: Name**` or `### Phase N: Name`
- If phase markers found, extract phases with their tasks
- If no phase markers, treat all tasks as a single phase
- Store phase information for tracking file

## Create Task List

If phases detected:
- Create tasks only from Phase 1
- Store remaining phases for future execution

If no phases (single-phase plan):
- Create tasks from all steps in "Next Steps" section

For each task:
- TaskCreate with clear subject, description, and activeForm
- Steps should be concrete and verifiable

## Execute Steps

For each task in order:
1. TaskUpdate to in_progress
2. Execute the step (read files, write code, run commands as needed)
3. Verify the step succeeded (check syntax, run relevant tests if quick)
4. TaskUpdate to completed
5. If step fails: stop, report the error, leave task in_progress

## Write State Files

After executing steps (whether all succeed or some fail), write state files
to track what was done.

### Ensure Directory Exists

Run: `mkdir -p .jim/states`

### 1. Write Active Tracking File (if multi-phase)

If phases were detected, create/update active tracking file at
`.jim/states/active-{slug}.md`:

```markdown
# Active Implementation: {topic from exploration doc title}

Source: {absolute path to exploration document}
Started: {ISO timestamp}
Branch: {current git branch}
Status: in_progress

## Phases

- [x] Phase 1: {name} (completed {ISO timestamp})
- [ ] Phase 2: {name}
- [ ] Phase 3: {name}

## Current State

Current Phase: 1
Status: completed
Next Phase: 2

## Implementation History

### Phase 1 (completed {ISO timestamp})

{summary of what was done in Phase 1}

Files changed:
- {absolute/path/to/file1.ext} - {brief description}
- {absolute/path/to/file2.ext} - {brief description}

Tasks completed:
1. {task subject} - {outcome}
2. {task subject} - {outcome}

Tasks failed/skipped: {list or "None"}

Notes: {any additional context}
```

### 2. Write Implementation State File

Extract the slug from the source exploration document filename:
- Example: `20260129-015102-ship-command-bail-on-failure.md` -> `ship-command-bail-on-failure`
- Remove the timestamp prefix and `.md` extension

Generate current timestamp in `YYYYMMDD-HHMMSS` format
Create filename: `{timestamp}-implemented-{slug}.md`

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

## Optional Post-Implementation Review

If --review flag was present in arguments:

1. Collect the path to the implementation state file created above
2. Spawn a review agent via Task with this prompt:

```
Review the implementation that was just completed.

Read the implementation state file at:
{absolute path to implementation state file}

Run the review-implementation skill on this state file:
/review-implementation {path to state file}

Return a concise summary of the review findings, including:
- Overall code quality assessment
- High priority issues (if any)
- Whether the code is ready to commit
```

3. Wait for review to complete
4. Include review summary in return value
5. Note the path to the review document in return value

## Guidelines

- **Follow the plan**: Implement the recommended approach, not alternatives
- **Stay focused**: Only do what the plan specifies
- **Be thorough**: Complete each step fully before moving on
- **Don't commit**: Leave changes uncommitted for user review
- **Report clearly**: Summarize what was done and what files changed

## Return Value

Return:
- Summary of what was implemented
- Which phase was completed (if multi-phase)
- List of files created/modified
- Any issues encountered
- Path to the implementation state file in `.jim/states/`
- If multi-phase: path to active tracking file and suggestion to use `/next-phase`
- If single-phase: note that implementation is complete
- If --review flag was used:
  - Review summary with key findings
  - Path to review document
  - Ready to commit verdict
- If --review flag was NOT used:
  - Reminder: "To review implementation: /review-implementation" (include state file path)
- Note that user should review changes and use /commit when ready
```

## Output

Display to user: implementation summary, changed files, and reminder to
review changes before committing.
