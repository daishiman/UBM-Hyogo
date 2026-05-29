# Workflow Artifact Inventory: issue-976-admin-fetch-service-binding

| Artifact | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-976-admin-fetch-service-binding/` | canonical workflow root |
| `docs/30-workflows/completed-tasks/issue-976-admin-fetch-service-binding/artifacts.json` | root metadata |
| `docs/30-workflows/completed-tasks/issue-976-admin-fetch-service-binding/outputs/artifacts.json` | output mirror |
| `docs/30-workflows/completed-tasks/issue-976-admin-fetch-service-binding/outputs/phase-11/local-verification.md` | local focused evidence |
| `docs/30-workflows/completed-tasks/issue-976-admin-fetch-service-binding/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance |
| `apps/web/src/lib/admin/server-fetch.ts` | implementation |
| `apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts` | regression tests |

## User-Gated

Staging deploy, authenticated `/admin/meetings` evidence, `wrangler tail`, commit, push, and PR.

## Lessons Learned

- **L-I976-001** Public/Admin server-fetch transport symmetry を Phase 2/4 gate に入れる
- **L-I976-002** Service binding 優先 + HTTP fallback の二重 transport policy(test/Playwright で global fetch 維持)
- **L-I976-003** transport 判定 accessor を `getPublicFetchEnv()` に一本化(`getEnv()` 全体検証と分離)
- **L-I976-004** `NODE_ENV=test` / `PLAYWRIGHT_TEST=1` 最優先 short-circuit + 3 focused spec(url/binding/http-fallback)で 3 軸固定
- **L-I976-005** transport 変更でも `x-internal-auth`/cookie/JSON body/error snippet/`fetchAdmin(path,init)` signature の既存契約を維持

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-976-admin-fetch-service-binding-2026-05.md`
