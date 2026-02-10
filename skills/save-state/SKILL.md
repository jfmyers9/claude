---
name: save-state
description: |
  Save current work state to .jim/states/ for resuming later.
  Triggers: 'save state', 'save progress', 'bookmark work',
  'save where I am'.
allowed-tools: Bash, Read, Write, Glob
argument-hint: "[optional: label (defaults to \"current\")]"
---

# Instructions

1. Parse label from `$ARGUMENTS`, default "current".
   Sanitize: lowercase, hyphens only, no special chars.

2. Gather git context (parallel):
   - `git branch --show-current`
   - `git status --porcelain`
   - `git log main..HEAD --oneline -10`
   - `git diff --name-only HEAD~5..HEAD 2>/dev/null`

3. Ask user for:
   - **Summary** -- what are you working on? (1-2 sentences)
   - **Next steps** -- what's next? (bullets)
   - **Blockers** (optional) -- anything blocking?

4. `mkdir -p .jim/states`

5. Write `.jim/states/{label}.md`:

   ```markdown
   ---
   type: saved-state
   topic: "{brief summary}"
   branch: "{branch}"
   status: paused
   created: "{ISO timestamp}"
   ---

   # Work State: {label}

   Saved: {timestamp}
   Branch: {branch}

   ## Summary

   {user summary}

   ## Context

   ### Uncommitted Changes
   {git status output or "None"}

   ### Recent Commits
   {commits or "None (on main)"}

   ### Recently Modified Files
   {file list}

   ## Next Steps
   {user steps}

   ## Blockers
   {blockers or "None"}
   ```

6. Confirm saved path. Remind: `/load-state {label}` to resume.

## Related

- `/list-states` -- view all saved states
- `/load-state {label}` -- resume from saved state
