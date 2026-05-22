# Phase 10 — リファクタ要点 / 最終レビュー

## 中学生レベル概念説明 (Phase 12 canonical heading 整合)

「画面でエラーが起きたとき、見出し (h1) に自動でカーソル (focus) を当てて、スクリーンリーダーが『今エラーですよ』と即座に読み上げられるようにする仕組みを、4 つのエラー画面で同じ書き方にする」ためのリファクタ。

## 最終チェックリスト

- [ ] 新規 hook の責務が 1 つに収まっている (mount 時 focus のみ)
- [ ] 過剰汎化していない (option / config なし)
- [ ] hook の依存配列が `[]` で意図的、`exhaustive-deps` 抑制のコメントを残している
- [ ] 4 boundary すべてで同じ呼び出しパターン
- [ ] 既存 spec を破壊していない
- [ ] CLAUDE.md 不変条件 5 項目すべて遵守
- [ ] PR の diff が hook 1 + spec 4 + boundary 4 + docs 数件で過剰差分なし

## 残課題（将来 followup）

- 本タスクの hook は error boundary 専用ではなく汎用なので、`useDialogAutoFocus` や `useModalReturnFocus` 等の関連 a11y hook 追加時に同じ `apps/web/src/lib/a11y/` 配下へ集約する命名規約を docs で明示するのが望ましい（小規模なため別 issue 化は不要、本 cycle 内 docs 更新で完結）
