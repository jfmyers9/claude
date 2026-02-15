---
name: prepare
description: >
  Convert exploration or review findings into individual issues.
  Triggers: /prepare, "prepare work", "create tasks from plan".
allowed-tools: Bash, Read, Glob
argument-hint: "[issue-id]"
---

# Prepare

Read plan or review findings from an issue and create work
structure.

## Steps

1. **Find plan source**
   - If `$ARGUMENTS` is an issue ID →
     `work show <id> --format=json`, extract description
   - Otherwise → `work list --status=active`, find first issue
     with title starting "Explore:", "Review:", or "Fix:"
   - No plan found → exit, suggest `/explore` or `/review` first

2. **Parse plan**
   - Read the description content
   - Extract title from first heading
   - Find "Phases" or "Next Steps" section
   - Parse phases: `**Phase N: Description**` or `### Phase N:`
   - Extract tasks under each phase (numbered list items)

3. **Detect dependencies**
   - Default: sequential (phases are ordered)
   - Override if phase text contains parallel markers:
     - "parallel with Phase N"
     - "independent of"
     - "no dependency"
   - Note parallel phases in issue descriptions

4. **Create issues**
   - Generate a group label from the plan title (kebab-case,
     e.g., `login-timeout-fix`)
   - For each phase:
     ```
     work create "Phase N: <description>" --priority 2 \
       --labels <group-label> \
       --description "$(cat <<'EOF'
     ## Acceptance Criteria
     <task-list items for this phase as checklist>

     ## Context
     Part of: <plan-title>
     Depends on: Phase N-1 (if sequential)
     EOF
     )"
     ```
   - Add a comment to the source issue listing all created
     issue IDs:
     ```
     work comment <source-id> "Created issues: <id1>, <id2>, ..."
     ```

5. **Close source issue**
   - `work close <source-id>`
   - Only close AFTER all child issues are created successfully

6. **Report**
   - Display all created issue IDs
   - Closed source issue #<source-id>
   - Show phase order (sequential/parallel)
   - Suggest: `/implement` to start execution, or
     `work list --label=<group-label>` to review
