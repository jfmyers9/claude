---
name: continue-explore
description: Continue an existing exploration with user feedback
allowed-tools: [Task]
argument-hint: "[file-path] <feedback> or just <feedback> for most recent"
---

# Continue Explore Skill

Continue an existing exploration document with user feedback, enabling
iterative refinement rather than starting fresh each time.

## Parsing Arguments

Parse `$ARGUMENTS` to determine file path and feedback:

1. **Most recent + feedback**: If argument doesn't match an existing file in
   `.jim-plans/`, treat entire argument as feedback and use most recent doc
2. **File + feedback**: If first word/phrase matches a file (partial match OK),
   use that file and remaining text as feedback
3. **No arguments**: Use most recent doc and prompt user for feedback

## Finding the Document

**If file path provided**:
- Look in `.jim-plans/` for files matching the path (partial match OK)
- If multiple matches, list them and ask user to specify
- If no matches, suggest `/explore` to create new exploration

**If no file path**:
- Find most recent `.jim-plans/*.md` file by timestamp in filename
- If no files exist, suggest `/explore` to create new exploration

## Agent Prompt

Spawn a general-purpose agent via Task with this prompt (substitute
`$EXISTING_DOC` and `$FEEDBACK`):

```
Continue this exploration based on user feedback.

## Existing Exploration Document

[insert full content of $EXISTING_DOC]

## User Feedback

[insert $FEEDBACK]

## Instructions

1. **Understand the feedback**: What is the user asking for?
   - More detail on a specific approach?
   - Answer to an open question?
   - Different direction entirely?
   - Clarification of something unclear?

2. **Update the document** in place at the same file path, preserving the
   original structure:
   - Original Request
   - Context Gathered (add new context if needed)
   - Requirements Analysis (update if requirements changed)
   - Potential Approaches (expand, refine, or add approaches)
   - Recommendation (revise if feedback changes the calculus)
   - Next Steps (update based on any changes)

3. **Add or update Revision History** at the end:
   - Add a "Revision History" section if not present
   - Log the date and a brief note of what changed

4. **Preserve what's valuable**:
   - Don't delete context unless explicitly asked
   - Keep original analysis that's still relevant
   - Add to the document, don't replace wholesale

## Investigation (if needed)

If the feedback requires gathering new context:
- Use Glob for file patterns, Grep for keywords
- Read files completely, trace code paths
- Add findings to "Context Gathered" section

## Return Value

Return ONLY:
- File path of updated document
- 2-3 sentence summary of what changed
- Note any open questions that remain
```

## Handling Empty Feedback

If no feedback is provided in arguments:
1. Read the existing document
2. Display a brief summary of the document
3. Ask the user: "What would you like me to explore further or refine?"
4. Wait for user response before spawning the agent

## Output

Display to user:
- Updated file path
- Brief summary of changes made
- Note they can run `/continue-explore` again for further refinement

## Examples

```
# Continue most recent exploration with feedback
/continue-explore expand on Approach B, it looks promising

# Continue specific exploration
/continue-explore statefile-skills what about using JSON instead of YAML?

# Continue most recent, will prompt for feedback
/continue-explore
```
