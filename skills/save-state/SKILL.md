---
name: save-state
description: Saves current work state to .jim/states/ for resuming later. Captures branch, changes, and user-provided context.
allowed-tools: Bash, Read, Write, Glob
argument-hint: [optional: label (defaults to "current")]
---

# Save State Skill

This skill saves your current work state to a file in `.jim/states/` so you can
resume later. Use this at the end of a work session or before switching context.

## Instructions

1. **Determine state label**:
   - If `$ARGUMENTS` is provided, use it as the label
   - Otherwise, use "current" as the default label
   - Sanitize the label: replace spaces with hyphens, lowercase, remove special
     characters

2. **Gather automatic context**:
   - Get current branch: `git branch --show-current`
   - Get uncommitted changes: `git status --porcelain`
   - Get recent commits on branch: `git log main..HEAD --oneline -10` (or fewer
     if not many)
   - Get recently modified files: `git diff --name-only HEAD~5..HEAD 2>/dev/null`
     (ignore errors if not enough commits)

3. **Prompt user for context**:
   - Ask the user to provide:
     - **Summary**: What were you working on? (1-2 sentences)
     - **Next steps**: What should be done next? (bullet points)
     - **Blockers** (optional): Anything blocking progress?
   - Wait for user response before proceeding

4. **Ensure .jim/states/ directory exists**:
   - Create if needed: `mkdir -p .jim-state`

5. **Write state file**:
   - Path: `.jim/states/{label}.md`
   - Format:

```markdown
# Work State: {label}

Saved: {timestamp}
Branch: {branch}

## Summary

{user-provided summary}

## Context

### Uncommitted Changes

{git status output or "None"}

### Recent Commits

{commit list or "None (working on main)"}

### Recently Modified Files

{file list}

## Next Steps

{user-provided next steps}

## Blockers

{user-provided blockers or "None"}
```

6. **Confirm save**:
   - Tell user the state was saved to `.jim/states/{label}.md`
   - Remind them to use `/load-state {label}` to resume

## Tips

- Use descriptive labels for different work streams (e.g., "auth-feature",
  "bug-fix-123")
- The "current" label is meant for your primary work context
- State files are git-ignored, so they won't be committed
- Old state files can be deleted manually or overwritten

## Notes

- This skill creates files in `.jim/states/` which is git-ignored
- State files are markdown and can be read/edited manually
- Use `/list-states` to see all saved states
- Use `/load-state` to resume from a saved state
