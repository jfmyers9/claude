---
name: team-explore
description: Spawn a deep research team (researcher, architect, devil)
argument-hint: "<topic to explore>"
---

# Team Explore Skill

Spawn a team of three specialists to deeply explore a topic from
multiple angles, then synthesize findings into a comprehensive
exploration document.

## Instructions

### 1. Parse the Topic

Extract the exploration topic from `$ARGUMENTS`. If no arguments
provided, ask the user what they want to explore and exit.

### 2. Create the Team

Generate a timestamp in `HHMMSS` format (e.g., `162345`). Use TeamCreate
to create a team named `deep-explore-{HHMMSS}` (e.g.,
`deep-explore-162345`). This avoids name collisions when multiple
explorations run concurrently.

### 3. Create Tasks

Create three tasks with TaskCreate:

1. **Broad context gathering** - Assigned to the researcher.
   Find all relevant code, configuration, documentation, and
   dependencies related to the topic.

2. **Architecture analysis** - Assigned to the architect.
   Analyze the structural and design aspects of the topic area.

3. **Challenge assumptions** - Assigned to the devil.
   Challenge the obvious approaches and find hidden risks.

### 4. Spawn Teammates

Spawn three teammates using the Task tool:

- **explorer** (subagent_type: `researcher`): Give it the topic
  and ask it to cast a wide net. It should search for all
  relevant files using Glob and Grep, read documentation, trace
  code paths, check dependencies, and look for related
  implementations. Tell it to report back with a comprehensive
  list of relevant files, code patterns found, existing
  implementations, and any documentation discovered. Organize
  findings by relevance.

- **design-analyst** (subagent_type: `architect`): Give it the
  topic and ask it to analyze the architectural aspects. It
  should identify relevant design patterns, evaluate how the
  current architecture supports or hinders the topic, map
  system boundaries and interfaces, and assess coupling and
  cohesion in the affected areas. Tell it to report with
  architectural observations, pattern analysis, and structural
  recommendations.

- **challenger** (subagent_type: `devil`): Give it the topic and
  ask it to think about what could go wrong. It should identify
  assumptions people might make about the topic, find edge cases
  and failure modes, consider security and performance
  implications, and challenge the obvious approaches. Tell it
  to report with specific concerns, alternative perspectives,
  and risks that should be addressed.

Include in each teammate's prompt:
- The full exploration topic
- A reminder that other teammates are exploring from different
  angles (to avoid redundant work)
- Instructions to send findings back via SendMessage

### 5. Coordinate and Collect Results

Wait for all three teammates to report their findings. As results
come in, note connections between different teammates' discoveries.

### 6. Synthesize Exploration Document

After all findings are in, create a comprehensive exploration
document:

```markdown
# Exploration: [topic]

Explored: [ISO timestamp]
Team: researcher, architect, devil

## Original Request

[The exploration topic as provided]

## Context Gathered

[Synthesized from the researcher's findings]

### Relevant Files

- [path:line] - [description]

### Existing Implementations

[Any existing code or patterns related to the topic]

### Dependencies

[Relevant dependencies, configs, or external factors]

## Architecture Analysis

[Synthesized from the architect's findings]

### Current Structure

[How the current architecture relates to the topic]

### Design Patterns

[Patterns identified, with assessment of their fit]

### Structural Considerations

[Coupling, cohesion, boundaries relevant to the topic]

## Risks & Challenges

[Synthesized from the devil's findings]

### Assumptions to Validate

[Assumptions identified by the devil that need verification]

### Edge Cases

[Specific edge cases and failure modes to consider]

### Security & Performance

[Any security or performance concerns raised]

## Requirements Analysis

### Explicit Requirements

[What's clearly needed based on the topic]

### Implicit Requirements

[Hidden requirements discovered during exploration]

### Open Questions

[Questions that need answers before proceeding]

## Potential Approaches

[2-3 approaches synthesized from all three perspectives]

### Approach 1: [name]
- **Overview**: [description]
- **Pros**: [benefits, citing architectural analysis]
- **Cons**: [drawbacks, citing devil's concerns]
- **Complexity**: [low/medium/high]
- **Risks**: [specific risks identified]

### Approach 2: [name]
[Same structure]

## Recommendation

[Which approach and why, informed by all three perspectives]

## Next Steps

[Concrete actions to proceed, structured with phase markers
if the implementation is complex enough to warrant phases]
```

Save to `.jim/plans/{timestamp}-{topic-slug}.md`.

### 7. Shut Down Team

Send shutdown requests to all teammates and clean up the team.

### 8. Present Results

Display to the user:
- Brief summary (2-3 sentences covering all perspectives)
- The recommendation (1 sentence)
- Count of open questions or risks identified
- Path to the full exploration document
- Suggest next steps (e.g., `/implement` to execute the plan,
  or address open questions first)
