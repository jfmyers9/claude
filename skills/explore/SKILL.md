---
name: explore
description: "Investigate, research, plan, understand codebase, explore ideas, figure out feature approach before implementing."
allowed-tools: Bash, Read, Task
argument-hint: "<description of what to explore>"
---

# Explore Skill

Delegate exploration to agent, keep main context clean.

## Context Injection

Before spawning agent:
1. Get current branch: `git branch --show-current`
2. Sanitize branch name (replace `/` with `-`) -> `{sanitized-branch}`
3. Check for `.jim/states/session-{sanitized-branch}.md`
4. If exists:
   - Read file, extract "Updated:" timestamp from header
   - If timestamp < 30 minutes: include as context (prepend below)
   - If >= 30 min or unparseable: skip
5. If doesn't exist: proceed without context (graceful fallback)

Include context as:
```
## Current Work Context

{contents of session-{sanitized-branch}.md}

---
```

## Agent Prompt

Spawn via Task:

```
Thoroughly explore: [insert $ARGUMENTS]

## Investigation (exhaustive)

1. **Gather context in parallel**:
   - Glob for relevant files by pattern
   - Grep for keywords/functions
   - Read READMEs, config files, docs

2. **Follow code paths**: Read files completely, trace imports, find usages

3. **Understand architecture**: Patterns, conventions, libraries

Don't assume — follow code paths to completion.

## Document Structure

Write to `.jim/plans/{YYYYMMDD-HHMMSS}-{topic-slug}.md`:

- **Original Request**: Prompt being explored
- **Context Gathered**: Relevant files (with line refs), current implementation, architecture, dependencies, related code paths
- **Requirements Analysis**: Explicit + implicit requirements, open questions
- **Potential Approaches**: 2-3 options with overview, pros, cons, complexity, key files to modify, risks
- **Recommendation**: Which approach + why (or tradeoffs)
- **Next Steps**: Concrete actions to proceed

Wrap prose at 80 chars. Preserve code blocks + URLs.
```

## Return Value

Return ONLY: file path + 2-3 sentence summary + recommendation. Don't return full document.

## Output

Display to user: file path + brief summary. Note they can read full exploration document for details.

## Triage

If topic spans 3+ subsystems or needs adversarial challenge, suggest `/team-explore` instead (spawns researcher, architect, devil's advocate in parallel).

## Notes

- **Automatic context injection**: Recent `/resume-work` (< 30 min) on current branch auto-includes session context
- **Branch-scoped**: Context tied to current branch. Switching branches = different/no context file
- **Graceful fallback**: No context exists or stale? Exploration proceeds without it
- Explore without context: skip `/resume-work` or wait 30+ minutes
