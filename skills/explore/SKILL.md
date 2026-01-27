---
name: explore
description: Deeply explore prompts, gather context, and suggest approaches
allowed-tools: [Task]
argument-hint: "<description of what to explore>"
---

# Explore Skill

You are in explore mode. Your goal is to orchestrate a deep exploration
of the user's prompt by delegating the investigation work to a
specialized agent. This keeps the main context clean while producing
comprehensive, persistent documentation.

## Process

**Your job as the orchestrator:**

1. Take the user's exploration request from `$ARGUMENTS`
2. Spawn a general-purpose agent to do the actual exploration work
3. Wait for the agent to return a brief summary and file path
4. Report the results to the user

## Agent Instructions

When spawning the exploration agent via the Task tool, provide these
comprehensive instructions:

```
Thoroughly explore the following topic: [insert $ARGUMENTS here]

Your goal is to investigate the codebase, gather comprehensive context,
and produce a detailed exploration document that can guide future
implementation work.

## Exploration Process

### 1. Understand the Request
- What is the core problem or feature being described?
- What are the explicit and implicit requirements?
- What context is needed to fully understand this request?

### 2. Explore the Codebase

**Find relevant files:**
- Use Glob to find files by pattern (e.g., `**/*auth*.ts`, `**/*test*`)
- Use Grep to search for keywords, function names, imports
- Look for: existing implementations, similar patterns, related
  functionality, tests

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

### 3. Generate Comprehensive Documentation

Create a markdown document with this structure.

**IMPORTANT - Text Formatting:**
- Wrap prose text at 80 characters per line for terminal readability
- Do NOT wrap code blocks, headings, or lists
- Do NOT break URLs across lines
- Preserve markdown structure and formatting
- Use semantic line breaks at sentence boundaries when appropriate

The document should follow this template:

# Exploration: [Topic]

## Original Request
[User's original prompt]

## Context Gathered

### Relevant Files
[List key files with brief descriptions and line numbers for important
sections]

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
- [Advantages]

**Cons:**
- [Disadvantages]

**Implementation complexity:** [Low/Medium/High]

**Key files to modify:**
- [file:line - what to change]

**Risks:**
- [Potential issues]

### Approach 2: [Name/Description]
[Same structure]

### Approach 3: [Name/Description] (if applicable)
[Same structure]

## Recommendation

[If one approach is clearly better, explain why. Otherwise, explain the
tradeoffs.]

## Next Steps

[Suggested next actions, such as:
- Clarify requirement X with user
- Prototype approach Y to test feasibility
- Proceed with implementation of approach N]

## Additional Notes

[Any other relevant observations, warnings, or context]

### 4. Save the Document

Write the complete exploration document to `.jim-plans/` with this
filename format:

`.jim-plans/{topic-slug}-{timestamp}.md`

Where:
- `{topic-slug}` is a descriptive, lowercase, hyphenated slug of the topic
- `{timestamp}` is in YYYYMMDD-HHMMSS format

Example: `.jim-plans/user-authentication-20260126-143022.md`

### 5. Return Minimal Summary

IMPORTANT: Do NOT return the full exploration document. Instead, return
ONLY:

1. The file path where the document was saved
2. A 2-3 sentence executive summary of the key findings
3. Your recommended approach (if you have one)

This keeps the main context clean while providing the user with a
reference to the comprehensive documentation.

## Guidelines

- **Be thorough**: Don't make assumptions. Follow code paths to
  completion.
- **Be exhaustive**: Better to over-investigate than miss important
  context.
- **Stay objective**: Present tradeoffs fairly, don't bias toward one
  approach unless clearly superior.
- **Don't implement**: This is for exploration only. Don't make code
  changes.
- **Wrap text**: All prose in the exploration document should be wrapped
  at 80 characters for terminal readability. Preserve markdown structure
  (code blocks, lists, headings, URLs).
```

## Example Usage

When the user runs: `/explore add user authentication`

You should:
1. Spawn a general-purpose agent with the above instructions
2. Wait for it to complete the exploration and return the summary
3. Display to the user:
   - The file path (e.g.,
     `.jim-plans/user-authentication-20260126-143022.md`)
   - The brief summary from the agent
   - A note that they can reference the file for complete details

## Why This Approach

This architecture keeps the main conversation context clean by:
- Delegating heavy exploration to an isolated agent context
- Only bringing back essential findings (file path + summary)
- Persisting comprehensive details in a document that can be referenced
  when needed
- Allowing the user to discuss or implement findings without context
  pollution

If the user wants to discuss specific sections later, you can read just
those portions of the exploration document.
