---
name: load-state
description: |
  Load saved work state from .jim/states/ to resume work.
  Triggers: 'load state', 'resume state', 'where was I',
  'load my progress'.
allowed-tools: Bash, Read, Glob
argument-hint: "[optional: label (defaults to \"current\")]"
---

# Instructions

1. Parse label from `$ARGUMENTS`, default "current".

2. Check `.jim/states/{label}.md` exists.
   - Not found → suggest `/list-states` or `/save-state`. Stop.

3. Read state file + gather git context (parallel):
   - Read `.jim/states/{label}.md`
   - `git branch --show-current`
   - `git status --porcelain`

4. Compare saved vs current git state. Note drift:
   - Branch mismatch
   - New uncommitted changes not in saved state
   - Time elapsed since save

5. Present state content to user:
   - Full summary, next steps, blockers from saved file
   - Highlight branch mismatch if any
   - Note new uncommitted changes

6. Suggest next actions:
   - Branch differs → `git checkout {saved-branch}`
   - Blockers listed → acknowledge them
   - State is old → suggest `/save-state` to refresh
   - Otherwise → continue from first uncompleted next step

Read-only. No file modifications.
