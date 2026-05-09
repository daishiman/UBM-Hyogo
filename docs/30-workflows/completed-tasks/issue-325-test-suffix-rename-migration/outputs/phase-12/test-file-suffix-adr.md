# ADR: Test file suffix policy for `apps/api`

| 項目 | 値 |
| --- | --- |
| 状態 | **Accepted for Issue #325 implementation** |
| 確定日 | 2026-05-09 |
| 適用範囲 | `apps/api/src/**/*` 配下のすべての test ファイル |
| 関連 workflow | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/`（規約導入元）/ `docs/30-workflows/issue-325-test-suffix-rename-migration/`（本 ADR の遡及適用 PR） |
| 関連 Issue | #325（CLOSED）|

## コンテキスト

08a workflow（`08a-parallel-api-contract-repository-and-authorization-tests`）で `apps/api` の test を **suite 種別ごとに分類** する suffix 規約を導入した。同 workflow の Phase 10 §5 リスク表で「既存 `*.test.ts` 132 件は本サイクルでは混在許容、後追い rename タスクとして UT-08A-06 を起票」と決定した経緯がある。

その結果、`apps/api` 配下には:
- 08a 以降に作られた `*.contract.spec.ts` / `*.authz.spec.ts` / `*.repository.spec.ts` / `*.spec.ts`（規約準拠）
- 08a 以前から残る `*.test.ts`（混在許容・分類不明）

の 2 系統が併存していた。本 ADR で規約を確定し、Issue #325 の rename 実装で全件遡及適用した。

## 決定

`apps/api` の **すべての** test ファイルは、以下 4 分類の suffix のいずれかに **必ず** 分類して命名する。

### 分類定義

| 分類 | suffix | 判定基準（具体ルール） |
| --- | --- | --- |
| contract | `*.contract.spec.ts` | HTTP route / OpenAPI / endpoint 契約を検証する suite。`apps/api/src/routes/**` / `apps/api/src/sync/*-route` / health 系 endpoint / audit-correlation の contract suite 等が該当 |
| authz | `*.authz.spec.ts` | 認可・セッション境界・rate-limit を検証する suite。`middleware/require-admin` / `middleware/me-session-resolver` / `__tests__/authz-matrix` / `middleware/__tests__/rate-limit-magic-link` 等が該当 |
| repository | `*.repository.spec.ts` | D1 / KV / R2 等 persistence layer を検証する suite。`apps/api/src/repository/**` 配下が該当 |
| unit | `*.spec.ts` | 上記 3 分類のいずれにも該当しない test。helper / parser / view-model / use-case / job / workflow / sync / schema / env / brand-type / invariants 等の純粋関数寄り |

### 命名規則

- `<stem>.<class>.spec.ts`（contract / authz / repository）
- `<stem>.spec.ts`（unit のみ class suffix を省略）
- `<stem>` は対象モジュール名と一致させる（既存 `*.test.ts` の stem を流用）

### 既存中間 suffix の正規化

- 既存の `*.contract.test.ts` / `*.authz.test.ts` / `*.repository.test.ts` は `*.contract.spec.ts` / `*.authz.spec.ts` / `*.repository.spec.ts` に正規化する
- `*.test.ts`（無分類）は本 ADR の判定基準に従って 4 分類のいずれかに割り当てる

### 例（5 件）

| 旧 path | 新 path | 分類 |
| --- | --- | --- |
| `apps/api/src/routes/admin/attendance.test.ts` | `apps/api/src/routes/admin/attendance.contract.spec.ts` | contract |
| `apps/api/src/middleware/require-admin.test.ts` | `apps/api/src/middleware/require-admin.authz.spec.ts` | authz |
| `apps/api/src/repository/attendance.test.ts` | `apps/api/src/repository/attendance.repository.spec.ts` | repository |
| `apps/api/src/utils/with-retry.test.ts` | `apps/api/src/utils/with-retry.spec.ts` | unit |
| `apps/api/src/env.test.ts` | `apps/api/src/env.spec.ts` | unit |

## 既存ファイルへの遡及適用

- Issue #325 の実装で `apps/api/src/**/*.test.ts` 132 ファイル全件を `git mv` で rename 済み（`docs/30-workflows/issue-325-test-suffix-rename-migration/`）
- rename は test 内容を変更しない（132 件すべて R100 pure rename）
- 現行 tree は `apps/api/src/**/*.test.ts` = 0、`apps/api/src/**/*.spec.ts` = 132
- 実測 evidence は `outputs/phase-11/main.md` / `rename-mapping.csv` / `glob-coverage-grep.log` に保存する

## 後続適用ルール

1. 新規 test を **`.test.ts` で書き始めない**。最初から本 ADR の suffix で命名する
2. 既存 test を移動 / 改名する場合も本 ADR に従う
3. PR レビュー時に suffix 違反があれば変更要求する
4. CI に強制 gate は **置かない**（コスト過剰）。命名は人間レビューで担保する

## scope out（本 ADR の対象外）

- `apps/web/**` の test 命名（Issue #325 / UT-08A-06 の親責務外）
- `packages/**` の test 命名（Issue #325 / UT-08A-06 の親責務外）
- E2E `tests/e2e/`（既に `*.spec.ts` のため対象外）
- vitest 以外の test runner

## 関連

- `docs/30-workflows/completed-tasks/08a-parallel-api-contract-repository-and-authorization-tests/`
- `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md`
- `docs/30-workflows/issue-325-test-suffix-rename-migration/`
- Issue #325 (CLOSED)

## 改訂履歴

| 日付 | 内容 |
| --- | --- |
| 2026-05-09 | 初版（Accepted）|
