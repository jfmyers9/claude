---
name: prepare
description: >
  Convert exploration or review findings into beads epic + child
  issues + swarm.
  Triggers: /prepare, "prepare work", "create tasks from plan".
allowed-tools: Bash, Read, Glob
argument-hint: "[beads-issue-id]"
---

# Prepare

Read plan or review findings from beads issue and create work
structure.

## Steps

1. **Find plan source**
   - If `$ARGUMENTS` is a beads ID → `bd show <id> --json`, extract design field
   - Otherwise → `bd list --status=in_progress --type task`, find
     first issue with title starting "Explore:" or "Review:"
   - No plan found → exit, suggest `/explore` or `/review` first

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
   - Epic: `bd create "<plan-title>" --type epic --priority 1 --description "<desc>" --silent`
     - `<desc>` = one-paragraph plan summary, then `## Success Criteria`
       heading followed by 3-5 high-level outcomes extracted from the plan
     - Validate: `bd lint <epic-id>` — if it fails, `bd edit <epic-id> --description` to fix violations
   - For each phase:
     - `bd create "Phase N: <description>" --type task --parent <epic-id> --priority 2 --description "<desc>" --silent`
     - `<desc>` = `## Acceptance Criteria` heading followed by the
       task-list items for that phase (one checklist item per task)
     - Validate: `bd lint <phase-id>` — if it fails, `bd edit <phase-id> --description` to fix violations
   - Set dependencies between sequential phases:
     - `bd dep <phase-N> --blocks <phase-N+1>`
   - Skip dep for parallel phases

5. **Validate and create swarm**
   - `bd swarm validate <epic-id> --verbose`
   - If swarmable: `bd swarm create <epic-id>`
   - Report validation results
   - `bd update <epic-id> --status in_progress`
   - `bd close <source-bead-id> --reason "Converted to epic <epic-id>"`
     (close source AFTER swarm creation succeeds — failures leave source open for retry)

   **Optional: Extract reusable template**
   If this epic pattern is likely to repeat (e.g., feature-workflow,
   bugfix-workflow), extract a proto: `bd mol distill <epic-id> --as "<template-name>"`
   Future runs can then use `bd mol pour <proto-id>` instead of
   manual epic creation.

6. **Report**
   - Display epic ID and all child issue IDs
   - Closed source issue #<source-id>
   - Show dependency graph
   - Show parallel work fronts from validation
   - Suggest: `/implement <epic-id>` to start execution
