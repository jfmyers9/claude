---
name: explore
description: |
  Research topics, investigate codebases, and create implementation
  plans. Triggers: 'explore', 'investigate', 'research'.
allowed-tools: Bash, Read, Task
argument-hint: "<topic or question> | <issue-id> | --continue | --team"
---

# Explore

Orchestrate exploration via work CLI and and Task delegation.
All findings stored in issue description — no filesystem plans.

## Arguments

- `<topic>` — new exploration on this topic
- `<issue-id>` — continue existing exploration issue
- `--continue` — resume most recent active exploration
- `--team` — force team mode for parallel multi-topic exploration

## Workflow

### 0. Verify Work Tracker

Run `work list 2>/dev/null` — if it fails, run `work init`
first.

### New Exploration

1. Create issue:
   ```
   work create "Explore: <topic>" --type chore --priority 2 \
     --labels explore \
     --description "Exploration in progress..."
   ```
2. `work start <id>`
3. Classify topics — parse $ARGUMENTS to determine mode:
   - Numbered list items (`1.` / `2.` / `-` / `*`) → extract
     each as a topic
   - Comma-separated phrases with "and" → split on commas
   - Multiple sentences ending in `?` → each is a topic
   - `--team` flag present → force team mode

   If 2+ topics detected OR `--team` flag → **Team Mode** (step 4b)
   Otherwise → **Solo Mode** (step 4a)

4. Spawn exploration agent(s) using the subagent prompt template.

   **a) Solo Mode** — spawn a single Task (subagent_type=Explore,
   model=opus). Use 3-7 phases in the prompt.

   **b) Team Mode** — spawn N parallel Task subagents in a **SINGLE
   message** (subagent_type=Explore, model=opus), one per topic.
   Cap at 5 agents; group excess topics together. Each prompt adds:
   - "This is part of a multi-topic exploration."
   - A `## Your Topic` section with the specific topic
   - An `## Overall Context` section with the original user request
   - Use 2-4 phases per topic instead of 3-7

5. Store findings:
   `work edit <id> --description "<full-findings>"`
   For Team Mode, run aggregation first (see Team Mode Aggregation).

6. Report results (see Output Format)

### Continue Exploration

1. Resolve issue ID:
   - If `$ARGUMENTS` matches an issue ID → use it
   - If `--continue` → `work list --status=active --label=explore`,
     find first with title starting "Explore:"
2. Load existing context:
   `work show <id> --format=json` → extract description
3. Spawn Explore agent with previous findings prepended:
   "Previous findings:\n<existing-description>\n\nContinue the
   exploration focusing on: <new-instructions>"
4. Update description:
   `work edit <id> --description "<updated-findings>"`
5. Report results

## Subagent Prompt Template

All exploration agents (solo and team) use this structure:

```
Research <topic> thoroughly. Return your COMPLETE findings as
text output (do NOT write files).

Set depth based on scope: skim for targeted lookups, dig deep
for architecture and cross-cutting concerns.

Structure:

1. **Current State**: What exists now (files, patterns,
   architecture)
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
  headers (see step 4b)

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

**Next**: `work show <id>` to review, `/prepare` to create
tasks.

## Lifecycle

Issue stays active until consumed. `/prepare` closes it when
tasks are created. If exploration is abandoned, use
`work cancel <id>`.
