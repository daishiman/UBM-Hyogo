# Phase 4 verify scripts

Actual source extraction uses const/function declarations, not only function declarations.

```bash
rg -n '^(const|function) [A-Z][A-Za-z0-9]*\b' docs/00-getting-started-manual/claude-design-prototype/primitives.jsx
```
