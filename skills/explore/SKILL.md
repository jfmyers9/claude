---
name: explore
description: |
  Research topics, investigate codebases, and create implementation plans.
  Triggers: 'explore', 'investigate', 'research'.
allowed-tools: Bash, Read, Task
argument-hint: "<topic or question> | <beads-id> | --continue | --team"
---

# Explore

Orchestrate exploration via beads workflow and Task delegation.
All findings stored in beads design field — no filesystem plans.

## Arguments

- `<topic>` — new exploration on this topic
- `<beads-id>` — continue existing exploration issue
- `--continue` — resume most recent in_progress exploration
- `--team` — force team mode for parallel multi-topic exploration

## Workflow

### New Exploration

1. Create bead with description:
   ```
   bd create "Explore: <topic>" --type task --priority 2 \
     --description "$(cat <<'EOF'
   ## Acceptance Criteria
   - Findings stored in bead design field (not filesystem)
   - Structured as Current State, Recommendation, and phased Next Steps
   - Each phase is independently actionable
   EOF
   )"
   ```
2. Validate: `bd lint <id>` — if it fails, `bd edit <id> --description` to fix violations
3. `bd update <id> --status in_progress`
4. Classify topics — parse $ARGUMENTS to determine mode:
   - Numbered list items (`1.` / `2.` / `-` / `*`) → extract each as a topic
   - Comma-separated phrases with "and" → split on commas
   - Multiple sentences ending in `?` → each is a topic
   - `--team` flag present → force team mode

   If 2+ topics detected OR `--team` flag → **Team Mode** (step 5b)
   Otherwise → **Solo Mode** (step 5a)

5. Spawn exploration agent(s) using the subagent prompt template below.

   **a) Solo Mode** — spawn a single Task (subagent_type=Explore,
   model=opus). Use 3-7 phases in the prompt.

   **b) Team Mode** — spawn N parallel Task subagents in a **SINGLE
   message** (subagent_type=Explore, model=opus), one per topic.
   Cap at 5 agents; group excess topics together. Each prompt adds:
   - "This is part of a multi-topic exploration."
   - A `## Your Topic` section with the specific topic
   - An `## Overall Context` section with the original user request
   - Use 2-4 phases per topic instead of 3-7

6. Store findings: `bd update <id> --design "<full-findings>"`
   For Team Mode, run aggregation first (see Team Mode Aggregation).

7. Report results (see Output Format)

### Continue Exploration

1. Resolve issue ID:
   - If `$ARGUMENTS` matches a beads ID → use it
   - If `--continue` → `bd list --status=in_progress --type task`,
     find first with title starting "Explore:"
2. Load existing context: `bd show <id> --json` → extract design field
3. Spawn Explore agent with previous findings prepended:
   "Previous findings:\n<existing-design>\n\nContinue the
   exploration focusing on: <new-instructions>"
4. Update design: `bd update <id> --design "<updated-findings>"`
5. Report results

## Subagent Prompt Template

All exploration agents (solo and team) use this structure:

```
Research <topic> thoroughly. Return your COMPLETE findings as
text output (do NOT write files).

Set depth based on scope: skim for targeted lookups, dig deep
for architecture and cross-cutting concerns.

Structure:

1. **Current State**: What exists now (files, patterns, architecture)
2. **Recommendation**: Suggested approach with rationale
3. **Next Steps**: Implementation phases using format:

**Phase 1: <Description>**
1. First step
2. Second step

**Phase 2: <Description>**
3. Third step
4. Fourth step

Aim for <N> phases. Each phase should be independently testable.
```

- **Solo**: `<N>` = 3-7 phases
- **Team**: `<N>` = 2-4 phases per topic; prepend topic/context
  headers (see step 5b)

## Team Mode Aggregation

After ALL subagents return, combine their output before storing:

1. Prefix each topic's findings with **Topic N: <name>**
2. Detect cross-topic connections (shared files, dependencies,
   conflicts)
3. Renumber phases globally across all topics (Phase 1-N
   sequential) so /prepare can parse them
4. If cross-topic connections found, add a **Cross-Topic
   Connections** section at the top

## Output Format

**Exploration Issue**: #<id>

**Key Findings**:
- Bullet points of critical discoveries

**Recommendation**: <one paragraph>

**Next**: `bd edit <id> --design` to review, `/prepare` to create tasks.
