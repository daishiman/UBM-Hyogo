# Manual Smoke Log

## NON_VISUAL 根拠

- UI 変更なし。
- screenshot は作成しない。
- 現在の implementation close-out では、将来実装時に実行する自動テストと 4 worktree smoke の記録項目を固定する。

## 将来実装時の記録項目

| 項目 | 記録内容 |
| --- | --- |
| 自動テスト | Green 件数 / 総件数 / 所要時間 |
| 4 worktree smoke | branch 名 / commit hash / merge 結果 |
| render 確認 | 先頭 40 行 / timestamp 降順 / branch front matter |
| 環境 | Node / pnpm version |
