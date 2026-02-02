---
name: archive
description: Moves old .jim files to .jim/archive/ for long-term storage while preserving directory structure.
allowed-tools: Bash, Read, Glob
argument-hint: <file-path or pattern>
---

# Archive Skill

This skill moves files from `.jim/` subdirectories to `.jim/archive/` for
long-term storage. Archived files are excluded from normal skill operations
but remain accessible when explicitly requested.

## Instructions

1. **Parse arguments**:
   - `$ARGUMENTS` should contain either:
     - A specific file path (e.g., `.jim/states/old-project.md`)
     - A pattern to match (e.g., `states/2025*` or `plans/*exploration*`)
   - If no argument provided, list recent files and ask user which to archive

2. **Find files to archive**:
   - If specific path: verify file exists
   - If pattern: expand pattern within `.jim/` directory
   - Exclude anything already in `.jim/archive/`
   - Show list of files that will be archived and ask for confirmation

3. **Determine target paths**:
   - Preserve subdirectory structure in archive
   - Example mappings:
     - `.jim/states/old.md` -> `.jim/archive/states/old.md`
     - `.jim/plans/feature.md` -> `.jim/archive/plans/feature.md`
     - `.jim/notes/review.md` -> `.jim/archive/notes/review.md`

4. **Ensure archive directories exist**:
   - Create subdirectories as needed: `mkdir -p .jim/archive/{plans,states,notes,scratch}`

5. **Move files**:
   - Use `mv` to move files to archive location
   - Verify move succeeded
   - Report each file moved

6. **Confirm completion**:
   - List all files that were archived
   - Remind user that archived files are ignored by default
   - Mention `/list-archive` to view archived content

## Examples

Archive a specific state file:
```
/archive .jim/states/old-project.md
```

Archive all 2025 state files:
```
/archive states/2025*
```

Archive exploration documents older than a month (manual selection):
```
/archive plans/
```

## Tips

- Use patterns to archive multiple related files at once
- Archived files can be manually moved back if needed
- The archive preserves the original directory structure
- Use `/list-archive` to see what's been archived

## Notes

- This skill moves (not copies) files to archive
- Archived files are excluded from normal skill operations
- To access archived content, use `/list-archive` or ask explicitly
- Archive directory is also git-ignored
