# Phase 8: リファクタリング

監査タスクのため対象は監査スクリプトおよび成果物テンプレート。

## 変更テーブル

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `audit-runner.sh` | INV ごとに inline grep | INV ごとに function 化 | 並列実行（lane-A/B/C）の単位明確化 |
| matrix Markdown | 手書き | `matrix.tsv` から自動生成 | re-run 時の再現性向上 |

## navigation drift

なし（既存ドキュメント階層に新 task root を追加のみ）。
