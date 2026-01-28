---
name: explore
description: Deeply explore prompts, gather context, and suggest approaches
allowed-tools: [Task]
argument-hint: "<description of what to explore>"
---

# Explore Skill

Delegate deep exploration to an agent, keeping the main context clean.

## Agent Prompt

Spawn a general-purpose agent via Task with this prompt (substitute
`$ARGUMENTS`):

```
Thoroughly explore: [insert $ARGUMENTS]

## Investigation (be exhaustive)

1. **Find relevant files**: Use Glob for patterns, Grep for keywords/functions
2. **Follow code paths**: Read files completely, trace imports, find usages
3. **Understand architecture**: Patterns, conventions, libraries, config
4. **Check docs**: READMEs, comments, related issues/PRs

Don't make assumptions — follow code paths to completion.

## Document Structure

Write to `.jim-plans/{YYYYMMDD-HHMMSS}-{topic-slug}.md`:

- **Original Request**: The prompt being explored
- **Context Gathered**: Relevant files (with line refs), current
  implementation, architecture, dependencies, related code paths
- **Requirements Analysis**: Explicit requirements, implicit requirements,
  open questions needing clarification
- **Potential Approaches**: 2-3 options, each with overview, pros, cons,
  complexity, key files to modify, risks
- **Recommendation**: Which approach and why (or tradeoffs if unclear)
- **Next Steps**: Concrete actions to proceed

Wrap prose at 80 chars. Preserve code blocks and URLs.

## Return Value

Return ONLY: file path + 2-3 sentence summary + recommendation.
Do not return the full document.
```

## Output

Display to user: file path, brief summary, and note they can read the
full exploration document for details.
