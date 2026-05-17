# System Spec Update Summary

## Updated specs

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Issue #718 spec boundary added: backend-ci moves to `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*`; web-cd keeps current `CLOUDFLARE_API_TOKEN` name while legacy value revocation remains user-gated. |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | Synchronized current GitHub Actions facts: backend-ci now consumes 4 scoped `CF_TOKEN_*` secrets; web-cd alone keeps `CLOUDFLARE_API_TOKEN` as the current runtime name. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added quick lookup for Issue #718. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added Issue #718 resource-map row. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow row with `implemented-local-runtime-pending / implementation / NON_VISUAL`. |

## Verification evidence

| Command | Result |
| --- | --- |
| `jq . docs/30-workflows/issue-718-legacy-cf-token-revocation/artifacts.json` | exit 0 |
| `jq . docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/artifacts.json` | exit 0 |
| `find docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12 -maxdepth 1 -type f \| sort` | strict 7 files present |
| `bash scripts/__tests__/workflow-env-scope.test.sh` | exit 0 |

## No mutation performed

Cloudflare revoke, GitHub Secrets set/delete, 1Password item changes, commit, push, and PR creation remain blocked pending explicit user approval.
