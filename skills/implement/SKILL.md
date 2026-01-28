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

If argument provided: read that file from `.jim-plans/`
Otherwise: find most recent `.jim-plans/*.md` file by timestamp in filename

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
- Note that user should review changes and use /commit when ready
```

## Output

Display to user: implementation summary, changed files, and reminder to
review changes before committing.
