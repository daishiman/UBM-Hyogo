# Phase 8 — リファクタリング

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 名前 | リファクタリング |
| 状態 | spec_created |
| 依存 | Phase 7 (coverage 100%) |
| 入力 | Phase 5 実装 + Phase 7 coverage |
| 出力 | outputs/phase-08/refactor-log.md |

## 目的

機能変更を伴わない構造改善を行い、可読性 / 再利用性 / 副作用境界を整える。
coverage 100% を維持したまま実施する。

## タスク

- [ ] row 判定 helper を pure function として切り出す
- [ ] Before/After のコード構造比較を記録する
- [ ] 命名・型のブラッシュアップを実施する
- [ ] 既存 single add 経路と共通化できる箇所を識別する

## 想定リファクタ対象

| Before | After | 理由 |
| --- | --- | --- |
| `importAttendanceBulk` 内に row 判定 if/else が直書き | `classifyImportRow(row, ctx): ImportRowStatus` に分離 | テスト容易性 / 再利用 |
| email 正規化が複数箇所に散在 | `normalizeEmail(s: string): string` を `apps/api/src/lib/email.ts` に集約 | DRY / NFKC 一貫性 |
| state machine reducer 内に巨大 switch | step ごとに handler 関数を分離 | 可読性 |

## 成果物

- `outputs/phase-08/refactor-log.md`
  - Before/After テーブル
  - 切り出した pure function 一覧
  - coverage 維持確認結果（再実行ログ抜粋）

## 完了条件

- 全テスト緑を維持
- coverage 100% を維持
- 機能変更なし（API レスポンス shape / DB 副作用とも同一）

## 注意点 / リスク

- 既存 single add/remove route に手を入れない（scope creep 防止）
- helper 切り出し時に export 公開範囲を最小化する（内部 helper は default export しない）
