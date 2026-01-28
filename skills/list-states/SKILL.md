---
name: list-states
description: Lists all saved work states in .jim-state/ with names, dates, and summaries.
disable-model-invocation: true
allowed-tools: Bash, Read, Glob
---

# List States Skill

This skill lists all saved work states from `.jim-state/` to help you find a
state to load or see what contexts you've saved.

## Instructions

1. **Check if .jim-state/ exists**:
   - If directory doesn't exist or is empty, inform user:
     - "No saved states found. Use `/save-state` to save your first state."
   - Exit if no states

2. **List all state files**:
   - Find all `.md` files in `.jim-state/`: `ls -lt .jim-state/*.md 2>/dev/null`
   - Sort by modification time (most recent first)

3. **For each state file**:
   - Get filename (label)
   - Get modification date: `stat -c %y` or `ls -l`
   - Extract the first "Summary" line or the line after "## Summary"
   - Extract the branch name from the "Branch:" line

4. **Present list**:
   - Format as a table or list:

```
## Saved States

| Label      | Branch             | Modified         | Summary                    |
|------------|--------------------|--------------------|----------------------------|
| current    | feature/user-auth  | 2 hours ago        | Working on JWT validation  |
| bug-fix    | fix/login-error    | 1 day ago          | Fixing login redirect bug  |
| experiment | main               | 3 days ago         | Testing new API approach   |
```

5. **Suggest actions**:
   - Tell user to run `/load-state {label}` to resume a specific state
   - Mention `/save-state {label}` to create or update a state

## Tips

- States are sorted by modification time (most recent first)
- The "current" state is typically your main work context
- Old states can be deleted manually from `.jim-state/`

## Notes

- This skill only reads information; it does not modify any files
- State files are plain markdown stored in `.jim-state/`
- Use `/load-state {label}` to load a specific state
- Use `/save-state {label}` to create or update a state
