# Global Instructions

- I use Graphite for branch management
- Use `/submit` to sync and create PRs
- Use `/commit` for conventional commits

## Archive Directory

The `.jim/archive/` directory contains archived documentation.

**IMPORTANT:** Never read, write, or search in `.jim/archive/` unless the
user explicitly asks to access archived content.

When the user says "access archive" or "check the archive", you may read
from `.jim/archive/`. Otherwise, treat it as if it doesn't exist.

## Documentation and Notes

When writing documentation (either through skills or user request), save
it to the `.jim` directory structure unless otherwise specified:

- `.jim/plans/` - Feature planning and exploration documents
- `.jim/notes/` - Personal notes and observations
- `.jim/scratch/` - Temporary working files
- `.jim/states/` - State tracking files
- `.jim/archive/` - Archived documentation (see Archive Directory section)

These directories are git-ignored and meant for local, personal
documentation that supports your development workflow.

## Text Formatting

When generating documentation or long-form text, ensure terminal
readability:

- Wrap prose at 80 characters per line for standard terminal viewing
- Preserve markdown structure (don't wrap code blocks, headings, lists)
- Don't break URLs across lines
- Keep table formatting intact
- Use semantic line breaks at sentence boundaries when appropriate

The 80-character limit ensures documentation is readable in vim and
terminal windows without horizontal scrolling.
