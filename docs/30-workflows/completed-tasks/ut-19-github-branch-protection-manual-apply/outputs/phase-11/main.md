# Phase 11: 手動 smoke test サマリ

## 概要

UT-19 は非視覚タスク（GitHub 設定の手動適用）。スクリーンショット撮影は不要だが、UI 経由で Environments と branch protection の設定値が正しく反映されているかを確認する。

## smoke 観点

1. `https://github.com/daishiman/UBM-Hyogo/settings/branches` で `main` / `dev` の rule が存在
2. `main` rule で「Required approvals: 0」「Status checks: ci, Validate Build」「Allow force pushes / deletions: OFF」が設定済
3. `dev` rule で同等設定（strict 以外）が設定済
4. `https://github.com/daishiman/UBM-Hyogo/settings/environments` で `production` / `staging` が存在
5. production の deployment branches が `main` のみ、staging が `dev` のみ
6. Required reviewers が両 env で 0 名

## 確認結果

詳細は `manual-smoke-log.md` 参照。API 経由の after snapshot で全項目 PASS を確認済。UI 表示も API 値と一致することを runbook §7 sanity check 経由で確認。

## 結論

**PASS** — UI / API 双方で AC-3 / AC-4 含む全 AC が確認できる。
