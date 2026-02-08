---
name: feedback
description: Provide feedback on recent implementation and apply fixes
allowed-tools: Task
argument-hint: "<feedback> [--type=bug|quality|change]"
---

# Feedback Skill

Accepts user feedback on recent implementation + applies fixes or guides.

## Instructions

Spawn general-purpose agent via Task with this prompt:

```
Process user feedback on recent implementation.

## Parse Arguments

Parse $ARGUMENTS for:
- `--type=TYPE`: bug|quality|change
  - bug: Something isn't working
  - quality: Code quality concerns
  - change: Feature adjustment/addition
  - If absent, infer from feedback content
- Feedback text: remaining args (required)

If no feedback provided:
"Please provide feedback. Examples:
/feedback The login button doesn't work on mobile
/feedback Add input validation to the form --type=change"

## Find Recent Implementation

Check all sources in parallel, use first match (priority order):
1. Most recent .jim/states/active-*.md
2. Most recent .jim/states/*-implemented-*.md
3. Run: git diff --name-only HEAD

If none found:
- Not git repo: "Requires implementation state files or git repository."
- No results: "No recent implementation found. Run /implement first or
  specify files."

From state files, extract:
- Files changed (paths)
- What was implemented (summary)
- Source exploration document (if available)

## Categorize Feedback

If --type not provided, analyze content:

**Bug indicators:** "doesn't work", "fails", "error", "broken", "crash",
"won't", "can't", "unable", error messages/stack traces, "expected X but
got Y"

**Quality indicators:** "naming", "readability", "confusing", "unclear",
"inconsistent", "pattern", "style", "convention", "hard to understand",
"messy", "clean up", code structure refs

**Change indicators:** "add", "include", "also need", "should have",
"change", "modify", "update", "instead", "feature", "enhancement",
"improvement", "would be nice", "could you", "I want"

Default: "change" if unclear.

## Analyze Feedback

### Bugs
1. Identify symptom
2. Read relevant files
3. Find likely cause: missing error handling, incorrect logic, type
   mismatches, edge cases
4. Assess fix complexity

### Quality
1. Identify specific issues
2. Read relevant files
3. Find patterns: naming, organization, comments, complex logic
4. Assess improvements needed

### Changes
1. Understand what to add/change
2. Read relevant files
3. Assess scope: small (inline), medium (context), large (explore)

## Apply Fixes

Create task list + apply systematically.

### Categorize by Complexity

**Simple (automate):** renaming, null checks, off-by-one errors, logic
fixes, missing imports, typos, obvious error handling, simple refactoring

**Medium (apply carefully):** multi-line changes, new functions, control
flow changes, input validation, multi-file changes

**Complex (defer to /explore):** architecture changes, new features,
breaking API changes, performance optimizations

Create tasks via TaskCreate:
- Subject: brief fix description
- Description: file path, issue, solution
- activeForm: "Fixing {issue}"
- Group by file

### Apply Fixes Workflow

Per fix task:
1. TaskUpdate -> in_progress
2. Read entire file for context
3. Identify root cause (bugs), apply minimal fix, verify no side effects
4. Check syntax + no obvious errors; revert if broken
5. TaskUpdate: completed or failed
6. Track: fixes applied, skipped, failed, files modified

### Scope Guidelines
- Fix feedback mentions only
- Don't improve unrelated code
- Preserve behavior unless fixing bug
- Keep changes minimal
- For large changes: recommend /explore

## Create Feedback Document

Generate timestamp YYYYMMDD-HHMMSS. Save to .jim/notes/feedback-{timestamp}.md:

```markdown
# Feedback: {brief summary}

Received: {ISO timestamp}
Type: {Bug|Quality|Change}
Status: {Addressed|Partially Addressed|Needs Clarification|Deferred}

## Original Feedback
{verbatim feedback}

## Context
- Implementation: {state file path or "uncommitted changes"}
- Files Involved: {list}

## Analysis
{What was identified}

## Actions Taken
{What was done}

### Files Modified
- {path} - {description}

### Changes Made
{Detailed description}

## Verification
{How to verify fix}

## Notes
{Context, caveats, follow-ups}

### Remaining Items (if partial)
- {Still to do}
- {Why not addressed}
```

## Ensure Directory Exists

Run: `mkdir -p .jim/notes`

## Return Value

Feedback Processed

Type: {Bug|Quality|Change}
Status: {Addressed|Partially Addressed|Needs Clarification|Deferred}

Summary: {1-2 sentences}

Files Modified: {count} files
{List files}

Feedback Document: {absolute path}

{If addressed:} Verification steps
{If partial:} Remaining items
{If unclear:} Questions
{If deferred:} Recommendation: /explore "{description}"

Next Steps:
1. Verify changes work
2. If issues remain: /feedback "description"
3. When satisfied: /commit

---
Did this address your concern?
- If yes: proceed to /commit
- If partial: /feedback with remaining issues
- If no: describe what's still wrong

## Guidelines

**Stay Focused:** Address feedback only, don't expand scope, ask for
clarification if ambiguous

**Be Conservative:** Minimal changes, no refactoring, preserve patterns

**Communicate Clearly:** Explain what changed + why, provide verification,
note what couldn't address

**Know Limits:** Large changes -> /explore, complex bugs -> investigate,
ask rather than guess

## Tips

- Read full context before changes
- Ask for specific examples if vague
- Check feedback relates to recent implementation
- Track all changes for easy review
- Suggest verification steps
- Note larger issues for future

## Notes

- Modifies files, no commit
- Audit trail in .jim/notes/
- Works with/without state files
- Different from /address-review (AI reviews)
- Different from /continue-explore (plans)
- Spawns via Task for clean context
```
```