---
name: list-archive
description: Lists all archived content in .jim/archive/ with dates and summaries.
disable-model-invocation: true
allowed-tools: Bash, Read, Glob
argument-hint: [optional: subdirectory (plans, states, notes, scratch)]
---

# List Archive Skill

This skill lists archived content from `.jim/archive/` to help you find and
review old files that have been archived.

## Instructions

1. **Check if .jim/archive/ exists**:
   - If directory doesn't exist or is empty, inform user:
     - "No archived content found. Use `/archive` to archive old files."
   - Exit if no archived files

2. **Determine scope**:
   - If `$ARGUMENTS` specifies a subdirectory (plans, states, notes, scratch):
     - Only list files from `.jim/archive/{subdirectory}/`
   - Otherwise, list all archived files across all subdirectories

3. **List archived files**:
   - Find all files in `.jim/archive/`: `find .jim/archive -type f -name "*.md"`
   - Sort by modification time (most recent first)

4. **For each archived file**:
   - Get relative path within archive
   - Get modification date
   - Extract brief summary (first heading or summary line)
   - Note original location (based on subdirectory)

5. **Present list by category**:
   - Group files by subdirectory (plans, states, notes, scratch)
   - Format as organized list:

```markdown
## Archived Content

### Plans (2 files)
| File | Archived | Summary |
|------|----------|---------|
| old-feature-exploration.md | 2 weeks ago | Exploration of auth feature |
| deprecated-api-plan.md | 1 month ago | API redesign planning |

### States (3 files)
| File | Archived | Summary |
|------|----------|---------|
| old-project.md | 3 days ago | Work state for old project |
| experiment-1.md | 1 week ago | Experimental branch context |
| bug-fix-123.md | 2 weeks ago | Bug fix work context |

### Notes (0 files)
No archived notes.

### Scratch (1 file)
| File | Archived | Summary |
|------|----------|---------|
| temp-analysis.md | 5 days ago | Temporary analysis notes |
```

6. **Suggest actions**:
   - To view a specific file: "Read the file directly with its full path"
   - To restore: "Move the file back from archive manually"
   - To archive more: "Use `/archive` to archive additional files"

## Tips

- Archived files preserve their original directory structure
- Files can be manually moved back to their original location
- Use subdirectory filter to narrow results (e.g., `/list-archive states`)

## Notes

- This skill only reads information; it does not modify any files
- Archived files are plain markdown stored in `.jim/archive/`
- Archive content is excluded from normal skill operations
- Use explicit paths to read archived files when needed
