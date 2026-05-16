# Manual Smoke Log

Status: `implemented_local_runtime_pending`

Local NON_VISUAL smoke evidence is captured in this cycle:

| Check | Command / Evidence | Expected |
| --- | --- | --- |
| bats guideline presence | `bats scripts/d1/__tests__/migration-guideline-presence.bats` | 5/5 pass |
| CI comment static contract | `grep -F "always() && github.event_name == 'pull_request'" .github/workflows/d1-migration-verify.yml` | match |
| CI comment non-blocking contract | `grep -F "continue-on-error: true" .github/workflows/d1-migration-verify.yml` | match |
| CI issue-comment permission | `grep -F "issues: write" .github/workflows/d1-migration-verify.yml` | match |
| migration-only comment guard | `grep -F "startsWith('apps/api/migrations/')" .github/workflows/d1-migration-verify.yml` | match |

Actual PR comment evidence is Phase 13 user-gated evidence.
