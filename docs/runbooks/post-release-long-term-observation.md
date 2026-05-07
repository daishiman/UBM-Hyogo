# Post-Release Long-Term Observation Runbook

## 1. 目的と適用範囲

Production release 後の D+7 / D+30 時点で、24h verification では検出しづらい遅延型の劣化を確認する。対象は API traffic、D1 reads/writes、5xx、cron success、authz smoke、free plan headroom である。

## 2. 観測指標と閾値

| 指標 | D+7 閾値 | D+30 閾値 | 判定 |
| --- | --- | --- | --- |
| req/day (API total) | 7日平均 < 100k かつ DoD 比 +50% 以下 | 30日平均 < 100k かつ D+7 比 +30% 以下 | 超過は CRITICAL |
| D1 reads/day | 7日平均 < 5M | 30日平均 < 5M | 80% 到達は WARN、超過は CRITICAL |
| D1 writes/day | 7日平均 < 100k | 30日平均 < 100k | 80% 到達は WARN、超過は CRITICAL |
| error rate (5xx) p95 | < 1% | < 1% | 超過は CRITICAL |
| cron success rate | 100% | >=99% | 0% または連続失敗は silent regression |
| authz smoke | no-token admin/member が 401/403 | no-token admin/member が 401/403 | fail は silent regression |
| free plan headroom | >=60% | >=50% | 下回る場合 WARN、枠超過は CRITICAL |

## 3. 取得手順

1. Reminder Issue を開き、対象 offset と release date を確認する。
2. `scripts/observation/check-thresholds.md` の手順で read-only 値を取得する。
3. 値は reminder Issue の表へ転記し、raw token / PII / request body は保存しない。
4. Evidence は aggregate-only JSON、redacted CSV、GitHub run id、手動判定コメントに限定する。

## 4. 異常時分岐（WARN / CRITICAL / silent）

- PASS: reminder Issue を通常 close し、Issue コメントに履歴（判定 / evidence / run id）を残す。runbook Section 7 は docs PR を伴う節目の履歴だけを追記する。
- WARN: reminder Issue に観測継続コメントを追加し、D+30 または翌営業日に再確認する。
- CRITICAL: 09c production deploy runbook の rollback 判断へ進み、postmortem Issue を起票する。
- silent regression: authz smoke fail / cron 0% / metrics 欠落など、見かけの traffic が正常でも安全性が壊れる兆候として即時 escalation する。

## 5. rollback 連携

Rollback 判断は `docs/30-workflows/09c-serial-production-deploy-and-post-release-verification/` の production release / rollback 境界に従う。D1 write や Cloudflare mutation は user approval がある運用 cycle でだけ実行する。

## 6. postmortem テンプレ

Postmortem には次を最低限記録する。

| 項目 | 内容 |
| --- | --- |
| Detection | D+7 / D+30 のどちらで検出したか |
| Impact | request / D1 / cron / authz / cost の影響範囲 |
| Trigger | 閾値超過、silent regression、手動確認のどれか |
| Action | rollback、監視継続、修正PR、運用変更 |
| Evidence | redacted aggregate-only evidence path |

## 7. 履歴

| 日付 | offset | Issue | 判定 | 備考 |
| --- | --- | --- | --- | --- |
| 2026-05-06 | setup | issue-350-long-term-production-observation | spec_created | reminder workflow と runbook を追加 |
