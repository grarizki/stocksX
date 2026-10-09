## Agent skills

### Issue tracker

Issues and specifications live in GitHub Issues for `grarizki/stocksX`. Use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### ## General Rules

- MUST: Use @antfu/ni. Use `ni` to install, `nr SCRIPT_NAME` to run. `nun` to uninstall.

- MUST: Use TypeScript interfaces over types.

- MUST: Keep all types in the global scope.

- MUST: Use arrow functions over function declarations

- MUST: Never comment unless absolutely necessary.

  - If the code is a hack (like a setTimeout or potentially confusing code), it must be prefixed with // HACK: reason for hack

- MUST: Use kebab-case for files

- MUST: Use descriptive names for variables (avoid shorthands, or 1-2 character names).

  - Example: for .map(), you can use `innerX` instead of `x`

  - Example: instead of `moved` use `didPositionChange`

- MUST: Frequently re-evaluate and refactor variable names to be more accurate and descriptive.

- MUST: Do not type cast ("as") unless absolutely necessary

- MUST: Remove unused code and don't repeat yourself.