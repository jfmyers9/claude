---
name: explore
description: |
  Research topics, investigate codebases, and create implementation plans.
  Triggers: 'explore', 'investigate', 'research'.
allowed-tools: Bash, Read, Task
argument-hint: "<topic or question>"
---

# Instructions

You orchestrate exploration via beads workflow and Task delegation.

## Workflow

1. **Create beads issue**: `bd create "Explore: <topic>" --type task --priority 2`
2. **Claim it**: `bd update <id> --status in_progress`
3. **Delegate to Explore agent**: Spawn Task agent (subagent_type=Explore, model=sonnet) with:
   - Clear exploration objective
   - Instructions to gather context in parallel (Glob, Grep, Read)
   - Requirement to write findings to plan document in `.jim/plans/<topic>.md`
4. **Update beads issue**: After agent returns, update design field with summary: `bd update <id> --design "<summary>"`
5. **Close issue**: `bd update <id> --status done`

## Task Agent Instructions

When spawning the Explore agent, provide:

```
Research <topic> thoroughly. Your findings should include:

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

Save complete findings to `.jim/plans/<sanitized-topic>.md`.
```

## Output Format

After exploration completes:

**Exploration Issue**: #<id>
**Plan Document**: `.jim/plans/<topic>.md`

**Key Findings**:
- Bullet points of critical discoveries

**Recommendation**: <one paragraph>

**Next Steps**: See plan document for phased implementation.

## Guidelines

- Set thoroughness level based on scope: "quick" for targeted questions, "very thorough" for architecture
- Keep your coordination messages concise
- Let the Task agent do the exploration work
- Summarize agent findings, don't copy verbatim
