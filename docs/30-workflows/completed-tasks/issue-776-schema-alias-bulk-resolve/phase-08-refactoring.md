# Phase 8: Refactoring

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
green 状態を維持しつつ、bulk 関連コードの責務分離・命名・型安全を整える。

## リファクタ候補

1. `useSchemaDiffBulkSelection` 内部の `submit()` を、selection state と HTTP fan-out 部分に分けるか検討。**判断**: 行数が 80 行を超えない範囲では分割しない（過剰抽象化回避）。
2. `BulkRowState` 型は `apps/web/src/components/admin/types.ts` に集約（既存ファイルがなければ新規）。
3. `postSchemaAliasBulk` 内部の HTTP status → error.kind マッピングが今後増える可能性 → 定数 map に切り出さない（YAGNI、`if-else` で十分）。
4. modal の status badge 色は `--color-success` / `--color-danger` を直接利用。badge primitive は新規作成しない（既存に `StatusBadge` があれば再利用、なければインライン）。
5. 既存 `SchemaDiffPanel` の bulk toggle 状態を local state でなく URL search param に持つかを検討。**判断**: 本サイクルでは local state（URL persist は別 followup 候補だが今回は不要）。

## 横展開メモ（次サイクルへの示唆、本サイクル外）

- bulk 操作 hook パターンは admin 系の他画面（members / tags / requests）で再利用余地あり。`apps/web/src/components/admin/_shared/` への抽出は **本サイクル外**（CONST_007「先送り NG」だが、これは将来 followup として親 backlog に既に存在し、本タスクの完了条件ではない）。

## 完了条件
- [ ] 緑のままリファクタ完了
- [ ] 型 export / 命名一貫性 OK
- [ ] 過剰抽象化を行っていない
