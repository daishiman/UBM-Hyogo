# Phase 7: Coverage Check

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
本 PR で追加 / 編集したファイル群が CLAUDE.md coverage 基準と本ワークフロー目標を満たすことを確認する。

## 計測対象

```
apps/web/src/components/admin/SchemaDiffPanel.tsx
apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx
apps/web/src/components/admin/hooks/useSchemaDiffBulkSelection.ts
apps/web/src/lib/admin/api.ts (差分: postSchemaAliasBulk)
```

## 閾値

Phase 6 で定めた閾値を CI gate として要求:

- new code lines coverage ≥ 90%
- new code branch coverage ≥ 80%

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage --
mise exec -- pnpm coverage:check  # 存在しない場合は coverage summary を手動で確認
```

## 確認手順

1. `coverage/lcov-report/index.html` で各対象ファイルの行率 / 分岐率を確認
2. 未到達分岐があれば Phase 6 にフィードバックしテスト追加
3. 計測対象外（mock / fixture）は除外

## 完了条件
- [ ] 計測対象ファイルが閾値を満たす
- [ ] 未達分岐が 0 か、または明示的に「テスト対象外」として理由が記録
