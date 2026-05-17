# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 名称 | 要件定義 |
| タスク種別 | implementation / NON_VISUAL |
| Issue | #292 |
| 依存 | `07b-parallel-schema-diff-alias-assignment-workflow` |
| implementation_mode | new |

## 目的

`recommendedStableKeys` の label 比較前処理に Unicode 正規化を導入する要件を確定し、後続 Phase で参照する scope / 受入条件 / 命名規則 / タスク分類を固定する。

## 実行タスク

1. タスク分類を NON_VISUAL implementation task として確定する
2. carry-over: `07b-parallel-schema-diff-alias-assignment-workflow` の現行 `aliasRecommendation.ts` を棚卸しする
3. 既存命名規則（camelCase helper / PascalCase 型 / `*.spec.ts`）を記録する
4. 新規 helper 名 `normalizeLabelForCompare(s: string): string` を確定する
5. 機能要件（NFKC + trim + whitespace 圧縮 / 両辺適用 / シグネチャ不変）を列挙する
6. 非機能要件（副作用なし / 過剰一致回避）を列挙する
7. 受入条件を `- [ ]` 形式で列挙する
8. スコープ外（記号除去 / カタカナ変換 / DB schema / UI 表示変更）を明示する

## 参照資料

- `apps/api/src/services/aliasRecommendation.ts`（現行 74 行）
- `apps/api/src/services/aliasRecommendation.spec.ts`（既存 5 ケース）
- `docs/30-workflows/07b-parallel-schema-diff-alias-assignment-workflow/index.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- CLAUDE.md 不変条件 #8（`*.spec.ts` のみ）

## 統合テスト連携

- 本 Phase 単体では test 実行なし
- Phase 4 の `aliasRecommendation.spec.ts` 拡充に required な fixture カテゴリ（完全一致 / NFKC / 空白揺れ / negative）を Phase 1 の受入条件として渡す

## 成果物

`outputs/phase-01/main.md` に以下を記録:
- タスク分類表
- 既存コード命名規則表
- 機能要件 / 非機能要件
- 受入条件チェックリスト
- スコープ外リスト

## 完了条件

- [ ] タスク分類が NON_VISUAL implementation task として明示されている
- [ ] 新規 helper 名 `normalizeLabelForCompare` が確定している
- [ ] 受入条件 6 項目が `- [ ]` 形式で列挙されている
- [ ] スコープ外が明示されている
- [ ] `outputs/phase-01/main.md` が存在する
