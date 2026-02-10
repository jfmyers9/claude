---
name: list-states
description: |
  List all saved work states in .jim/states/.
  Triggers: 'list states', 'show states', 'what states do I have'.
disable-model-invocation: true
allowed-tools: Bash, Read, Glob
---

# Instructions

1. Check `.jim/states/` exists + has `.md` files.
   - Empty/missing → "No saved states. Use `/save-state` to
     save your first state."

2. List `.md` files sorted by mtime (newest first):
   `ls -lt .jim/states/*.md 2>/dev/null`

3. Per file, extract:
   - Label (filename without .md)
   - Branch (from `branch:` frontmatter or `Branch:` line)
   - Modified date (`stat -c %y`)
   - Summary (from `topic:` frontmatter or `## Summary` text)

4. Display as table:

   ```
   | Label   | Branch            | Modified    | Summary              |
   |---------|-------------------|-------------|----------------------|
   | current | feature/user-auth | 2 hours ago | JWT validation work  |
   | bug-fix | fix/login-error   | 1 day ago   | Login redirect bug   |
   ```

5. Suggest: `/load-state {label}` to resume,
   `/save-state {label}` to create/update.
