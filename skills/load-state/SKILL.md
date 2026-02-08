---
name: load-state
description: Loads and presents a saved work state from .jim/states/ to help resume work.
allowed-tools: Bash, Read, Glob
argument-hint: [optional: label (defaults to "current")]
---

# Load State Skill

Loads previously saved work state from `.jim/states/` to resume work. Use at session start to get context on where you left off.

## Instructions

1. **Determine state label**: Use `$ARGUMENTS` if provided, otherwise "current"

2. **Check state file exists**: Look for `.jim/states/{label}.md`
   - If not found: suggest `/list-states` or `/save-state`
   - Exit if missing

3. **Read state + git context in parallel**:
   - Read `.jim/states/{label}.md`
   - `git branch --show-current`
   - `git status --porcelain`

4. **Compare context**: Note drift between current git state + saved state

5. **Present state to user**:
   - Display full state content
   - Highlight branch mismatch
   - Note new uncommitted changes not in state

6. **Suggest next actions**:
   - Based on "Next Steps" section
   - If branch differs: suggest checking out saved branch
   - If blockers listed: acknowledge them
   - If state is old: suggest `/save-state` update

## Example Output

```
## Resuming Work State: auth-feature

Saved 2 hours ago on branch: feature/user-auth

### Summary
Working on user authentication. Completed JWT generation, implementing token validation.

### Next Steps
- Add JWT validation middleware
- Write tests for auth flow
- Update API documentation

### Current Status
- Branch: feature/user-auth (matches saved)
- Uncommitted changes: 2 files (same as saved)

### Suggested Action
Continue: "Add JWT validation middleware"
```

## Notes

- Read-only, no file modifications
- State files in `.jim/states/` (git-ignored)
- Use `/list-states` to see available states
