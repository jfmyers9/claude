---
name: prepare
description: >
  Convert exploration plan into beads epic + child issues + swarm.
  Triggers: /prepare, "prepare work", "create tasks from plan".
allowed-tools: Bash, Read, Glob
argument-hint: "[plan-file-path]"
---

# Prepare

Read an exploration document and create beads work structure.

## Steps

1. **Find plan document**
   - If `$ARGUMENTS` has a path → use it
   - Otherwise → most recent `.jim/plans/*.md`
   - No plan found → exit, suggest `/explore` first

2. **Parse plan**
   - Read the document fully
   - Extract title from `# Exploration:` or first heading
   - Find "Next Steps" section
   - Parse phases: `**Phase N: Description**` or `### Phase N:`
   - Extract tasks under each phase (numbered list items)

3. **Detect dependencies**
   - Default: sequential (each phase blocks the next)
   - Override if phase text contains parallel markers:
     - "parallel with Phase N"
     - "independent of"
     - "no dependency"
   - Phases with no detected dependency on prior phase → parallel

4. **Create beads structure**
   - Epic: `bd create "<plan-title>" --type epic --priority 1 --silent`
   - For each phase:
     - `bd create "Phase N: <description>" --type task --parent <epic-id> --priority 2 --description "<task-list>" --silent`
   - Set dependencies between sequential phases:
     - `bd dep <phase-N> --blocks <phase-N+1>`
   - Skip dep for parallel phases

5. **Validate and create swarm**
   - `bd swarm validate <epic-id> --verbose`
   - If swarmable: `bd swarm create <epic-id>`
   - Report validation results

6. **Report**
   - Display epic ID and all child issue IDs
   - Show dependency graph
   - Show parallel work fronts from validation
   - Suggest: `/implement <epic-id>` to start execution
