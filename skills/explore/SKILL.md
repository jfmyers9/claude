---
name: explore
description: Deeply explore a prompt, gather context, and suggest multiple approaches
allowed-tools: [Bash, Read, Glob, Grep, Task, Write]
argument-hint: "<description of what to explore>"
---

# Explore Skill

You are in explore mode. Your goal is to take the user's initial prompt and thoroughly investigate it, gathering comprehensive context to build an expanded, detailed prompt that can guide future implementation work.

## Core Principles

1. **Be thorough**: Don't make assumptions. Follow code paths to completion.
2. **No premature conclusions**: Gather all relevant information before proposing approaches.
3. **Multiple perspectives**: Consider different ways to solve the problem.
4. **Context-rich output**: Provide enough detail that someone else could propose solutions without needing to re-explore.

## Process

### 1. Understand the Request

Start by analyzing the user's prompt in `$ARGUMENTS`:
- What is the core problem or feature being described?
- What are the explicit requirements?
- What are the implicit requirements or concerns?
- What context is needed to fully understand this request?

### 2. Explore the Codebase

Use available tools to investigate thoroughly:

**Find relevant files:**
- Use Glob to find files by pattern (e.g., `**/*auth*.ts`, `**/*test*`)
- Use Grep to search for keywords, function names, imports
- Look for: existing implementations, similar patterns, related functionality, tests

**Follow code paths:**
- Read identified files completely
- Trace imports and dependencies
- Identify interfaces, types, and contracts
- Find where functionality is called/used
- Check tests for usage patterns and edge cases

**Understand the architecture:**
- How is the codebase structured?
- What patterns are used? (e.g., MVC, service layer, repositories)
- What libraries/frameworks are involved?
- What are the existing conventions?

**Check documentation:**
- Look for README files, docs directories
- Find related GitHub issues or PRs (if mentioned)
- Check configuration files (package.json, tsconfig.json, etc.)

### 3. Identify Constraints and Context

Document:
- **Technical constraints**: Language version, framework limitations, dependencies
- **Existing patterns**: How similar problems are solved in this codebase
- **Related functionality**: What already exists that's relevant
- **Potential impact**: What will this change affect?
- **Testing approach**: How is similar code tested?

### 4. Analyze the Solution Space

Consider multiple dimensions:
- **Complexity**: Simple vs. comprehensive solutions
- **Performance**: Speed, memory, scalability implications
- **Maintainability**: How easy to understand, modify, extend
- **Risk**: What could break? What are the unknowns?
- **Reversibility**: How easy to undo or change later?

### 5. Generate Output

Create a comprehensive markdown document with:

```markdown
# Exploration: [Topic]

## Original Request
[User's original prompt]

## Context Gathered

### Relevant Files
[List key files with brief descriptions and line numbers for important sections]

### Current Implementation
[Describe how related functionality currently works]

### Architecture & Patterns
[Describe relevant architectural patterns, conventions, and structures]

### Dependencies & Constraints
[Technical limitations, library versions, compatibility concerns]

### Related Code Paths
[Key functions, classes, or modules that are relevant]

## Requirements Analysis

### Explicit Requirements
- [List what was explicitly requested]

### Implicit Requirements
- [List what's implied or necessary but not stated]

### Open Questions
- [List unknowns that might need clarification]

## Potential Approaches

### Approach 1: [Name/Description]

**Overview:** [Brief description]

**Pros:**
- [Advantage 1]
- [Advantage 2]

**Cons:**
- [Disadvantage 1]
- [Disadvantage 2]

**Implementation complexity:** [Low/Medium/High]

**Key files to modify:**
- [file:line - what to change]

**Risks:**
- [Risk 1]

### Approach 2: [Name/Description]

[Same structure as Approach 1]

### Approach 3: [Name/Description] (if applicable)

[Same structure as Approach 1]

## Recommendation

[Optional: If one approach is clearly better, explain why. Otherwise, explain the tradeoffs.]

## Next Steps

[Suggested next actions, such as:
- Clarify requirement X with user
- Prototype approach Y to test feasibility
- Review approach Z with team
- Proceed with implementation of approach N]

## Additional Notes

[Any other relevant observations, warnings, or context]
```

## Example Usage

User runs: `/explore add user authentication`

You would:
1. Search for existing auth code (`**/auth*`, `**/login*`, `**/session*`)
2. Read authentication-related files
3. Check how users/sessions are currently managed
4. Look at middleware, routes, and API endpoints
5. Identify auth libraries in use (passport, jwt, etc.)
6. Find related tests
7. Output a comprehensive document with 2-3 approaches like:
   - Approach 1: Extend existing auth system
   - Approach 2: Add separate OAuth provider
   - Approach 3: Use third-party auth service (Auth0, etc.)

## Important Notes

- **Don't implement**: This skill is for exploration only. Don't make code changes.
- **Be exhaustive**: Better to over-investigate than miss important context.
- **Follow conventions**: Use the codebase's existing patterns in your analysis.
- **Stay objective**: Present tradeoffs fairly, don't bias toward one approach unless clearly superior.
- **Ask if stuck**: If you can't find something or hit a dead end, note it in "Open Questions".

## Output Format

Always end with a complete markdown document (as described in section 5) that the user can reference when moving forward with implementation. This document should be self-contained and comprehensive enough that someone could propose a solution without needing to re-explore the codebase.

## Saving Documentation

After generating the exploration document, save it to the `.jim-plans/` directory for future reference:

**Filename format:** `.jim-plans/{topic-slug}-{timestamp}.md`
- Use a descriptive topic slug (lowercase, hyphenated)
- Include timestamp in YYYYMMDD-HHMMSS format
- Example: `.jim-plans/user-authentication-20260126-143022.md`

This allows you to:
- Keep a persistent record of explorations
- Reference findings later during implementation
- Track the evolution of architectural decisions

After saving, inform the user of the file location so they can reference it later.
