# Phase 06 outputs / main

## 異常系シナリオ

| # | 症状 | 対応 |
| --- | --- | --- |
| 1 | A/B flaky 化 | 該当 N 即不採用、一つ前を採用 |
| 2 | Miniflare major breaking | rollback + triage 表に記録 |
| 3 | macOS↔Linux CI 差分 | 両環境 green 確認まで不採用、evidence 分離 |
| 4 | gh api rate limit | GH_TOKEN 経由再実行、待機 |
| 5 | secret 値 log 混入 | ファイル即削除 + token rotate |

## rollback runbook

```bash
git revert <commit>  # または手動で --maxWorkers=1 --minWorkers=1 復帰
# CI 再実行で 133/133 PASS / 0 EADDRNOTAVAIL
```

## evidence 配置

```
outputs/phase-11/evidence/anomaly/
├── flaky-{N}.md
├── ci-vs-local-diff.md
└── rollback-record.md
```

## 次フェーズ

Phase 7 AC マトリクス。
