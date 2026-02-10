---
name: ready
description: |
  Scan active work and report next actionable steps.
  Triggers: 'ready', 'what should I work on', 'next task',
  'what's active'.
allowed-tools: Bash, Read, Glob
argument-hint: ""
---

# Instructions

1. Glob `.jim/states/active-*.md`

2. None found → report no active work. Suggest:
   - `/explore` to plan a new feature
   - `/implement` to execute an existing plan
   - `/load-state` to resume saved work
   Stop.

3. Read each file + `git branch --show-current` (parallel).
   Extract from YAML frontmatter + markdown:
   - `topic`, `source`, `branch`, `status`
   - `phase`, `total_phases`
   - Next phase name (first `[ ]` in `## Phases` checklist)

4. Display per active item:

   ```
   ## Active Work

   ### {topic}
   - Source: {source path}
   - Branch: {branch} {" (current)" if matches}
   - Progress: Phase {phase}/{total_phases}
   - Next: Phase {N}: {name}
   ```

5. Suggest next action per item:
   - `in_progress` + phases remain →
     `/next-phase {slug}` to continue
   - `completed` → all done, `/commit` to finalize
   - Branch differs → `git checkout {branch}` first

6. Multiple items → note which matches current branch,
   suggest starting there.
