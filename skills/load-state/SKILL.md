---
name: load-state
description: Loads and presents a saved work state from .jim/states/ to help resume work.
allowed-tools: Bash, Read, Glob
argument-hint: [optional: label (defaults to "current")]
---

# Load State Skill

This skill loads a previously saved work state from `.jim/states/` and presents
it to help you resume work. Use this at the start of a session to get context
on where you left off.

## Instructions

1. **Determine state label**:
   - If `$ARGUMENTS` is provided, use it as the label
   - Otherwise, use "current" as the default label

2. **Check if state file exists**:
   - Look for `.jim/states/{label}.md`
   - If not found, inform user and suggest:
     - Run `/list-states` to see available states
     - Run `/save-state` to create a new state
   - Exit if file not found

3. **Read state and gather git context in parallel** (these are
   independent and should run simultaneously):
   - Read the full contents of `.jim/states/{label}.md`
   - Get current branch: `git branch --show-current`
   - Get current uncommitted changes: `git status --porcelain`

4. **Compare context**:
   - Compare current git context with state file to note any drift

5. **Present state to user**:
   - Display the full state file content
   - If current branch differs from saved branch, highlight this
   - If there are new uncommitted changes not in the state, note them

6. **Suggest next actions**:
   - Based on the "Next Steps" section, suggest what to do
   - If branch differs, suggest checking out the saved branch
   - If there are blockers listed, acknowledge them
   - If the state is old (check timestamp), suggest updating it

## Example Output

```
## Resuming Work State: auth-feature

Saved 2 hours ago on branch: feature/user-auth

### Summary
Working on user authentication. Completed JWT generation, now implementing
token validation.

### Next Steps
- Add JWT validation middleware
- Write tests for auth flow
- Update API documentation

### Current Status
- Branch: feature/user-auth (matches saved state)
- Uncommitted changes: 2 files modified (same as saved)

### Suggested Action
Continue with: "Add JWT validation middleware"
```

## Tips

- Use this skill at the start of a work session
- If the state seems outdated, use `/save-state` to update it
- State files are plain markdown - you can read them directly if needed

## Notes

- This skill only reads information; it does not modify any files
- State files are stored in `.jim/states/` which is git-ignored
- Use `/list-states` to see all available saved states
