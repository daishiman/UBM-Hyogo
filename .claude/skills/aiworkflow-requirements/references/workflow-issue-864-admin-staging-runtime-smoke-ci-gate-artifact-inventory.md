# Workflow Artifact Inventory: issue-864-admin-staging-runtime-smoke-ci-gate

| 種別 | パス | 役割 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/` | Issue #864 admin staging runtime smoke CI gate の Phase 1-13 / Phase 12 strict 7 |
| implementation | `scripts/cf.sh` | `tail <worker> --env staging --format json` wrapper |
| implementation | `scripts/smoke/mint-staging-session-cookie.mts` | Auth.js / middleware 共有 HS256 session cookie mint helper |
| implementation | `scripts/smoke/runtime-admin-web.sh` | authenticated `/admin` GET 200 + render-error digest / boundary log grep runner |
| implementation | `.github/workflows/web-cd.yml` | `deploy-staging` 後の `admin-runtime-smoke` job |
| tests | `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` | cookie mint decode round-trip / TTL / fallback cookie name |
| tests | `scripts/smoke/__tests__/runtime-admin-web.test.sh` | curl/tail stub による 200 / 302 / 403 / body digest / tail digest 分類 |
| skill sync | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | manual runtime smoke command の runner/CI 昇格 gate |
| skill sync | `.claude/skills/task-specification-creator/references/server-component-e2e-pattern.md` | Server Component runtime probe の token compatibility gate |

## State

- `implemented_local_runtime_pending / implementation / NON_VISUAL`
- Local runner/helper/workflow wiring and focused tests are implemented.
- Cloudflare staging deploy, real authenticated `/admin` probe, commit, push, and PR remain user-gated.
- Issue #864 remains closed; use `Refs #864` if a PR is opened later.
