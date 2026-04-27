# Phase 8: DRY 化 — main

## 抽出した共通パターン
- `_shared/db.ts` に `intToBool` / `boolToInt` / `isUniqueConstraintError` を集約
- 各 repository は `SELECT_COLS` 定数で SELECT 句を 1 箇所に
- DB row → domain row の `map` 関数を repository ごとに固定（型安全 + テスト容易）

## 採用しなかった抽象化
- BaseRepository クラス: 状態遷移ロジックが repository ごとに異なるため共通化のメリット薄
- generic CRUD ジェネレータ: 型が膨らみ、AC を見落とすリスクが上がる

詳細 before/after は before-after.md。
