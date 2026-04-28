# Phase 12 — 未タスク検出レポート

| カテゴリ | 検出 | 引き継ぎ先 |
| --- | --- | --- |
| 4xx (429 など) の retry 拡張 | あり | UT-10 エラーハンドリング標準化 |
| 通知 (失敗時 Slack 等) | あり | UT-07 通知基盤 |
| メトリクス / アラート | あり | UT-08 モニタリング |
| Sheets API quota 監視 | あり | UT-08 |
| staging 実機 load test | あり | UT-26 staging-deploy-smoke |
| staging 実機 smoke 証跡採取 | あり | UT-26 staging-deploy-smoke |
| middleware 抽出 (Bearer admin) | あり | UT-21 admin route audit と統合 |
| legacy umbrella と旧UT-09実装の衝突 | あり / PR blocker | `task-ut09-direction-reconciliation-001.md` |

検出件数: **8** 件。うち legacy umbrella 衝突は PR blocker であり、既存タスクへの自然委譲では足りないため `task-ut09-direction-reconciliation-001.md` として別途 formalize する。
