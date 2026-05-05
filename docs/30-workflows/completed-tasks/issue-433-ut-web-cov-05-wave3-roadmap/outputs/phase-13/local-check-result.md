# Local Check Result

## Executed In This Cycle

| Command | Result | Notes |
| --- | --- | --- |
| `mise exec -- pnpm indexes:rebuild` | PASS | `.mise.toml` trust warning and Node typeless module warning only |
| `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap` | PASS_WITH_WARNINGS | 0 errors, 30 pass, 6 planned-wording warnings intentionally retained for pending runtime evidence |
| `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js` | PASS_WITH_WARNINGS | Existing oversized reference-file warnings only |
| conflict marker grep | PASS | No conflict markers found in touched requirement/spec files |
| stale path/package grep | PASS | No stale `@ubm/*`, old current-root, or `verify-indexes-green` references in target spec |
| `mise exec -- pnpm typecheck` | PASS | `.mise.toml` trust warning only |
| `mise exec -- pnpm lint` | PASS_WITH_WARNINGS | stablekey literal lint reported 2 warning-mode existing violations; command exit 0 |

## Commands To Run Before User-Approved PR

```bash
gh run list --workflow verify-indexes.yml --branch "$(git branch --show-current)" --limit 5 --json status,conclusion,headSha,url
```
