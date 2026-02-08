---
name: list-archive
description: Lists all archived content in .jim/archive/ with dates and summaries.
disable-model-invocation: true
allowed-tools: Bash, Read, Glob
argument-hint: [optional: subdirectory (plans, states, notes, scratch)]
---

# List Archive

Lists archived content from `.jim/archive/` (plans, states, notes, scratch).

## Instructions

1. Check if `.jim/archive/` exists + has files -> exit if empty/missing
2. Scope: `$ARGUMENTS` = subdirectory (plans|states|notes|scratch) to filter, else list all
3. Find + sort `.md` files by mtime (recent first): `find .jim/archive -type f -name "*.md"`
4. Per file: relative path, mtime, summary (1st heading), original location
5. Present grouped by subdirectory + count:

```
## Archived Content

### Plans (2 files)
| File | Archived | Summary |
| old-feature-exploration.md | 2w | Exploration of auth feature |
| deprecated-api-plan.md | 1mo | API redesign |

### States (3 files)
| File | Archived | Summary |
| old-project.md | 3d | Work state |
| experiment-1.md | 1w | Branch context |
| bug-fix-123.md | 2w | Bug fix context |

### Notes
No files.

### Scratch (1 file)
| File | Archived | Summary |
| temp-analysis.md | 5d | Analysis notes |
```

6. Actions: read directly w/ full path | move back manually | use `/archive` to add more

## Notes

- Read-only (no modifications)
- Files preserve directory structure + can be restored
- Use `/list-archive states` to filter by category
- Read archived files via explicit path
