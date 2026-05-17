# Phase 2: pivot matrix

| native alert | namespace filter | latency native | 判定 | 採用 |
| --- | --- | --- | --- | --- |
| あり | あり | あり/なし | GO | — |
| **あり** | **なし** | **なし** | **CONDITIONAL GO** | **○ 本タスクで採用** |
| なし | 任意 | 任意 | NO-GO | — |

採用方針: Account 集計で問題ない理由 — UBM-Hyogo の運用 KV namespace は現状 `ALERT_DEDUP_KV` のみ。alert は Account 集計でも実質 ALERT_DEDUP_KV を反映する。
