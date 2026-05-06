# Phase 09 Secret Hygiene

## Scope

`scripts/postmortem/` and `docs/30-workflows/runbooks/postmortem/`.

## Result

PASS.

- No secret values are generated or read.
- The CLI accepts local evidence paths only.
- Smoke evidence uses temporary directories and redacts concrete temp paths in permanent documentation.
