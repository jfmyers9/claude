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

0. **Verify work tracker**
   Run `work list 2>/dev/null` — if it fails, run `work init`
   first.

1. **Find plan source**
   - If `$ARGUMENTS` is an issue ID →
     `work show <id> --format=json`, extract description
   - Otherwise → `work list --status=active --label=explore`,
     then `--label=review`, then `--label=fix` — use first match
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
   - Create a parent issue first:
     ```
     work create "Plan: <plan-title>" --type chore --priority 2 \
       --labels <group-label>
     ```
     Capture the parent issue ID from the output.
   - For each phase, create as child of the parent:
     ```
     work create "Phase N: <description>" --type chore --priority 2 \
       --labels <group-label> --parent <parent-id> \
       --description "$(cat <<'EOF'
     ## Acceptance Criteria
     <task-list items for this phase as checklist>

     ## Context
     Part of: <plan-title>
     Parent: <parent-id>
     Depends on: Phase N-1 (if sequential)
     EOF
     )"
     ```
   - Add a comment to the SOURCE issue (not parent) with the
     parent ID and all created child IDs:
     ```
     work comment <source-id> "Parent: <parent-id>, phases: <id1>, <id2>, ..."
     ```

5. **Close source issue**
   - `work close <source-id>`
   - Only close AFTER all child issues are created successfully

6. **Report**
   - Display parent issue ID and all phase issue IDs
   - Closed source issue #<source-id>
   - Show phase order (sequential/parallel)
   - Suggest: `/implement --parent=<parent-id>` to start
     execution, or `work list --parent=<parent-id>` to review
