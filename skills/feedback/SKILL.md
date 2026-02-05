---
name: feedback
description: Provide feedback on recent implementation and apply fixes
allowed-tools: Task
argument-hint: "<feedback> [--type=bug|quality|change]"
---

# Feedback Skill

This skill accepts user feedback on the most recent implementation and either
applies fixes directly or provides guidance. It bridges the gap between
automated review and human-provided feedback.

## Instructions

Spawn a general-purpose agent via Task with this prompt:

```
Process user feedback on a recent implementation.

## Parse Arguments

Parse $ARGUMENTS for:
- `--type=TYPE` flag: Explicit feedback type (bug|quality|change)
  - bug: Something isn't working as expected
  - quality: Code quality concerns (style, patterns, maintainability)
  - change: Feature adjustment or addition request
  - If not provided, infer from feedback content
- Feedback text: The remaining arguments (required)

If no feedback text provided, inform user and exit:
"Please provide feedback on the implementation. Example:
/feedback The login button doesn't work on mobile
/feedback Add input validation to the form --type=change"

## Find Recent Implementation

Check all sources in parallel, then use the first match found
(in priority order):

1. Find most recent .jim/states/active-*.md file
2. Find most recent .jim/states/*-implemented-*.md file by timestamp
3. Run: git diff --name-only HEAD

Run all three checks simultaneously. Use the first source that
returns results, preferring in the order listed above.

If none return results:
- If git command failed (not a git repository), inform user:
  "This skill requires either implementation state files or a git
  repository. Please specify which files your feedback applies to."
- If no results from any source, inform user:
  "No recent implementation found. Please run /implement first or
  specify which files your feedback applies to."

Extract from state files:
- Files changed (list of paths)
- What was implemented (summary)
- Source exploration document (if available)

## Categorize Feedback

If --type flag not provided, analyze feedback to categorize:

**Bug indicators:**
- "doesn't work"
- "fails"
- "error"
- "broken"
- "crash"
- "not working"
- "won't"
- "can't"
- "unable"
- Mentions of specific error messages or stack traces
- "expected X but got Y" patterns

**Quality indicators:**
- "naming"
- "readability"
- "confusing"
- "unclear"
- "inconsistent"
- "pattern"
- "style"
- "convention"
- "hard to understand"
- "messy"
- "clean up"
- References to code structure or organization

**Change indicators:**
- "add"
- "include"
- "also need"
- "should have"
- "change"
- "modify"
- "update"
- "instead"
- "feature"
- "enhancement"
- "improvement"
- "would be nice"
- "could you"
- "I want"

If unclear, default to "change" as it's the safest assumption.

## Analyze Feedback

Based on feedback type, analyze what needs to be done:

### For Bugs

1. Identify the symptom described
2. Read relevant files from implementation
3. Look for the likely cause:
   - Missing error handling
   - Incorrect logic or conditions
   - Type mismatches or null checks
   - Edge cases not handled
4. Determine if fix is straightforward or complex

### For Quality Concerns

1. Identify specific quality issues mentioned
2. Read relevant files to understand context
3. Look for patterns to address:
   - Naming inconsistencies
   - Code organization issues
   - Missing or poor comments
   - Overly complex logic
4. Determine what changes would address concerns

### For Change Requests

1. Understand what the user wants added/changed
2. Read relevant files to understand current state
3. Assess scope of change:
   - Small: Can be done inline
   - Medium: Requires reading more context
   - Large: May need new exploration

## Apply Fixes

Based on feedback type, create a task list and apply fixes systematically.

### Create Task List for Fixes

Before applying fixes, create tasks:

1. **Categorize fixes** by complexity:
   - **Simple fixes (automate):**
     - Variable/function renaming
     - Missing null checks
     - Off-by-one errors
     - Simple logic corrections
     - Adding missing imports
     - Fixing typos in strings/comments
     - Adding error handling for obvious cases
     - Simple refactoring (extract variable, inline)

   - **Medium fixes (apply with care):**
     - Multi-line code changes
     - Adding new functions/methods
     - Modifying control flow
     - Adding input validation
     - Changes spanning multiple files

   - **Complex fixes (defer to /explore):**
     - Architecture changes
     - New feature development
     - Breaking API changes
     - Changes requiring design decisions
     - Performance optimizations needing profiling

2. **Create tasks** using TaskCreate:
   - Subject: Brief description of fix
   - Description: File path, issue, and proposed solution
   - activeForm: "Fixing {issue description}"
   - Group tasks by file when possible

### Apply Fixes Workflow

For each fix task:

1. **TaskUpdate to in_progress**

2. **Read entire file for context**
   - Understand file structure and patterns
   - Locate the issue by description or code pattern
   - Verify issue still exists (might already be addressed)

3. **For bugs:**
   - Identify the root cause
   - Determine minimal fix that addresses symptom
   - Verify fix won't break other functionality
   - Apply fix using Edit tool

4. **For quality concerns:**
   - Identify the specific quality issue
   - Apply improvement while preserving behavior
   - Maintain existing code style and patterns

5. **For change requests:**
   - Apply changes within scope
   - If change requires understanding of larger system, note it
   - If change is beyond current context, defer

6. **Verify after each edit:**
   - Check file can be parsed (basic syntax check)
   - For TypeScript/JavaScript: verify no obvious type errors
   - For Python: check indentation is correct
   - If syntax broken: revert change, mark task as failed

7. **TaskUpdate based on result:**
   - If fix succeeded: mark completed
   - If fix failed: mark failed with reason, continue to next task
   - Never leave tasks hanging in in_progress

8. **Error handling:**
   - If file not found: skip, note in summary
   - If Edit fails (old_string not found): try more specific context
   - If still fails: skip, note as "couldn't locate code pattern"
   - If ambiguous feedback: skip, ask for clarification

### Track Results

Maintain counts for summary:
- Fixes applied successfully
- Fixes skipped (too complex, ambiguous)
- Fixes failed (couldn't apply)
- Files modified

### Scope Guidelines

- Only fix what the feedback specifically mentions
- Don't "improve" unrelated code
- Preserve existing behavior unless fixing a bug
- Keep changes minimal and focused
- If unsure, ask for clarification rather than guess
- For large changes: recommend /explore for planning

## Create Feedback Document

Generate timestamp in format: YYYYMMDD-HHMMSS
Create filename: feedback-{timestamp}.md
Save to: .jim/notes/feedback-{timestamp}.md

Document structure:

```markdown
# Feedback: {brief summary of feedback}

Received: {ISO timestamp, e.g., 2026-01-30T22:30:00Z}
Type: {Bug|Quality|Change}
Status: {Addressed|Partially Addressed|Needs Clarification|Deferred}

## Original Feedback

{verbatim user feedback}

## Context

Implementation: {path to state file or "uncommitted changes"}
Files Involved: {list of relevant files}

## Analysis

{What was identified as the issue/request}

{For bugs: What the likely cause was}
{For quality: What patterns were identified}
{For changes: What modifications were requested}

## Actions Taken

{What was done to address the feedback}

### Files Modified

- {/absolute/path/to/file.ext} - {brief description of change}

### Changes Made

{Detailed description of changes, with before/after if helpful}

## Verification

{How to verify the fix works}

- {Step to verify}
- {Expected result}

## Notes

{Any additional context, caveats, or follow-up needed}

{If partially addressed or deferred:}
### Remaining Items

- {What still needs to be done}
- {Why it wasn't addressed}
```

## Ensure Directory Exists

Run: `mkdir -p .jim/notes`

## Return Value

Return concise summary to user:

```
Feedback Processed

Type: {Bug|Quality|Change}
Status: {Addressed|Partially Addressed|Needs Clarification|Deferred}

Summary: {1-2 sentence summary of what was done}

Files Modified: {count} files
{List files briefly}

Feedback Document: {absolute path to feedback document}

{If addressed:}
Verification:
{Brief steps to verify the fix}

{If partially addressed:}
Remaining:
- {What still needs to be done}

{If needs clarification:}
Questions:
- {What needs clarification to proceed}

{If deferred (large change):}
Recommendation:
This change is substantial. Consider running:
/explore "{brief description of change}"

Next Steps:
1. Verify the changes work as expected
2. If issues remain: /feedback "description of remaining issue"
3. When satisfied: /commit

---
Did this fix address your concern?
- If yes, you can proceed to /commit
- If partially, run /feedback with remaining issues
- If no, please describe what's still wrong
```

## Guidelines

**Stay Focused:**
- Address only what the feedback mentions
- Don't expand scope without user request
- Ask for clarification if feedback is ambiguous

**Be Conservative:**
- When fixing bugs, make minimal changes
- Don't refactor "while you're in there"
- Preserve existing patterns and style

**Communicate Clearly:**
- Explain what you changed and why
- Provide verification steps
- Note anything you couldn't address

**Know Your Limits:**
- Large changes need /explore planning
- Complex bugs may need investigation
- When unsure, ask rather than guess

## Tips

- Read the full context before making changes
- If feedback is vague, ask for specific examples
- Check if feedback relates to recent implementation
- Track all changes for easy review
- Suggest verification steps the user can follow
- If feedback reveals a larger issue, note it for future work

## Notes

- This skill modifies files but does not commit changes
- Creates audit trail of user feedback in .jim/notes/
- Works with or without implementation state files
- Different from /address-review which processes AI reviews
- Different from /continue-explore which refines plans
- Always spawns via Task tool for clean context window

## Return Value from Skill Loader

After the Task completes, display:
- Feedback processing summary
- Path to feedback document
- Suggested next steps
```