---
name: archive
description: Moves old .jim files to .jim/archive/ for long-term storage while preserving directory structure.
allowed-tools: Bash, Read, Glob
argument-hint: <file-path or pattern>
---

# Archive Skill

Moves files from `.jim/` subdirectories to `.jim/archive/` for long-term storage.
Archived files excluded from normal operations but accessible when explicitly requested.

## Instructions

1. **Parse arguments** ($ARGUMENTS):
   - Specific file path: `.jim/states/old-project.md`
   - Pattern: `states/2025*` or `plans/*exploration*`
   - No argument: list recent files + ask which to archive

2. **Find files**:
   - Verify paths exist, expand patterns in `.jim/`
   - Exclude files already in `.jim/archive/`
   - Show list + request confirmation

3. **Target paths** (preserve structure):
   - `.jim/states/old.md` -> `.jim/archive/states/old.md`
   - `.jim/plans/feature.md` -> `.jim/archive/plans/feature.md`
   - `.jim/notes/review.md` -> `.jim/archive/notes/review.md`

4. **Create archive dirs**: `mkdir -p .jim/archive/{plans,states,notes,scratch}`

5. **Move files**: `mv` each file, verify success, report results

6. **Confirm**: List archived files, remind user files are ignored by default,
   mention `/list-archive` for viewing

## Examples

```
/archive .jim/states/old-project.md
/archive states/2025*
/archive plans/
```

## Notes

- Moves (not copies) files
- Excluded from normal skill operations
- Access via `/list-archive` or explicit request
- Directory git-ignored
