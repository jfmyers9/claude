---
name: ready
description: Scan active work and report next actionable steps
allowed-tools: Bash, Read, Glob
argument-hint: ""
---

# Ready Skill

Scan `.jim/states/active-*.md` files, parse status, report next
actionable work across all active implementations.

## Instructions

1. **Find active tracking files**:
   `Glob .jim/states/active-*.md`

2. **If none found**: Report no active work. Suggest:
   - `/explore` to start planning a new feature
   - `/implement` to execute an existing plan
   - `/load-state` to resume saved work
   - `/list-states` to see saved states
   Exit.

3. **Parse each file**: Read and extract from YAML frontmatter +
   markdown:
   - `topic` - from frontmatter or `# Active Implementation:` heading
   - `source` - from frontmatter or `Source:` line
   - `branch` - from frontmatter or `Branch:` line
   - `status` - from frontmatter or `Status:` line
   - `phase` - from frontmatter or `Current Phase:` line
   - `total_phases` - from frontmatter or count phases in list
   - Next phase name from `## Phases` checklist (first `[ ]` item)

4. **Check git state** (parallel with reads):
   `git branch --show-current`

5. **Display summary table**:

   ```
   ## Active Work

   ### {topic}
   - Source: {source path}
   - Branch: {branch} {" (current)" if matches git branch}
   - Status: {status}
   - Progress: Phase {phase}/{total_phases}
   - Next: Phase {N}: {name}

   (repeat for each active file)
   ```

6. **Suggest next action** per item:
   - If status = `in_progress` + phases remain:
     `/next-phase {slug}` to continue
   - If status = `completed`:
     All phases done. `/commit` to finalize.
   - If branch differs from current:
     `git checkout {branch}` first, then continue.

7. **If multiple active items**: List all, note which matches
   current branch (if any), suggest starting there.

## Output

Concise summary of all active work with clear next action per item.
No active work = suggest starting points.
