---
name: list-states
description: Lists all saved work states in .jim/states/ with names, dates, and summaries.
disable-model-invocation: true
allowed-tools: Bash, Read, Glob
---

# List States

Lists saved work states from `.jim/states/` (names, dates, summaries).

## Steps

1. Check if `.jim/states/` exists + has files
   - If empty: "No saved states found. Use `/save-state` to save your first state."

2. List `.md` files: `ls -lt .jim/states/*.md 2>/dev/null`
   - Sorted by modification time (newest first)

3. For each file extract:
   - filename (label)
   - modification date: `stat -c %y` or `ls -l`
   - "## Summary" text
   - "Branch:" value

4. Display as table:
   ```
   | Label      | Branch             | Modified         | Summary                    |
   |------------|--------------------|--------------------|----------------------------|
   | current    | feature/user-auth  | 2 hours ago        | Working on JWT validation  |
   | bug-fix    | fix/login-error    | 1 day ago          | Fixing login redirect bug  |
   | experiment | main               | 3 days ago         | Testing new API approach   |
   ```

5. Suggest: `/load-state {label}` to resume, `/save-state {label}` to create/update

## Notes

- Read-only operation
- State files = plain markdown in `.jim/states/`
- Sorted by modification time (newest first)
- Old states can be deleted manually
