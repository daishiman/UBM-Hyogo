# Phase 4: Test Creation (TDD Red)

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
実装着手前に bulk resolve 機能の失敗テスト（Red）を追加し、実装ゴールを明文化する。

## 追加 / 変更テストファイル

| ファイル | 種別 | 変更 |
| --- | --- | --- |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 既存 | bulk 経路ケース追記 |
| `apps/web/src/components/admin/__tests__/SchemaDiffBulkResolveModal.component.spec.tsx` | 新規 | modal 単体 |
| `apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkSelection.spec.ts` | 新規 | hook 単体 |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | 既存 | `postSchemaAliasBulk` ケース追記 |

**命名規則**: `*.spec.tsx` / `*.spec.ts` のみ（CLAUDE.md 不変条件8）。

## テストケース

### useSchemaDiffBulkSelection.spec.ts

1. `toggle()` で `selectedIds` に追加 / 削除
2. `selectAllInCategory("unresolved", ids)` で `unresolved` カテゴリの id のみ選択
3. `breakdown` が unresolved / changed / total を正しくカウント
4. `openModal(rows)` で `modalOpen=true` かつ `rows` が initialize
5. `updateRowStableKey(diffId, key)` で対応行の stableKey が更新
6. `applySuggestion(diffId)` で `suggestedStableKey` を stableKey にセット
7. `submit()` 全件成功時 → `onAllSucceeded()` が 1 回呼ばれ `selectedIds` がクリア
8. `submit()` 部分失敗時 → 失敗行のみ `rows` に残り `submitStatus="error"` / `errorMessage` がセット、modal は open のまま
9. `submit()` で `202 backfill_cpu_budget_exhausted` を受けた行は `submitStatus="retryable"` として modal に残り、失敗文言ではなく再開可能文言を表示する

### SchemaDiffBulkResolveModal.component.spec.tsx

1. props で渡された `rows` の数だけ行が描画される
2. 各行に stableKey input、推奨採用ボタン、status badge が描画
3. confirm ボタン click で `onSubmit()` 発火
4. `isSubmitting=true` で confirm/cancel ボタンが disabled
5. partial failure 時、失敗行の `errorMessage` が `role="alert"` で表示
6. focus trap: tab で modal 外にフォーカスが抜けない
7. Esc で `onClose()` 発火（ただし isSubmitting=true の間は無視）
8. jest-axe violation 0

### SchemaDiffPanel.component.spec.tsx（追記分）

1. `Bulk Resolve` トグル button click で checkbox が `unresolved` / `changed` 行に描画
2. `added` / `removed` 行には checkbox が描画されない
3. カテゴリヘッダ select-all checkbox click で当該カテゴリ全行が選択
4. 0 件選択時に `Bulk Resolve` 確定 button は disabled
5. 51 件選択（上限超過）時に warning toast 発火 & confirm 不可
6. 既存 single inline edit 経路の既存 spec が回帰なし（既存 assert を維持）

### api.spec.ts（追記分）

1. `postSchemaAliasBulk([])` → `{ results: [] }` を即座に解決
2. 3 件全件成功 → `results[].status === "success"` x3
3. 3 件中 1 件 409 → `results` に 2 success + 1 error (kind: "conflict")
4. 3 件中 1 件 422 → 2 success + 1 error (kind: "invalid")
5. network 失敗 → `error.kind = "network"`
6. bounded concurrency で最大 8 件ずつ実行し、完了順に依存せず row result を元順に aggregate する
7. `202` + `isSchemaAliasRetryableContinuation` 相当の body → `status="retryable"` / `error.kind="retryable"`

## fixtures / mock

- 現行 tree に `apps/web/src/mocks/admin/schema.handlers.ts` は存在しないため、新規 mock infra は作らない。既存 `apps/web/src/lib/admin/__tests__/api.spec.ts` / `SchemaDiffPanel.component.spec.tsx` の `fetch` mock 方式に bulk シナリオ（特定 `questionId` だけ 202 / 409 / 422 を返す）を追加する。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- SchemaDiffBulkResolveModal SchemaDiffPanel useSchemaDiffBulkSelection api.spec
```

このタイミングでは全テストが **fail (Red)** することを確認する。実装は Phase 5 / 6 で進める。

## 完了条件
- [ ] 上記テストが追加され、すべて Red になっている
- [ ] テスト命名規則 (`*.spec.*`) 違反なし
