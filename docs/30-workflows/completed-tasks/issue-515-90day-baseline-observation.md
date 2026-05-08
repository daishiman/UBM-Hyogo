## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-03-A |
| source | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| status | Issue #546 で一度観測済み / Gate-A FAIL のため未完了継続 |
| reason | Issue #408 hourly run の90日 runtime evidence が外部依存。2026-05-08 の Issue #546 観測では 2026-05-06〜2026-05-07 の失敗 run のみ確認され、90日連続条件を満たさなかった |

## 苦戦箇所

90 日連続の Cloudflare Audit Logs 監視実績がないと false positive rate と tuning cost を判断できない。Issue #546 の 2026-05-08 観測では Gate-A FAIL、D1 `cf_audit_log` no-table、baseline helper 欠測により、ML 比較へ進まず `observation_continue` とした。

## リスクと対策

runtime evidence 不足のまま ML 比較へ進むと過学習・誤検知増のリスクがある。90 日 gate を満たすまで threshold を継続する。

## 検証方法

`gh api --paginate` で `cf-audit-log-monitor.yml` / watchdog の長期 run を取得し、`jq -s '.'` 等で JSON array evidence として保存する。`gh run list --limit 500` は 90 日 hourly 観測の上限に届かないため正本 evidence にしない。D1 `cf_audit_log` の集計で連続稼働、false positive rate、tuning cost を記録する。

## Issue #546 観測結果（2026-05-08）

| 項目 | 結果 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/` |
| Gate-A | FAIL（2026-05-06〜2026-05-07 の monitor/watchdog 各32 failure） |
| Gate-B | `PENDING_RUNTIME_EVIDENCE`（alert 0 件だけでは D1 / baseline readiness 不足） |
| Gate-C | `PENDING_RUNTIME_EVIDENCE`（tuning-cost 実績未取得） |
| next action | `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md` に次回再観測 reminder を formalize |

## スコープ

含む: 90 日観測と Gate-A〜C 判定。含まない: モデル学習、production switch。
