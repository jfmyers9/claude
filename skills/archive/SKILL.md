---
name: archive
description: |
  Move old .jim files to .jim/archive/ preserving directory
  structure. Triggers: 'archive', 'archive old files',
  'move to archive'.
allowed-tools: Bash, Read, Glob
argument-hint: "<file-path or pattern>"
---

# Instructions

1. Parse `$ARGUMENTS`:
   - Specific path: `.jim/states/old-project.md`
   - Pattern: `states/2025*`, `plans/*exploration*`
   - No argument → list recent `.jim/` files, ask which to
     archive

2. Find matching files:
   - Verify paths exist, expand patterns within `.jim/`
   - Exclude anything already in `.jim/archive/`
   - Show matched files, request user confirmation

3. Build target paths preserving structure:
   - `.jim/states/old.md` → `.jim/archive/states/old.md`
   - `.jim/plans/feature.md` → `.jim/archive/plans/feature.md`
   - `.jim/notes/review.md` → `.jim/archive/notes/review.md`

4. Create dirs + move:
   - `mkdir -p .jim/archive/{plans,states,notes,scratch}`
   - `mv` each file, verify success

5. Report results. Remind:
   - Archived files ignored by default
   - `/list-archive` to view archived content
