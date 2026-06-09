`[実装区分: 実装仕様書]`

# Phase 11 — 手動テスト / local evidence inventory

`taskType: implementation` / `visualEvidence: VISUAL` / `workflow_state: implemented_local_evidence_captured`

> 正本は [_shared-context.md](../../_shared-context.md)。Lane A/B/C はローカル実装済み。staging seed apply、認証済み runtime screenshot、commit、push、PR は Phase 13 の user-gated 境界として残す。

## 11.1 Evidence file inventory

Status は厳密に `present` / `pending` / `n/a` のいずれか。Path は workflow root 相対。

| # | Classification | Path | Status |
| --- | --- | --- | --- |
| 1 | manual/local verification result | outputs/phase-11/manual-test-result.md | present |
| 2 | screenshot — 会員からの申請 一覧（desktop, authenticated runtime） | outputs/phase-11/screenshots/admin-requests-rename-runtime-desktop.png | pending |
| 3 | screenshot — 会員からの申請 一覧（mobile, authenticated runtime） | outputs/phase-11/screenshots/admin-requests-rename-runtime-mobile.png | pending |
| 4 | screenshot — 会員管理「申請中」バッジ（desktop, authenticated runtime） | outputs/phase-11/screenshots/admin-members-pending-badge-runtime-desktop.png | pending |

> screenshot 3 件が `pending` の理由: authenticated admin runtime と staging seed apply が user-gated のため。本ファイルではローカル実装・自動検証の evidence を記録する。

## 11.2 Local automated verification

| Command | Result |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api test --run src/testing/test-accounts src/routes/admin/members.contract.spec.ts` | PASS: 86 files / 549 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/shared test --run src/zod/viewmodel.spec.ts` | PASS: 21 files / 257 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx src/components/admin/__tests__/RequestQueueDetail.spec.tsx src/features/admin/components/__tests__/MembersTable.spec.tsx` | PASS: 238 files passed, 1 skipped; 1752 tests passed, 1 skipped |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` | PASS |
| `mise exec -- pnpm seed:test-accounts:gen -- --check` | PASS |
| `mise exec -- pnpm lint` | PASS (stablekey-literal is warning-mode only for existing test-account seed keys) |
| `rg -n "bg-\[#|text-\[#|#[0-9a-fA-F]{6}" apps/web/src/components/admin apps/web/src/features/admin/components apps/web/app/'(admin)'/admin` | PASS: 0 matches |
| Browser smoke: `http://localhost:3000/admin/requests` and `/admin/members` | PASS: unauthenticated requests redirect to `/login?gate=admin_required`; authenticated admin screenshot remains user-gated |

## 11.3 Manual checklist status

| Area | Status | Evidence |
| --- | --- | --- |
| Lane A seed | completed | `TEST-NOTE-V01` / `TEST-NOTE-V02` / `TEST-NOTE-D01` added to catalog; seed and cleanup SQL regenerated; drift guard PASS |
| Lane B rename and role clarity | completed | `/admin/requests` display text now uses `会員からの申請` / `申請一覧` / `申請詳細`; route/API/component identifiers remain unchanged |
| Lane C member badge and API projection | completed | `GET /admin/members` projects `pendingRequestTypes`; shared/contracts/web types updated; member table renders pending request links to `/admin/requests?type=<noteType>` |
| System spec sync | completed | `docs/00-getting-started-manual/specs/11-admin-management.md` and `01-api-schema.md` updated in the same wave |
| Skill discovery sync | completed | aiworkflow-requirements references, indexes, changelog, and LOGS updated in the same wave |
| Authenticated runtime screenshots | pending | user-gated Phase 13 boundary |
| Staging seed apply | pending | user-gated Phase 13 boundary |

## 11.4 User-gated boundary

- `bash scripts/seed-test-accounts.sh --env staging --action apply`
- authenticated admin screenshot capture and staging visual review
- `git commit`, `git push`, `gh pr create --base dev`

No commit, push, PR, or staging mutation was executed in this cycle.
