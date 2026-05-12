# Phase 1: 要件定義

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 1 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. Why（なぜやるか）

2a/2b/2c の Playwright spec は `page.route()` で UI 用 fixture object を返し、E2E は UI 描画を検証する。一方、本番 API は `apps/api/src/routes/admin/*.ts` 内の zod schema で request/response を parse する。UI fixture と zod schema が drift（ズレ）した場合、mock では成功しても本番 API では 422/400 となり、E2E green が production 信頼性を担保しなくなる。本 task はこの drift を CI で機械検知する Vitest contract test を追加する。

---

## 2. What（何を作るか）

| 区分 | 成果物 |
|------|--------|
| 新規 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（200-260 行、7 describe） |
| 微修正 | `apps/api/src/routes/admin/member-delete.ts`（`DeleteBodyZ` を named export 化） |
| 微修正 | `apps/api/src/routes/admin/requests.ts`（`ListQueryZ` を `ListRequestsQueryZ` として再 export） |
| 微修正 | `apps/api/src/routes/admin/audit.ts`（`QueryZ` を `ListAuditQueryZ` として再 export） |

---

## 3. 受け入れ基準

| # | 条件 | 検証 |
|---|------|------|
| 1 | spec 7 describe すべて green | `pnpm --filter @ubm-hyogo/api test contract-stage-2` |
| 2 | `test.skip` / `it.skip` / `describe.skip` 0 件 | grep |
| 3 | 2d test 内 `z.object(` 0 件 | grep |
| 4 | 3 route の named export が import で参照可能 | typecheck |
| 5 | `MergeIdentityResponseZ` の `archivedSourceMemberId` を fixture が満たす | parse pass |
| 6 | typecheck / lint exit 0 | CI |

---

## 4. Out of Scope

- E2E spec 本体の green 化（2a/2b/2c の責務）
- 新 endpoint / 新 schema 追加（不変条件で禁止）
- cascade preview API（Stage 3 持越し）
- DB I/O を伴う integration test（本 spec は pure unit）
- `DeleteBodyZ` の `packages/shared` 昇格（別 PR）

---

## 5. P50 pre-check（着手前確認）

| 項目 | 状態 |
|------|------|
| 2a/2b/2c 仕様書が存在し fixture shape が読める | 確認済（`e2e-quality-uplift-stage-2-sub-tasks/` 配下） |
| `packages/shared/src/schemas/identity-conflict.ts` が現行 schema を保持 | 確認済（正本ソース §3 #5） |
| `apps/api/src/routes/admin/{requests,audit,member-delete,identity-conflicts}.ts` が現行 endpoint surface を持つ | 確認済 |
| 新規 dependency 追加なし | 既存 `vitest` / `zod` / `@ubm-hyogo/shared` で完結 |

---

## 6. リスク

| # | リスク | 対策 |
|---|--------|------|
| 1 | `MergeIdentityResponseZ` の実体 shape（`archivedSourceMemberId` + `auditId`）と 2b 仕様書の手書き shape が乖離している | §5 fixture 標準形は shared schema を正本とする旨を Phase 2 で明示し、2b 側に同期通知 |
| 2 | route 側 const の export 化で既存 import が壊れる | 別名 re-export（`export { X as Y }`）で既存呼び出しを温存 |

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| artifacts | `artifacts.json` / `outputs/artifacts.json` |

## 目的

2a/2b/2c の UI fixture と API zod schema の drift を、Stage 2 の 2d contract test で実装前に定義し、既存 endpoint surface のみで検知可能にする。

## 実行タスク

1. Why / What / Out of Scope を確定する。
2. 成果物の実ファイルパスと route named export の責務を固定する。
3. P50 pre-check で既存 schema / route / dependency を確認する。
4. fixture drift と export 破壊のリスク対策を Phase 2 へ渡す。

## 参照資料

- `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md`
- `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/{2a-admin-requests.md,2b-admin-identity-conflicts.md,2c-admin-member-delete.md}`
- `packages/shared/src/schemas/identity-conflict.ts`
- `apps/api/src/routes/admin/{requests,audit,member-delete,identity-conflicts}.ts`

## 成果物

- Phase 1 要件定義本文
- `artifacts.json` metadata: `taskType=implementation`, `visualEvidence=NON_VISUAL`, `workflow_state=spec_created`

## 完了条件

- [x] Why / What / Out of Scope が矛盾なく記載されている
- [x] 実コード成果物パスが 1 つに固定されている
- [x] P50 pre-check が完了している
- [x] タスク100%実行確認: Phase 1 の実行タスクをすべて完了してから Phase 2 へ進む

## 統合テスト連携

本 Phase ではテストは実行しない。Phase 4 で TDD Red、Phase 5 で Green、Phase 11 で NON_VISUAL evidence として `@ubm-hyogo/api` focused test / typecheck / lint / grep gate を記録する。
