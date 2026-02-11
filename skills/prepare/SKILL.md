---
name: prepare
description: >
  Convert exploration plan into beads epic + child issues + swarm.
  Triggers: /prepare, "prepare work", "create tasks from plan".
allowed-tools: Bash, Read, Glob
argument-hint: "[beads-issue-id]"
---

# Prepare

Read plan from beads issue and create work structure.

## Steps

1. **Find plan source**
   - If `$ARGUMENTS` is a beads ID → `bd show <id> --json`, extract design field
   - Otherwise → `bd list --status=in_progress --type task`, find first "Explore:" issue
   - No plan found → exit, suggest `/explore` first

2. **Parse plan**
   - Read the design field content
   - Extract title from first heading
   - Find "Phases" or "Next Steps" section
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
