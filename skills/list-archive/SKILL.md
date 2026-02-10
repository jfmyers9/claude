---
name: list-archive
description: |
  List archived content in .jim/archive/.
  Triggers: 'list archive', 'show archive', 'what's archived'.
disable-model-invocation: true
allowed-tools: Bash, Read, Glob
argument-hint: "[optional: subdirectory (plans, states, notes, scratch)]"
---

# Instructions

1. Check `.jim/archive/` exists + has files.
   - Empty/missing → "No archived content." Stop.

2. Scope: if `$ARGUMENTS` matches plans|states|notes|scratch,
   filter to that subdirectory. Otherwise list all.

3. Find `.md` files sorted by mtime (newest first).

4. Per file, extract:
   - Relative path within archive
   - Modified date
   - Summary (first heading or `topic:` frontmatter)

5. Display grouped by subdirectory:

   ```
   ## Archived Content

   ### Plans (2 files)
   | File | Archived | Summary |
   |------|----------|---------|
   | old-feature-exploration.md | 2w ago | Auth feature exploration |
   | deprecated-api-plan.md | 1mo ago | API redesign |

   ### States (1 file)
   | File | Archived | Summary |
   |------|----------|---------|
   | old-project.md | 3d ago | Branch context |

   ### Notes
   No files.
   ```

6. Remind: read archived files via full path,
   `/archive` to add more.
