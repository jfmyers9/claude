---
name: explore
description: "Use when the user wants to investigate, research, plan, understand a codebase, explore an idea, or figure out how to approach a feature before implementing it."
allowed-tools: Bash, Read, Task
argument-hint: "<description of what to explore>"
---

# Explore Skill

Delegate deep exploration to an agent, keeping the main context clean.

## Context Injection

Before spawning the agent, check for session context:

1. Get current branch: `git branch --show-current`
2. Sanitize branch name (replace `/` with `-`) to get `{sanitized-branch}`
3. Look for `.jim/states/session-{sanitized-branch}.md`
4. If file exists:
   - Read the file and extract the "Updated:" timestamp from the header
   - Parse the timestamp and check if it's less than **30 minutes** old
   - If fresh (< 30 min), include the file contents as context (see below)
   - If stale (>= 30 min) or timestamp unparseable, skip context injection
5. If file doesn't exist, proceed without context (graceful fallback)

When including context, prepend to the agent prompt:

```
## Current Work Context

{contents of session-{sanitized-branch}.md}

---

```

This ensures the exploration agent understands the current work state when
`/resume-work` was recently run on this branch.

## Agent Prompt

Spawn a general-purpose agent via Task with this prompt (substitute
`$ARGUMENTS`):

```
Thoroughly explore: [insert $ARGUMENTS]

## Investigation (be exhaustive)

1. **Gather initial context in parallel**:
   - Use Glob to find relevant files by pattern
   - Use Grep to search for keywords/functions
   - Read READMEs, config files, and documentation

2. **Follow code paths**: Read files completely, trace imports,
   find usages

3. **Understand architecture**: Patterns, conventions, libraries

Don't make assumptions — follow code paths to completion.

## Document Structure

Write to `.jim/plans/{YYYYMMDD-HHMMSS}-{topic-slug}.md`:

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

## Notes

- **Automatic context injection**: If `/resume-work` was run recently (within
  30 minutes) on the current branch, that session context is automatically
  included in the exploration prompt
- **Branch-scoped**: Context is tied to the current branch. Switching branches
  means a different (or no) context file
- **Graceful fallback**: If no session context exists or it's stale, the
  exploration proceeds without it
- To explore without context, either skip `/resume-work` or wait 30+ minutes
