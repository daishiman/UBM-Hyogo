# Unassigned Task Detection (UT-26)

## 検出された潜在タスク（起票は行わず検出のみ記録）

| # | 検出内容 | 区分 | 起票判断 |
| --- | --- | --- | --- |
| 1 | env 名統一 | resolved in this review | UT-26 内の task docs / artifacts / 正本仕様を `GOOGLE_SHEETS_SA_JSON` に統一済み。新規 rename task は不要 |
| 2 | smoke route の CI ad-hoc 実行（PR 毎の自動疎通） | backlog candidate | 本タスクは初期 smoke route のみで完了とし、CI 自動化は低優先 backlog |
| 3 | Sheets API クォータ監視（429 観測時の通知連携） | UT-07 / UT-08 範囲 | 本タスクスコープ外。観測ログだけ Phase 11 に残す |
| 4 | smoke route の KV / DO 化による複数 isolate 跨ぎ token cache | UT-09 / UT-10 範囲 | in-memory で smoke 用途は十分。OOS 明示済 |
| 5 | live 実行（staging deploy + 疎通） | UT-26 残課題 | credentials 配置完了後に Phase 11 を更新する。新規 task は不要 |

## Zero-Count Rule

本タスクで新規に起票が必須な未タスクは 0 件。検出記録のみ残す。

## next: Phase 13 PR 作成時に本ファイルを参照
