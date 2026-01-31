# Project Instructions

## Git Identity

For all git commits in this project, use:
- **Author**: Jim Myers <jim.myers@jfmyers.dev>
- **Committer**: Jim Myers <jim.myers@jfmyers.dev>

## Multi-Phase Implementation Guidelines

When using `/explore` to plan complex features, structure the "Next
Steps" section with explicit phase markers for multi-phase
implementations:

### Phase Marker Patterns

Use either of these patterns:
- `**Phase N: Description**` (bold inline)
- `### Phase N: Description` (heading level 3)

### Phase Granularity

- 3-7 phases is ideal (not too many small phases, not too few large ones)
- Each phase should be independently reviewable and testable
- Natural breakpoints: setup, implementation, testing, documentation
- Phases should build on each other sequentially

### Example Structure

```markdown
## Next Steps

**Phase 1: Foundation**
1. Create directory structure
2. Add configuration files
3. Set up dependencies

**Phase 2: Core Implementation**
4. Implement main feature logic
5. Add error handling
6. Create helper utilities

**Phase 3: Testing and Documentation**
7. Write unit tests
8. Add integration tests
9. Update README and documentation
```

### Benefits

- Review and test between phases
- Commit after each phase for clean history
- Pause and resume work easily
- Clear progress tracking via active tracking file
