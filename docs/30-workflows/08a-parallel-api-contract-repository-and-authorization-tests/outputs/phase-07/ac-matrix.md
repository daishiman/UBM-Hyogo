# Phase 7 — AC マトリクス（詳細トレース）

## 1. AC × verify suite × runbook step × failure × 不変条件

| AC | 観点 | verify suite | test ファイル例 | runbook step | failure | 不変条件 | 計測 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 全 endpoint 32 件 contract green | contract | 各 layer の `*.contract.spec.ts` | Step 4 | F-3, F-6, F-7 | #1 #2 #7 #11 | `vitest *.contract.spec.ts` 全 pass / test 数 ≥ 32 |
| AC-2 | 全 repo 22 種 unit pass | repo unit | `repository/__tests__/*.test.ts` + `repository/*.test.ts` | Step 5 | F-3, F-5 | #7 | `vitest --coverage` で 22 ファイル全出現 / fixture seed ≥ 5 |
| AC-3 | authz 9 マトリクス | authz | `middleware/__tests__/authz.spec.ts` | Step 6 | F-1, F-2 | #5 | `it.each(matrix)` 9 ケース exact match |
| AC-4 | brand 型違反 type test | type | `packages/shared/src/__tests__/brand.type-test.ts` | Step 6 | (compile error) | #2 | `@ts-expect-error` ≥ 3 行 / 削除すると tsc 通って test fail |
| AC-5 #1 | schema 固定しすぎない | contract | `routes/admin/responses-sync.contract.spec.ts` | Step 4 | F-8 | #1 | `extraFields` 列に msw 応答の unknown key が保存される |
| AC-5 #2 | responseEmail system field | contract + type | 同上 me/profile + brand.type-test | Step 4, 6 | F-6 | #2 | zod reject + `@ts-expect-error` |
| AC-5 #5 | 3 層分離 | authz + contract | `authz.spec.ts` + 各 me/admin contract | Step 4, 6 | F-1, F-2 | #5 | 9 セル exact + `/me/*` 401 |
| AC-5 #6 | apps/web → D1 禁止 | lint | `tests/lint/import-boundary.test.ts` | Step 6 | (lint gate) | #6 | grep 0 件 |
| AC-5 #7 | 論理削除 | contract + repo | `member-delete.contract.spec.ts`, `members.test.ts`, `public/members.contract.spec.ts` | Step 4, 5 | F-9, F-11 | #7 | `is_deleted=1` + `deleted_members` row + public 除外 |
| AC-5 #11 | profile 編集なし | contract + authz | `me/__tests__/profile-edit-not-found.contract.spec.ts` | Step 4 | F-4 | #11 | `PATCH /me/profile` / `PATCH /admin/members/:id/profile` → 404 |
| AC-6 | coverage ≥ 85% / 80% | (全 suite) | vitest.config | Step 2, 7 | — | — | coverage threshold で CI 自動 fail |
| AC-7 | CI workflow yml | (file 存在) | `.github/workflows/api-tests.yml` | Step 7 | — | — | yml 配置 + `pnpm --filter @ubm-hyogo/api test --coverage` step |

## 2. 不変条件 × test 詳細

| 不変条件 | test ファイル | observe 方法 | 削除すると壊れる確認 |
| --- | --- | --- | --- |
| #1 | `routes/admin/responses-sync.contract.spec.ts` | msw が `{ extraFields: { unknownKey } }` を返したとき DB 行に保存 | 行を消すと sync が unknown key を捨てる回帰検知できなくなる |
| #2 | `routes/me/__tests__/profile.contract.spec.ts` + `brand.type-test.ts` | zod schema の fields enum に `responseEmail` 不在 / 型 enum に追加すると tsc fail | 型 enum へ `responseEmail` を加えるとコンパイル error |
| #5 | `middleware/__tests__/authz.spec.ts` | 9 セル exact match | middleware を全通させても authz spec が `toBe(401)` で fail |
| #6 | `tests/lint/import-boundary.test.ts` | grep 0 件 | apps/web から `D1Database` import を 1 行加えると test fail |
| #7 | `repository/__tests__/members.test.ts` (markDeleted) + `routes/public/members.contract.spec.ts` (deleted 除外) | `is_deleted=1` row + `deleted_members` row + public list 不在 | 物理 DELETE に変更すると `deleted_members` が増えず assertion fail |
| #11 | `routes/me/__tests__/profile-edit-not-found.contract.spec.ts` | `PATCH /me/profile` → 404 | route を追加すると 200/422 になり test fail |

## 3. failure × AC × test trace

| failure | 第一 AC | test ファイル | suite |
| --- | --- | --- | --- |
| F-1 401 | AC-3, AC-5 #5 | `authz.spec.ts` | authz |
| F-2 403 | AC-3, AC-5 #5 | `authz.spec.ts` | authz |
| F-3 404 resource | AC-1, AC-2 | `routes/admin/members.test.ts`, `repository/__tests__/members.test.ts` | contract + repo |
| F-4 404 route #11 | AC-5 #11 | `profile-edit-not-found.contract.spec.ts` | contract |
| F-5 409 | AC-1, AC-2 | `routes/admin/attendance.test.ts`, `routes/admin/tags-queue.test.ts` | contract + repo |
| F-6 422 | AC-1, AC-5 #2 | 各 contract spec の invalid body 行 | contract |
| F-7 5xx | AC-1 | 各 contract spec の D1 失敗注入 | contract |
| F-8 sync 502 | AC-5 #1 | `responses-sync.contract.spec.ts` | contract |
| F-9 consent 撤回 | AC-5 #7 | `routes/public/members.contract.spec.ts` | contract |
| F-10 rules_declined | AC-1 | `routes/auth/__tests__/gate-state.contract.spec.ts` | contract |
| F-11 deleted login | AC-1, AC-5 #7 | 同上 | contract |
| F-12 unregistered | AC-1 | 同上 | contract |

## 4. 上流 wave AC 引き取り trace

| 上流 task | 引き取り内容 | 反映先 test |
| --- | --- | --- |
| 06a | view model schema (Public*View) | `routes/public/*.contract.spec.ts` の zod parse |
| 06b | `MeProfileView`, `AuthGateState` | `routes/me/*.contract.spec.ts`, `routes/auth/gate-state.contract.spec.ts` |
| 06c | Admin*View | `routes/admin/*.contract.spec.ts`（既存 strengthen）|
| 07a | tag queue resolve workflow | 既存 `routes/admin/tags-queue.test.ts` + workflow test |
| 07b | schema alias assign workflow | 既存 `routes/admin/schema.test.ts` + workflow test |
| 07c | attendance + audit hook | 既存 `routes/admin/attendance.test.ts` + audit log assertion |

## 5. 完了確認

- [x] AC × suite × step × failure × 不変条件 5 軸トレース（§1）
- [x] 不変条件カバー詳細（§2）
- [x] failure × AC × test trace（§3）
- [x] 上流 trace（§4）
