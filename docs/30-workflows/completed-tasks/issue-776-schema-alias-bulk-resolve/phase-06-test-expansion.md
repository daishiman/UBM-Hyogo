# Phase 6: Test Expansion (Green + Refactor)

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
Phase 4 Red テストを Phase 5 実装で Green 化し、補強ケース（境界・エラー・a11y）を追加する。

## 補強テストケース（追記）

### 境界

- `useSchemaDiffBulkSelection`: 同一 diffId を 2 度 toggle すると select → deselect → re-select で `selectedIds` サイズが正しく推移
- modal: 50 件ちょうどの選択は許可 / 51 件は拒否
- `postSchemaAliasBulk([])` 即座 resolve（HTTP 呼び出し 0 回）— mock spy で検証

### エラー伝播

- 5xx 応答 → `error.kind = "other"`、`httpStatus` が保持される
- `postSchemaAlias` が throw → row runner catch 経路 → `error.kind = "network"`
- `postSchemaAlias` が 202 retryable continuation を返す → `status="retryable"` として modal に残る

### a11y（jest-axe）

- bulk modal open 状態で `await axe(container)` → violations 0
- partial failure 表示状態で `await axe(container)` → violations 0

### 既存回帰

- 既存 `SchemaDiffPanel.component.spec.tsx` の single-resolve 経路 assertion を全件維持

## カバレッジ目標（暫定）

| ファイル | line | branch |
| --- | --- | --- |
| `useSchemaDiffBulkSelection.ts` | ≥ 90% | ≥ 85% |
| `SchemaDiffBulkResolveModal.tsx` | ≥ 85% | ≥ 75% |
| `postSchemaAliasBulk` (api.ts 差分) | 100% | ≥ 90% |
| `SchemaDiffPanel.tsx` 全体（既存 + 差分） | 既存比 ▲ なし |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage -- \
  SchemaDiffBulkResolveModal SchemaDiffPanel useSchemaDiffBulkSelection api.spec
```

## 完了条件
- [ ] Phase 4 / 6 の全テストが green
- [ ] jest-axe violation 0
- [ ] 既存 spec 回帰 0
