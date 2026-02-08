---
name: address-review
description: Address feedback from code review with automated fixes
allowed-tools: Task
argument-hint: "[review-doc or slug] [--priority=high|medium|low|all]"
---

# Address Review Skill

Reads code review docs (`/review`, `/review-implementation`) + applies automated fixes. Focuses on safe, straightforward fixes; flags complex issues for manual intervention.

## Instructions

Spawn general-purpose agent via Task with this prompt:

```
Address feedback from a code review document.

## Parse Arguments

Parse $ARGUMENTS for:
- `--priority=LEVEL` flag: Filter by priority (high|medium|low|all)
  - Default: high
  - medium: high + medium
  - low: high + medium + low
  - all: all issues
- Review doc path or slug: remaining args after flags

## Find Review Document

If argument provided (excluding flags):
- Ends with .md: use as direct path
- Otherwise: treat as slug, find most recent:
  - .jim/notes/review-impl-*{slug}*.md
  - .jim/notes/review-*{slug}*.md

No arguments:
- Find most recent in .jim/notes/
- Prefer review-impl-* over review-*

Read to verify it exists + is well-formed.

## Parse Review Feedback

Extract actionable recommendations from review document:

### 1. Parse Recommendations Table

Find "## Recommendations" section, parse:

| Priority | Item | Action |

Extract: Priority (High/Medium/Low, case-insensitive), Item, Action.

Tips:
- Table rows: varied separators
- Some reference files -> extract paths
- "Verify" or "Consider" = optional, not required

### 2. Parse Areas for Improvement

Find "## Areas for Improvement" subsections:

**File: /absolute/path/to/file.ext:23**

Description of issue.

Extract:
- Category (Architecture, Code Quality, Standards, Security/Performance)
- File path + line numbers (:23)
- Issue description
- Suggested fix from "Consider:" or "To fix:"
- Code examples

### 3. Cross-reference Files Changed

- Prioritize fixes in existing files
- Skip nonexistent files

## Filter by Priority

Based on --priority flag (default: high):

- high: High only
- medium: High + Medium
- low: High + Medium + Low
- all: all items

Create filtered list. If no matches, report clearly:

```
No issues found matching priority level: high

Review contains:
  - 0 High
  - 0 Medium
  - 3 Low

To address all: /address-review --priority=all
```

Exit if no issues.

## Categorize Fixes

**Simple (automate):**
- Variable/function rename
- Comment removal/improvement
- Constant extraction
- Import add/remove
- Basic formatting
- Extract/inline variable
- Remove unused code
- Add null checks
- Documentation additions
- Argument hint enhancements
- Simple sentence additions

**Complex (manual):**
- Architecture changes
- Logic modifications
- Algorithm improvements
- Error handling w/ business logic
- Security vulnerability fixes
- Performance optimizations
- Breaking API changes
- Cross-file audits
- System state understanding required

**Edge cases:**
- "consider" or "would be worth": categorize by complexity
- Multiple steps: evaluate each
- Missing/ambiguous path: skip + note
- Outdated line number: skip or search by pattern
- "verify" or "audit": skip (human judgment)

Add complex fixes to "Issues Requiring Manual Intervention" list.

## Create Task List

Simple fix tasks:
- TaskCreate: clear subject + description
- Include: file path, line number, issue, suggested fix
- Group by file
- activeForm: "Applying {fix type} to {filename}"

Complex fix tasks:
- Create informational (not actionable)
- Note: "Requires manual intervention"

## Apply Fixes

Group by file. Fixes in different files: parallel. Within file: sequential.

For each simple task:

1. **TaskUpdate to in_progress**

2. **Read entire file for context**
   - Understand structure
   - Locate issue by line # or pattern
   - Verify issue still exists

3. **Apply fix using Edit**
   - Follow suggestion exactly
   - old_string/new_string w/ sufficient context
   - Preserve intent + behavior
   - Maintain code style

4. **Verify syntax**
   - Basic parse check
   - Don't run full tests
   - Revert if broken -> mark failed

5. **TaskUpdate to completed**
   - Success: completed
   - Failure: failed + note reason

6. **Error handling**
   - File not found: skip + note
   - Edit fails: try more context or skip
   - Ambiguous: skip + mark "requires manual review"

## Track Results

- Issues addressed successfully
- Issues skipped (low priority, complex, ambiguous)
- Issues failed (couldn't apply)
- Files modified

Group by file.

## Generate Fixes Summary

Create: .jim/notes/fixes-{timestamp}-{slug}.md:

```markdown
# Review Fixes Applied: {topic}

Applied: {ISO timestamp}
Review Source: {absolute path}
Priority Level: {high|medium|low}

## Summary

Total Issues: {count}
Addressed: {count} ({percentage}%)
Skipped: {count}
Failed: {count}

## Issues Addressed

{Group by file}

### /absolute/path/to/file.ext

- [x] **{Issue}**
  - Line: {line number if available}
  - Fix: {what was done}
  - Priority: {High|Medium|Low}

## Issues Skipped

- [ ] **{Issue}**
  - File: {path}
  - Reason: {Too complex | Ambiguous | Low priority | etc}
  - Priority: {High|Medium|Low}
  - Note: {context}

## Issues Failed

- [ ] **{Issue}**
  - File: {path}
  - Attempted: {what was tried}
  - Error: {why}
  - Priority: {High|Medium|Low}

## Files Modified

- /path/to/file1.ext - {count} fixes
- /path/to/file2.ext - {count} fixes

## Next Steps

1. Review: git diff
2. Run tests
3. Address skipped issues manually if needed
4. Re-run: /review-implementation
5. Commit: /commit

## Notes

{Additional context, patterns, recommendations}
```

Save:
1. Timestamp: YYYYMMDD-HHMMSS
2. Extract slug from review name
3. Filename: fixes-{timestamp}-{slug}.md
4. Ensure .jim/notes/ exists
5. Save to: .jim/notes/fixes-{timestamp}-{slug}.md

## Return Value

Review Fixes Applied

Review Source: {path}
Fixes Summary: {absolute path}

Results:
  Addressed: {count}
  Skipped: {count}
  Failed: {count}

Files Modified: {count}
{List briefly}

Priority Level: {high|medium|low}

Next Steps:
1. Review: git diff
2. Run tests
3. Address skipped issues manually
4. Re-run: /review-implementation
5. Commit: /commit

Fixes saved to: {path}

## Guidelines

**Safe Fixes Only:**
- Only fixes you're confident won't break
- When uncertain, skip + flag for manual
- Preserve behavior + intent
- Follow suggestions exactly

**Error Recovery:**
- Failure doesn't stop execution
- Log all failures
- Never leave broken state
- Track failures separately from skips

**User Control:**
- User reviews before commit
- No auto-commit
- Clear summary
- Easy to see changes

**Value Focus:**
- High-impact, low-risk first
- Skip ambiguous/complex
- Group by file
- Suggest re-review

## Tips

- Read entire review for context
- Parse Recommendations table + Areas for Improvement
- Handle cases w/ only one section
- File paths should be absolute
- Line numbers: hints, not exact (code may change)
- Use code examples as reference
- Track fixes for user
- Encourage re-review

## Notes

- Modifies files, doesn't commit
- Safe, simple fixes only
- Complex issues flagged for manual
- Works w/ `/review` + `/review-implementation`
- Different from `/refine` (generic simplification)
- Applies specific, targeted fixes
- Spawns via Task tool
