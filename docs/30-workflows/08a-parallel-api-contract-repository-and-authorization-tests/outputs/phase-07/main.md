# Phase 7 成果物 — AC マトリクス概要 (08a)

## 1. 目的

Phase 1 の AC-1〜7 × Phase 4 の 5 種 verify suite × Phase 5 の runbook step × Phase 6 の 12 failure を 1:1 でトレースし、不変条件 #1 / #2 / #5 / #6 / #7 / #11 が必ず test として現れているかを最終確認する。詳細表は `ac-matrix.md` を参照。

## 2. AC マトリクス（要約）

| AC | 概要 | suite | runbook step | failure | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 全 endpoint 32 件 contract green | contract | Step 4 | F-3, F-6, F-7 | spec 確定 |
| AC-2 | 全 repo 22 種 unit pass | repo unit | Step 5 | F-3, F-5 | spec 確定 |
| AC-3 | 認可 9 マトリクス 401/403/200 | authz | Step 6 | F-1, F-2 | spec 確定 |
| AC-4 | type test responseId !== memberId | type | Step 6 | (compile error 観測) | spec 確定 |
| AC-5 | 不変条件 6 件を test 化 | contract+lint+type | Step 4-6 | F-4 (#11), F-9 (#7), F-8 (#1) | spec 確定 |
| AC-6 | coverage statements ≥ 85% / branches ≥ 80% | (vitest threshold) | Step 2, 7 | — | placeholder 確定 |
| AC-7 | CI workflow yml 配置 | (file 存在) | Step 7 | — | placeholder 確定 |

## 3. 不変条件カバレッジ（要約）

| 不変条件 | 観測 suite | test ファイル | failure 関連 |
| --- | --- | --- | --- |
| #1 schema 固定しすぎない | contract | `routes/admin/responses-sync.contract.spec.ts`（extraFields 経路） | F-8 |
| #2 responseEmail system field | contract + type | `routes/me/profile.contract.spec.ts`, `packages/shared/src/__tests__/brand.type-test.ts` | F-6 |
| #5 3 層分離 | authz | `middleware/__tests__/authz.spec.ts`（9 セル） | F-1, F-2 |
| #6 apps/web → D1 禁止 | lint | `tests/lint/import-boundary.test.ts`（grep） | (lint 自体が gate) |
| #7 論理削除 | contract + repo unit | `routes/admin/member-delete.test.ts`, `repository/__tests__/members.test.ts`, `routes/public/members.contract.spec.ts` | F-9, F-11 |
| #11 profile 編集なし | contract + authz | `routes/me/__tests__/profile-edit-not-found.contract.spec.ts` | F-4 |

→ 6 不変条件すべてに **少なくとも 1 つの test ファイル**が割当てられ、削除・緩和すれば CI が必ず fail する状態。

## 4. 補強リスト（Phase 4 §3）の AC 紐付け

| 補強項目 | 担当 AC | 担当 不変条件 |
| --- | --- | --- |
| `/me/*` 4 endpoint contract spec 新規 | AC-1, AC-3, AC-5 | #5 #11 |
| `/public/*` 4 spec 新規 | AC-1, AC-5 | #7 |
| 既存 `/admin/*` 20 件に zod parse 強化 | AC-1 | — |
| `extraFields` 経路 sync contract | AC-5 | #1 |
| `PATCH /me/profile` 404 contract | AC-5 | #11 |
| `dashboard` repo unit 新規 | AC-2 | — |
| `publicMembers` repo unit 新規 | AC-2 | #7 |
| 既存 22 件 fixture 5 件以上拡張 | AC-2 | — |
| `authz.spec.ts` 9 マトリクス集約 | AC-3, AC-5 | #5 |
| `brand.type-test.ts` 新規 | AC-4, AC-5 | #2 |
| `import-boundary.test.ts` 新規 | AC-5, AC-7 | #6 |
| vitest.config coverage threshold | AC-6 | — |
| `.github/workflows/api-tests.yml` placeholder | AC-7 | — |

## 5. 上流 task との trace

| 上流 task | 引き取った契約 | test 反映先 |
| --- | --- | --- |
| 06a public-landing-directory | `PublicMemberListView`, `PublicMemberProfileView`, `PublicStatsView` schema | `routes/public/*.contract.spec.ts` |
| 06b member-login-and-profile | `MeProfileView`, `AuthGateState` schema | `routes/me/*.contract.spec.ts`, `routes/auth/gate-state.contract.spec.ts` |
| 06c admin-dashboard-* | `AdminMemberView`, `AdminMeetingView`, `AdminTagQueueView`, `AdminSchemaDiffView` 等 | `routes/admin/*.contract.spec.ts` |
| 07a tag-queue-resolve | `POST /admin/tags/queue/:queueId/resolve` 仕様 | 既存 `routes/admin/tags-queue.test.ts` 拡張 |
| 07b schema-alias-assign | `POST /admin/schema/aliases` 仕様 | 既存 `routes/admin/schema.test.ts` 拡張 |
| 07c attendance / audit | attendance + audit_log hook | 既存 `routes/admin/attendance.test.ts` + audit ログ assertion |

## 6. 多角的チェック観点

- 不変条件 **#1 / #2 / #5 / #6 / #7 / #11** が AC-1〜5 のいずれかで覆われていることを §3 で最終確認
- AC-6 coverage 達成のため Phase 8 で fixture / helper の DRY 化が前提
- AC-7 CI workflow yml は Phase 11 evidence ディレクトリにも複製を配置

## 7. 完了条件チェック

- [x] AC matrix 全行マッピング（ac-matrix.md）
- [x] 不変条件カバレッジ table（§3）
- [x] failure 紐付け（§2 + ac-matrix.md）

## 8. 次 Phase への引き継ぎ

- ac-matrix.md から共通化候補（fixture / helper / brand 型 import）を Phase 8 へ
- 不変条件 6 件すべて PASS の状態を Phase 10 GO 判定の前提に
