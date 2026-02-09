---
name: save-state
description: Saves current work state to .jim/states/ for resuming later. Captures branch, changes, and user-provided context.
allowed-tools: Bash, Read, Write, Glob
argument-hint: [optional: label (defaults to "current")]
---

# Save State Skill

Saves work state to `.jim/states/` for resuming later. Captures branch,
uncommitted changes, recent commits, modified files, + user context.

## Instructions

1. **Label**: Use `$ARGUMENTS` or default to "current". Sanitize: hyphens +
   lowercase, no special chars.

2. **Gather context** (parallel):
   - Branch: `git branch --show-current`
   - Changes: `git status --porcelain`
   - Commits: `git log main..HEAD --oneline -10`
   - Files: `git diff --name-only HEAD~5..HEAD 2>/dev/null`

3. **Prompt user**:
   - **Summary**: What working on? (1-2 sentences)
   - **Next steps**: What's next? (bullets)
   - **Blockers** (optional): Anything blocking?

4. **Create directory**: `mkdir -p .jim/states`

5. **Write file**: `.jim/states/{label}.md`
   ```markdown
   ---
   type: saved-state
   topic: "{user summary, brief}"
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

6. **Confirm**: Report saved to `.jim/states/{label}.md`. Remind: use
   `/load-state {label}` to resume.

## Tips

- Use descriptive labels per work stream: "auth-feature", "bug-fix-123"
- "current" label = primary work context
- Files git-ignored (not committed)
- Delete/overwrite old states manually

## Related

- `/list-states` - view all saved states
- `/load-state {label}` - resume from saved state
