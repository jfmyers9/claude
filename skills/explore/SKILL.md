---
name: explore
description: |
  Research topics, investigate codebases, and create implementation plans.
  Triggers: 'explore', 'investigate', 'research'.
allowed-tools: Bash, Read, Task
argument-hint: "<topic or question> | <beads-id> | --continue"
---

# Instructions

Orchestrate exploration via beads workflow and Task delegation.
All findings stored in beads design field — no filesystem plans.

## Arguments

- `<topic>` — new exploration on this topic
- `<beads-id>` — continue existing exploration issue
- `--continue` — resume most recent in_progress exploration

## Workflow

### New Exploration

1. `bd create "Explore: <topic>" --type task --priority 2`
2. `bd update <id> --status in_progress`
3. Spawn Explore agent (see below)
4. Store findings: `bd update <id> --design "<full-findings>"`
5. Report results

### Continue Exploration

1. Resolve issue ID:
   - If `$ARGUMENTS` matches a beads ID → use it
   - If `--continue` → `bd list --status=in_progress --type task`,
     find first with title starting "Explore:"
2. Load existing context: `bd show <id> --json` → extract design field
3. Spawn Explore agent with existing findings + new instructions
4. Update design: `bd update <id> --design "<updated-findings>"`
5. Report results

## Task Agent Instructions

Spawn Task (subagent_type=Explore, model=sonnet) with:

```
Research <topic> thoroughly. Return your COMPLETE findings as
text output (do NOT write files). Structure:

1. **Current State**: What exists now (files, patterns, architecture)
2. **Recommendation**: Suggested approach with rationale
3. **Next Steps**: Implementation phases using format:

**Phase 1: <Description>**
1. First step
2. Second step

**Phase 2: <Description>**
3. Third step
4. Fourth step

Aim for 3-7 phases. Each phase should be independently testable.
```

For continuations, prepend: "Previous findings:\n<existing-design>\n\n
Continue the exploration focusing on: <new-instructions>"

After agent returns, store full findings:
`bd update <id> --design "$(cat <<'EOF'\n<agent-output>\nEOF\n)"`

## Output Format

**Exploration Issue**: #<id>

**Key Findings**:
- Bullet points of critical discoveries

**Recommendation**: <one paragraph>

**Next**: `bd edit <id> --design` to review, `/prepare` to create tasks.

## Guidelines

- Set thoroughness based on scope: "quick" for targeted, "very thorough" for architecture
- Keep coordination messages concise
- Let the Task agent do the exploration work
- Summarize agent findings, don't copy verbatim
