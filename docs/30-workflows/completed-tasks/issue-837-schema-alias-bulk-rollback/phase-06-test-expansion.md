# Phase 6: Test Expansion

## メタ情報

| Key | Value |
| --- | --- |
| workflow | `issue-837-schema-alias-bulk-rollback` |
| 入力 | `phase-04-test-creation.md`（Phase 4 Red テスト）/ `phase-05-implementation.md`（Phase 5 実装） |
| 目的 | Phase 4 の Red テストを Phase 5 実装で Green 化し、fail path / 回帰 guard の補強ケースを追加する |

## 補強ケース一覧

### カテゴリ A: fail path — ネットワークエラー

| ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| FP-A-01 | `rollbackSchemaAliasBulk`（api.ts） | 全 row で `fetch` が throw（ネットワーク断） | 全 row `status: "error" / error.kind: "network"`、`results.length === rows.length`、`onRowResult` が各 row で呼ばれる |
| FP-A-02 | `rollbackSchemaAliasBulk` | 一部 row で `fetch` が throw、残りは 200 成功 | 成功 row は `status: "success"`、失敗 row は `status: "error" / error.kind: "network"`（混在） |
| FP-A-03 | `useSchemaDiffBulkRollbackSelection` | `submit` 中にネットワーク断 | `isSubmitting` が `true` → `false` に戻り、`summary.failed` が残る。送信中 lock が残らない（STATE-DETAIL-01 ロック解放） |

### カテゴリ B: fail path — 混在部分失敗

| ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| FP-B-01 | `rollbackSchemaAliasBulk` | rows 5 件のうち 2 件が 409 (version_mismatch)、3 件が 200 成功 | `results` に `status: "success"` が 3 件、`status: "error" / error.kind: "version_mismatch"` が 2 件 |
| FP-B-02 | `rollbackSchemaAliasBulk` | rows 5 件のうち 1 件が 404 (not_found)、4 件が 200 成功 | 404 row は `error.kind: "not_found"`、成功 row は `status: "success"` |
| FP-B-03 | `rollbackSchemaAliasBulk` | rows 5 件のうち 1 件が 500 (batch_failed)、4 件が 200 成功 | 500 row は `error.kind: "other"` かつ `httpStatus: 500` を保持 |
| FP-B-04 | `SchemaDiffBulkRollbackModal` | 部分失敗時の表示 | `data-role="bulk-rollback-summary"` に `partial` が付与される。失敗 row に `error.kind` バッジが表示される。「失敗分を再取消」ボタンが有効 |
| FP-B-05 | `useSchemaDiffBulkRollbackSelection` | 部分失敗後の selection state | `phase: "done"`。成功 row は `selectedIds` から除去、失敗 row は残る |

### カテゴリ C: fail path — 全失敗

| ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| FP-C-01 | `rollbackSchemaAliasBulk` | 全 row が 409 (version_mismatch) | 全 row `error.kind: "version_mismatch"`、`results.length === rows.length` |
| FP-C-02 | `SchemaDiffBulkRollbackModal` | 全失敗時の表示 | `data-role="bulk-rollback-summary"` に `all-failed` が付与。失敗 rows が残り再 submit 可能 |
| FP-C-03 | `useSchemaDiffBulkRollbackSelection` | 全失敗後の selection state | `phase: "done"`。`selectedIds` が変化なし（再 submit 用に維持）。`summary.success === 0` |

### カテゴリ D: fail path — 50 件上限 throw

| ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| FP-D-01 | `rollbackSchemaAliasBulk` | `rows.length === 51` を渡す | `RollbackApiError` が throw される（`bulk_limit_exceeded` / HTTP status 0）。`onRowResult` は一度も呼ばれない |
| FP-D-02 | `rollbackSchemaAliasBulk` | `rows.length === 50` を渡す（境界値） | throw されず `runWithConcurrency` に渡される（HTTP モックを 50 件用意し全件 200） |
| FP-D-03 | `useSchemaDiffBulkRollbackSelection` | selectedCount 境界 | 51件選択時に `selectedCount === 51`、50件選択時に `selectedCount === 50` |
| FP-D-04 | `SchemaDiffPanel` — HistoryPane | 50 件超 UI | 「一括取消」ボタンが `disabled`。50 件超 alert が表示される |

### カテゴリ E: fail path — version_mismatch 連続（楽観ロック SSOT 確認）

| ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| FP-E-01 | `rollbackSchemaAliasBulk` | 同一 `aliasId` の `version` が古い（409 連続） | 各 row が `error.kind: "version_mismatch"` として独立して失敗する。他 row を巻き戻さない（per-alias 独立 commit 確認） |
| FP-E-02 | `rollbackSchemaAlias`（単体 helper） | 409 応答 | `RollbackApiError` の `status === 409` かつ `kind === "version_mismatch"` が throw されることを単体 spec で確認（既存 spec 内に存在する場合は当該 assertion を強化） |

### カテゴリ F: 境界値

| ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| FP-F-01 | `rollbackSchemaAliasBulk` | `rows.length === 0` | 即座 resolve `{ results: [] }`。HTTP mock 呼び出し 0 回 |
| FP-F-02 | `useSchemaDiffBulkRollbackSelection` | 同一 `aliasId` を 2 度 `toggle` | select → deselect → re-select で `selectedIds` サイズが正しく推移する |
| FP-F-03 | `useSchemaDiffBulkRollbackSelection` | `clearSelection()` 後に `submit` | `rows.length === 0` 扱いになり HTTP 呼び出し 0 回 |

### カテゴリ G: a11y（jest-axe）

| ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| FP-G-01 | `SchemaDiffBulkRollbackModal` | モーダル open（idle 状態） | `await axe(container)` violations 0 |
| FP-G-02 | `SchemaDiffBulkRollbackModal` | partial failure 表示状態 | `await axe(container)` violations 0 |
| FP-G-03 | `SchemaDiffBulkRollbackModal` | submitting（進捗表示中） | `await axe(container)` violations 0 |
| FP-G-04 | `SchemaDiffPanel` HistoryPane | bulk rollback mode ON（checkbox 表示） | checkbox 各行に `aria-label` が設定されている（DOM 属性確認） |

### カテゴリ H: 既存 single rollback 経路への回帰 guard

| ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| RG-H-01 | `SchemaDiffPanel.component.spec.tsx` | 既存 single rollback ボタン → `RollbackConfirmModal` 表示 → confirm 押下 | `rollbackSchemaAlias` が 1 回呼ばれる。bulk 経路は一切起動しない |
| RG-H-02 | `SchemaDiffPanel.component.spec.tsx` | bulk rollback mode OFF 状態 | checkbox が DOM に存在しない。「一括取消」ボタンが存在しない |
| RG-H-03 | `rollbackSchemaAlias`（api.ts 単体） | Phase 5 実装後も `rollbackSchemaAlias` のシグネチャ・動作が変化していない | 既存 `api.spec.ts` の `rollbackSchemaAlias` suite が全件 green |
| RG-H-04 | `RollbackApiError` 型 | Phase 5 後に `RollbackApiError` の shape が維持されている | 既存 `api.spec.ts` の `RollbackApiError` assertions が全件 green |

### カテゴリ I: 既存 bulk resolve 経路への回帰 guard

| ID | 対象 | シナリオ | 期待 |
| --- | --- | --- | --- |
| RG-I-01 | `postSchemaAliasBulk`（api.ts） | Phase 5 実装後も `postSchemaAliasBulk` のシグネチャ・動作が変化していない | 既存 `api.spec.ts` の `postSchemaAliasBulk` suite が全件 green |
| RG-I-02 | `useSchemaDiffBulkSelection` | Phase 5 後も動作に変化なし | 既存 `useSchemaDiffBulkSelection.spec.ts` が全件 green |
| RG-I-03 | `SchemaDiffBulkResolveModal` | Phase 5 後も動作に変化なし | 既存 `SchemaDiffBulkResolveModal.spec.tsx` が全件 green |
| RG-I-04 | `runWithConcurrency` | Phase 8 で export 化後も動作に変化なし | `runWithConcurrency` の直接 unit テスト（または既存 bulk resolve テスト経由）が全件 green |

## テストファイル配置

| テストファイル | 種別 | 新規/既存 |
| --- | --- | --- |
| `apps/web/src/lib/admin/__tests__/api.spec.ts`（`rollbackSchemaAliasBulk` suite 追加） | unit | 追記 |
| `apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx` | unit | 新規 |
| `apps/web/src/components/admin/__tests__/SchemaDiffBulkRollbackModal.spec.tsx` | unit（jest-axe 含む） | 新規 |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`（bulk mode テスト追記） | unit | 追記 |
| `playwright/tests/issue837-schema-bulk-rollback.spec.ts` | e2e | 新規 |

> **不変条件**: すべて `*.spec.ts` / `*.spec.tsx`。`*.test.*` は禁止（CLAUDE.md 不変条件8）。

## spec テスト実行コマンド

```bash
# unit tests（対象ファイルのみ）
mise exec -- pnpm --filter @ubm-hyogo/web vitest run \
  "src/lib/admin/__tests__/api.spec.ts" \
  "src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx" \
  "src/components/admin/__tests__/SchemaDiffBulkRollbackModal.spec.tsx" \
  "src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx"

# e2e テスト（staging / branch preview 環境）
mise exec -- pnpm --filter @ubm-hyogo/web playwright test \
  "playwright/tests/issue837-schema-bulk-rollback.spec.ts"
```

## 完了条件

- [ ] カテゴリ A〜I の全 ID が green（CI / local どちらでも green であること）
- [ ] jest-axe violations 0（FP-G-01〜04）
- [ ] 既存 spec 回帰 0（RG-H-01〜04 / RG-I-01〜04）
- [ ] `*.test.*` ファイルが存在しない（不変条件8）
