# Phase 4 — Verify Suite Matrix

## 1. AC × suite 完全マトリクス

| AC | 概要 | contract | repo unit | authz | type | lint | 計測方法 / 閾値 |
| --- | --- | :---: | :---: | :---: | :---: | :---: | --- |
| AC-1 | 全 endpoint 32 contract green | ✓ | — | — | — | — | `vitest run *.contract.spec.ts` で test 数 ≥ 32 / pass=100% |
| AC-2 | 全 repo 22 種 unit pass | — | ✓ | — | — | — | `vitest --coverage` で 22 ファイル全てが coverage 出現、各 fixture seed ≥ 5 |
| AC-3 | 認可 9 マトリクス | ◎(補強) | — | ✓ | — | — | `authz.spec.ts` の `it.each(matrix)` が 9 セル exact match |
| AC-4 | brand 型違反 type test | — | — | — | ✓ | — | `brand.type-test.ts` に `@ts-expect-error` ≥ 3 行、削除すると tsc fail |
| AC-5 #1 | schema 固定しすぎない | ✓ | — | — | — | — | `responses-sync.contract.spec.ts` で extraFields を含む msw 応答を保存できる |
| AC-5 #2 | responseEmail system field | ✓ | — | — | ✓ | — | zod enum で reject + type test で `@ts-expect-error` |
| AC-5 #5 | 3 層分離 | ✓ | — | ✓ | — | — | authz 9 マトリクスの 401/403/200 exact |
| AC-5 #6 | apps/web → D1 禁止 | — | — | — | — | ✓ | `import-boundary.test.ts` の grep 0 件 |
| AC-5 #7 | 論理削除 | ✓ | ✓ | — | — | — | `member-delete.contract.spec.ts` で deleted_members 行追加 + `/public/members` 除外 |
| AC-5 #11 | profile 編集なし | ✓ | — | ✓ | — | — | `PATCH /me/profile` / `PATCH /admin/members/:id/profile` で 404 |
| AC-6 | coverage ≥ 85%/80% | (全 suite) | (全 suite) | (全 suite) | — | — | vitest threshold で CI 自動 fail |
| AC-7 | CI workflow yml | — | — | — | — | (file 存在) | `.github/workflows/api-tests.yml` placeholder 配置 |

## 2. suite 別 test 件数見込

| suite | 既存 | 補強（追加）| 合計 | 備考 |
| --- | ---: | ---: | ---: | --- |
| contract | 約 60（admin route test 中心）| 約 50（zod parse 強化 + me + public + 不変条件 5 件）| 約 110 | 1 endpoint 平均 3〜4 ケース |
| repo unit | 22 ファイル / 既存 22 | dashboard / publicMembers 2 ファイル新規 + 5 ケース化 | 24 ファイル / 約 120 ケース | 1 repo 平均 5 ケース |
| authz | 1（require-admin）| 9 マトリクス + 4 middleware = 13 | 14 ケース | 集約 spec 1 ファイル |
| type | 0 | `@ts-expect-error` ≥ 3 + 同等正常 case | 1 ファイル / 6 ケース | tsc compile-time fail を観測 |
| lint | 0 | grep 2 件 | 1 ファイル / 2 ケース | execSync grep |
| **合計** | **約 83** | **約 75** | **約 274** | — |

## 3. 1 endpoint × 最低ケース

| endpoint カテゴリ | 件数 | contract / endpoint | authz / endpoint | 計 |
| --- | ---: | ---: | ---: | ---: |
| public GET | 4 | 3 (正常 + 不変 + 422) | 1 (anon=200) | 16 |
| me GET/POST | 3〜4 | 3 (正常 + 401 + 不変) | 1 | 12〜16 |
| auth POST | 5 | 5 (AuthGateState 4 + 正常) | 0 | 25 |
| admin GET/POST/PATCH/DELETE | 20 | 3 (正常 + 422 + 不変) | 2 (anon=401, member=403) | 100 |
| **合計** | **32〜33** | — | — | **約 153〜157** |

## 4. coverage 閾値 vs ファイル include / exclude

| 区分 | path | threshold |
| --- | --- | --- |
| include | `src/routes/**` | statements 85% / branches 80% |
| include | `src/repository/**` | statements 85% / branches 80% |
| include | `src/middleware/**` | statements 85% / branches 80% |
| include | `src/use-cases/**` | statements 85% / branches 80% |
| include | `src/view-models/**` | statements 85% / branches 80% |
| include | `src/workflows/**` | statements 85% / branches 80% |
| exclude | `**/__tests__/**`, `**/__fixtures__/**`, `**/__fakes__/**` | — |
| exclude | `**/*.test.ts`, `**/*.spec.ts`, `**/*.contract.spec.ts` | — |
| exclude | `src/**/index.ts`（re-export only）| — |

## 5. failure cases × suite 早見

| failure (Phase 6) | contract | repo unit | authz | type | lint |
| --- | :---: | :---: | :---: | :---: | :---: |
| F-1 401 (未ログイン) | ✓ | — | ✓ | — | — |
| F-2 403 (member→admin path) | ✓ | — | ✓ | — | — |
| F-3 404 resource | ✓ | ✓ | — | — | — |
| F-4 404 route (#11) | ✓ | — | ✓ | — | — |
| F-5 409 重複 | ✓ | ✓ | — | — | — |
| F-6 422 zod | ✓ | — | — | — | — |
| F-7 5xx | ✓ | — | — | — | — |
| F-8 sync 502 | ✓ | — | — | — | — |
| F-9 consent 撤回 | ✓ | ✓ | — | — | — |
| F-10 rules_declined | ✓ | — | — | — | — |
| F-11 deleted login | ✓ | ✓ | — | — | — |
| F-12 unregistered | ✓ | — | — | — | — |

## 6. 不変条件 × suite × test ファイル（trace）

| 不変条件 | suite | 代表 test ファイル | 観測 assert |
| --- | --- | --- | --- |
| #1 | contract | `routes/admin/__tests__/responses-sync.contract.spec.ts` | `extraFields` を含む msw 応答を保存できる |
| #2 | contract + type | `routes/me/__tests__/profile.contract.spec.ts` + `packages/shared/src/__tests__/brand.type-test.ts` | zod reject + `@ts-expect-error` |
| #5 | authz | `middleware/__tests__/authz.spec.ts` | 9 セル exact 断定 |
| #6 | lint | `tests/lint/import-boundary.test.ts` | grep 0 件 |
| #7 | contract + repo | `routes/admin/__tests__/member-delete.contract.spec.ts`, `repository/__tests__/members.test.ts` | deleted_members 行 / `is_deleted=1` 除外 |
| #11 | contract | `routes/me/__tests__/profile-edit-not-found.contract.spec.ts` | 404 |

## 7. 完了確認

- [x] AC × suite 完全マトリクス（§1）
- [x] suite 別 test 件数見込（§2）
- [x] 1 endpoint × 最低ケース定量化（§3）
- [x] coverage include/exclude（§4）
- [x] failure × suite 早見（§5）
- [x] 不変条件 × suite trace（§6）
