# Comment Quality

Every comment must say something the code cannot say for itself.

## Do Not Write

- Restatements of code: `counter += 1 // increment counter`
- Empty docstrings: `@param name the name`, `@return the result`
- Section dividers: `// ---- helpers ----`
- Changelog entries in comments
- TODOs without context or ownership
- Comments on every line or every function

## Worth Writing

- **Why** a non-obvious approach was chosen
- Edge case warnings for future maintainers
- Business logic or domain rules not evident from code
- Non-obvious constraints (performance, ordering, concurrency)
- Anything that would make a reader do a double-take

## Guidelines

- If a comment explains *what* code does, rename or split the
  code instead
- Three clear function names beat one function with three section
  comments
- Don't add comments to code you didn't write unless fixing a bug
- Don't generate docstrings unless the project already uses them
  as convention
