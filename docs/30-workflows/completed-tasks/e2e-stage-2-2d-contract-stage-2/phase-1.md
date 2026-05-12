# Phase 1: 要件定義

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |
| Implementation Mode | `new`（Vitest contract test 1 ファイル新規 + route 3 ファイル named export 化） |
| Tier | standard |

## 1. 目的

`e2e-quality-uplift-stage-2` 親 workflow の Stage 2 サブタスク 2d として、2a/2b/2c の Playwright spec が `page.route()` で返す **UI fixture object** と、`apps/api` 側 route 実装が parse する **zod schema** が同型であることを CI で機械検証する pure unit test を提供する。drift 検知時、最初に失敗するのは本 contract test であり、4 sub-task の fixture 整合性を CI gate として担保する。

## 2. 前提条件

| # | 前提 | 根拠 |
|---|------|------|
| 1 | `packages/shared/src/schemas/identity-conflict.ts` に `MergeIdentityRequestZ` / `MergeIdentityResponseZ` / `DismissIdentityConflictRequestZ` / `DismissIdentityConflictResponseZ` / `IdentityConflictRowZ` / `ListIdentityConflictsResponseZ` が named export として存在 | grep 確認済 |
| 2 | `@ubm-hyogo/shared` から `adminRequestResolveBodySchema` が named export 済 | barrel export `packages/shared/src/index.ts` |
| 3 | `apps/api/src/routes/admin/member-delete.ts` の `DeleteBodyZ` は inline `const`（非 export） | line 10 |
| 4 | `apps/api/src/routes/admin/requests.ts` の `ListQueryZ` は inline `const`（非 export） | route 内部 |
| 5 | `apps/api/src/routes/admin/audit.ts` の `QueryZ` は inline `const`（非 export） | route 内部 |
| 6 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` は本 workflow で新規作成済み（251 行 / 23 tests） | Phase 11 evidence |
| 7 | 既存 contract test の構造参考: `apps/api/src/audit-correlation/__tests__/contract.test.ts` | 既存 |

## 3. 対象シナリオ（7 describe ブロック）

| # | describe | 検証種別 | 状態 |
|---|---------|---------|------|
| 1 | `GET /admin/requests` | query schema parse + response items[] type-level 同型 | active |
| 2 | `POST /admin/requests/:noteId/resolve` | resolve body parse（approve / reject + 失敗系） | active |
| 3 | `GET /admin/identity-conflicts` | items[] / list response shape parse（shared schema） | active |
| 4 | `POST /admin/identity-conflicts/:id/merge` | request / response body parse + reason 空失敗系。response shape は shared 正本（`archivedSourceMemberId` + `auditId` 含む） | active |
| 5 | `POST /admin/identity-conflicts/:id/dismiss` | request / response body parse + reason 空失敗系 | active |
| 6 | `POST /admin/members/:memberId/delete` | request body parse（成功 + 空 / 欠落 / 501 文字 失敗系）+ response shape type-level 同型 | active |
| 7 | `GET /admin/audit` | query schema parse（成功 + actorEmail 不正失敗系）+ audit entry type-level 同型 | active |

> **skip 0 件**: 2c 側で許容される cascade preview skip とは独立。本 spec ではすべて active。

## 4. 受け入れ基準（観測可能な形）

| # | 基準 | 検証手段 |
|---|------|---------|
| AC1 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` が存在し 251 行 | `wc -l` |
| AC2 | 7 describe ブロック / 23 tests すべて green | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| AC3 | `test.skip` / `it.skip` / `describe.skip` 0 件 | grep |
| AC4 | 2d test 内 `z.object(` が 0 件（schema 重複定義禁止 / CONST_007） | `grep -c 'z\\.object(' contract-stage-2.test.ts` = 0 |
| AC5 | `MergeIdentityResponseZ` の `archivedSourceMemberId` + `auditId` を含む shape を fixture が満たす | parse pass |
| AC6 | route 側の `DeleteBodyZ` / `ListRequestsQueryZ` / `ListAuditQueryZ` / `ListRequestsResponse` / `ResolveRequestResponse` / `ListAuditResponse` が named export として import 可能 | TypeScript compile |
| AC7 | `DeleteBodyZ.parse({ reason:'' })` / `parse({})` / `parse({ reason: 501文字 })` が throw | test pass |
| AC8 | `pnpm --filter @ubm-hyogo/api typecheck` exit 0 | CI log |
| AC9 | `@ubm-hyogo/api` lint/typecheck exit 0。root lint は既存 `apps/web` blocker があるため参考 evidence | CI log |
| AC10 | spec 内 `apps/web` import が 0 件 | grep |

## 5. スコープ外

- 新 endpoint 追加（不変条件で禁止）
- D1 schema 変更（不変条件）
- cascade preview API（Stage 3 持越し）
- DB I/O を伴う integration test（本 spec は pure unit）
- `DeleteBodyZ` の `packages/shared` 昇格（今回目的に不要。route named export で contract test 目的を満たす）
- fixture object の別ファイル化（`fixtures/admin-stage-2.ts` 等。Phase 8 リファクタの責務）

## 6. P50 pre-check

| 観点 | 判定 |
|------|------|
| shared schema 実在 | OK（`packages/shared/src/schemas/identity-conflict.ts:11-47`） |
| route inline schema の named export 化が +1 行で済むか | OK（`const` → `export const` 1 文字種追加） |
| pure unit test として完結するか（DB / binding 不要） | OK |
| Vitest が既存命名規則 `*.test.ts` を自動拾い | OK |
| spec ファイル名衝突 | なし（`apps/api/src/routes/admin/__tests__/` に同名なし） |
| `MergeIdentityResponseZ` shape 正本確定 | OK（shared schema を正本とする補正済 — 元仕様 §13 A） |
