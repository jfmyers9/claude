---
name: continue-explore
description: Continue an existing exploration with user feedback
allowed-tools: Task
argument-hint: "[file-path] <feedback> or just <feedback> for most recent"
---

# Continue Explore Skill

Continue exploration document with user feedback for iterative refinement.

## Parsing Arguments

Parse `$ARGUMENTS` for file path + feedback:

1. **Most recent + feedback**: Argument doesn't match `.jim/plans/` file -> treat as feedback, use most recent doc
2. **File + feedback**: First word matches file (partial OK) -> use that file + remaining text as feedback
3. **No arguments**: Use most recent doc, prompt for feedback

## Finding Document

**File path provided**:
- Search `.jim/plans/` (partial match OK)
- Multiple matches -> list + ask user to specify
- No matches -> suggest `/explore`

**No file path**:
- Find most recent `.jim/plans/*.md` by timestamp
- None exist -> suggest `/explore`

## Agent Prompt

Spawn agent via Task (substitute `$EXISTING_DOC` + `$FEEDBACK`):

```
Continue this exploration based on user feedback.

## Existing Exploration Document

[insert full content of $EXISTING_DOC]

## User Feedback

[insert $FEEDBACK]

## Instructions

1. **Understand feedback**: More detail on approach? Answer to open question? Different direction? Clarification needed?

2. **Update document** in place, preserving structure: Original Request, Context Gathered, Requirements Analysis, Potential Approaches, Recommendation, Next Steps

3. **Add/update Revision History**: Add section if missing, log date + changes

4. **Preserve valuable content**: Keep analysis + context, add to document (don't replace)

## Investigation (if needed)

Gather context if needed: Glob for patterns, Grep for keywords, trace code, add to "Context Gathered"

## Return Value

Return: file path, 2-3 sentence summary of changes, note open questions
```

## Handling Empty Feedback

No feedback in args: Read doc, display summary, ask user what to refine, wait for response before spawning agent

## Output

Display: file path, summary of changes, note can run `/continue-explore` again

## Examples

```
# Most recent + feedback
/continue-explore expand on Approach B, it looks promising

# Specific file + feedback
/continue-explore statefile-skills what about using JSON instead of YAML?

# Most recent, prompt for feedback
/continue-explore
```
