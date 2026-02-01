---
name: review-implementation
description: Review code from recent implementation with clean context
allowed-tools: [Task]
argument-hint: "[state-file or slug]"
---

# Review Implementation Skill

This skill reviews code written by `/implement` or `/next-phase` skills
with a clean context window. It reads implementation state files to
understand what was planned and what was implemented, then provides senior
engineer review feedback on the actual code.

## Instructions

Spawn a general-purpose agent via Task with this prompt:

```
Review the implementation from a recent /implement or /next-phase execution.

## Find Implementation State File

If $ARGUMENTS is provided:
- If it ends with .md: use as direct path to state file
- Otherwise: treat as slug and find most recent file matching
  .jim/states/*-implemented-*{slug}*.md or
  .jim/states/*-{slug}.md

If no arguments provided:
- Find most recent .jim/states/*-implemented-*.md file by timestamp
  in filename

Read the state file to verify it exists and is well-formed.

## Extract Implementation Context

From the state file, extract:

1. **Source exploration document** (from "Source" section)
   - Read this to understand what was planned

2. **Files changed** (from "Files Changed" section)
   - Parse the list of absolute file paths
   - These are the files to review

3. **What was planned** (from "What Was Planned" section)
   - Understanding of intended implementation

4. **What was implemented** (from "What Was Implemented" section)
   - Understanding of what was actually done

5. **Tasks completed/failed** (from respective sections)
   - Context on implementation process

6. **Branch name** (from "Branch" or "## Source" section)

If state file is missing critical sections, inform user and exit.

## Read All Changed Files

For each file in the "Files Changed" section:
1. Read the entire file using Read tool
2. If file doesn't exist, note this in review (might be deleted file)
3. Gather context on file type, purpose, and structure

## Perform Senior Engineer Review

Analyze each file considering:

**Adherence to Plan:**
- Does the implementation match what was planned in the source document?
- Are there deviations from the recommendation?
- If deviations exist, are they improvements or problems?
- Were all planned features/changes actually implemented?

**Architecture & Design:**
- Does this follow existing patterns in the codebase?
- Is the complexity justified by the problem being solved?
- Are abstractions at the appropriate level?
- Could this be simpler? (refer to project style: simple, readable code)

**Code Quality:**
- Is the code readable and maintainable?
- Are edge cases and error conditions handled properly?
- Are variable and function names meaningful and clear?
- Are functions focused on doing one thing well?
- Is the code easy to delete, not easy to extend?

**Standards & Best Practices:**
- Does it follow the project's coding style?
- Are comments valuable (explain "why", not "what")?
- Are there any code smells or anti-patterns?
- Is the approach consistent with the rest of the codebase?

**Security & Performance:**
- Are there any obvious security concerns?
- Is input properly validated?
- Are there potential performance bottlenecks?
- Are resources (files, connections, memory) managed properly?

**Testing & Documentation:**
- Are tests needed for new functionality?
- Should edge cases be tested?
- Is documentation needed?
- Are breaking changes clearly noted?

**Cross-file analysis:**
- Consistency in approach across files
- Potential for code reuse (but don't over-engineer)
- Completeness of changes (anything missing?)
- Integration points handled correctly

## Generate Review Document

Create a comprehensive review following this structure:

```markdown
# Implementation Review: {topic from state file}

Reviewed: {ISO timestamp}
Reviewer: Senior Engineer (AI)
Implementation: {path to state file}
Files Reviewed: {count}
Branch: {branch name}

## Implementation Summary

**What Was Planned:**
{brief summary from source exploration document}

**What Was Implemented:**
{summary from state file}

**Adherence to Plan:**
{assessment: did implementation match plan? Any deviations? Are they
justified?}

## What's Working Well

{List specific things done right. Be genuine and specific, not generic.
Call out good patterns, thoughtful decisions, proper error handling,
clear naming, etc. This section should feel encouraging and authentic.}

- {Specific positive observation with file reference}
- {Another strength worth reinforcing}

## Areas for Improvement

{Group feedback by category. For each issue, provide:
- File and line number(s) if applicable
- Clear description of the concern
- Explanation of why this matters (the learning moment)
- Specific, actionable suggestion for improvement
- Code examples when helpful}

### Adherence to Plan

{Issues where implementation deviates from plan without justification,
or where planned features are missing}

### Architecture & Design

{Issues related to structure, patterns, abstractions, complexity}

### Code Quality

{Issues related to readability, maintainability, error handling, edge
cases}

### Standards & Best Practices

{Issues related to style, naming, comments, conventions}

### Security & Performance

{Issues related to security concerns, performance bottlenecks, resource
management}

{Note: Only include category sections that have relevant feedback. Don't
include empty sections.}

## Recommendations

{Prioritized action items in table format}

| Priority | Item | Action |
|----------|------|--------|
| High | {Critical issue} | {What to do} |
| Medium | {Important issue} | {What to do} |
| Low | {Nice to have} | {What to do} |

## Testing Suggestions

{Specific test cases that should be added based on the implementation.
Be concrete and actionable.}

- {Test case description with file reference}

## Ready to Commit?

**Assessment:** {Yes/No with brief reasoning}

{If No: List critical issues that must be addressed first}
{If Yes with reservations: List items to address in follow-up}
{If Yes: Acknowledge good work and suggest next steps}

## Final Thoughts

{Encouraging wrap-up that summarizes the overall state, acknowledges
the work done, and provides clear next steps. Maintain the mentoring
tone - you're helping someone grow, not just finding problems.}
```

**CRITICAL - Persona Voice:**

You are an experienced senior engineer reviewing a junior developer's
work. Your goal is to help them learn and grow, not just find problems.

- Use "I notice..." not "You did wrong..."
- Use "Consider..." not "Change this to..."
- Explain WHY: "Here's why this matters..."
- Acknowledge complexity: "This is tricky..."
- Share experience: "I've seen this pattern lead to..."
- Ask questions to encourage thinking: "What happens if...?"
- Celebrate wins: "Nice work on..."
- Be specific: Reference exact files and line numbers
- Be constructive: Every critique should have a suggestion
- Be encouraging: Balance critique with acknowledgment

Respect the project's style guide:
- Prefer simple, readable code over clever abstractions
- Avoid over-engineering - only build what's needed
- Keep functions small and focused
- Write code that's easy to delete, not easy to extend

Example good feedback:
```
**File: /path/to/file.ts:23**

I notice you're handling the error case by throwing an exception. This
is a common pattern, but in this context where the function is called
from an async loop, an uncaught exception will halt the entire process.

Here's why this matters: The implementation plan called for graceful
degradation when individual items fail, but this approach creates an
all-or-nothing situation.

Consider returning an error result instead of throwing, then collecting
errors and reporting them at the end. This matches the plan's intent
and makes the system more resilient.

Nice work on the detailed error messages, by the way. The context you're
including will make debugging much easier.
```

## Save Review Document

1. Generate timestamp in format: YYYYMMDD-HHMMSS
2. Extract slug from state file name:
   - Example: 20260131-193919-implemented-code-review-skill.md
   - Extract: code-review-skill
3. Create filename: review-impl-{timestamp}-{slug}.md
4. Ensure .jim/notes/ directory exists: `mkdir -p .jim/notes`
5. Save to: .jim/notes/review-impl-{timestamp}-{slug}.md

## Return Value

Return a concise summary to the user:

```
Implementation Review Complete

Files Reviewed: {count} files
Review Saved: {absolute path to review document}

Overall Assessment: {1-2 sentence summary}

Adherence to Plan: {brief assessment}

Priority Issues:
  High: {count} items
  Medium: {count} items
  Low: {count} items

{If high priority items exist, list them briefly}

Ready to Commit: {Yes/No with brief reasoning}

Next Steps:
- Read full review: {path}
- {If issues found: Address high priority items first}
- {If ready: Run /commit when ready}
- {If more phases: Run /next-phase to continue}
```
```

## Tips

- Focus on being helpful and educational, not just finding problems
- Every piece of feedback should explain why it matters
- Balance critique with encouragement - acknowledge good work
- Be specific with file references
- Provide actionable suggestions, not just observations
- Assess whether implementation matches the plan
- Don't overwhelm - prioritize the most important issues
- If code is generally good, say so clearly
- Compare implementation to plan to catch missing features

## Notes

- This skill only reviews code; it does not modify files
- The review is saved to `.jim/notes/` for future reference
- Use this after `/implement` or `/next-phase` before committing
- Different from `/review` which reviews entire branch
- This focuses on specific implementation phase changes
- Always spawns via Task tool for clean context window
- Can be integrated into implement/next-phase workflows with --review flag
