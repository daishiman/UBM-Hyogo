=== title ===
[D+7 observation] post-release 2026-05-01
=== body ===
# [D+7 observation] post-release 2026-05-01

**観測対象日**: 2026-05-08 (release 2026-05-01 + 7 days)

## 1. 観測指標

| 指標 | 閾値 | 実測 | 判定 | evidence |
| --- | --- | --- | --- | --- |
| req/day (API total) | < 100k | _ | [ ] PASS / [ ] WARN / [ ] CRIT | _ |
| D1 reads/day | < 5M | _ | [ ] PASS / [ ] WARN / [ ] CRIT | _ |
| D1 writes/day | < 100k | _ | [ ] PASS / [ ] WARN / [ ] CRIT | _ |
| error rate (5xx) p95 | < 1% | _ | [ ] PASS / [ ] WARN / [ ] CRIT | _ |
| cron success rate (3 cron) | 100% (D+7) / >=99% (D+30) | _ | [ ] PASS / [ ] WARN / [ ] CRIT | _ |
| authz smoke (admin/member 403) | PASS | _ | [ ] PASS / [ ] FAIL | _ |
| free plan headroom | >=60% (D+7) / >=50% (D+30) | _ | [ ] PASS / [ ] WARN / [ ] CRIT | _ |

## 2. 取得手順

`docs/runbooks/post-release-long-term-observation.md` Section 3 を参照する。

## 3. 判定 / 異常時分岐

- WARN (閾値 80% 到達): 本 Issue にコメント追記し、D+30 まで継続観測する。
- CRITICAL (閾値超過): runbook Section 4 に従い rollback 判断へ進む。
- silent regression (authz fail / cron 0%): 即時 rollback 判断と postmortem 起票へ進む。

## 4. 完了条件

- [ ] 全指標欄が記入済
- [ ] 判定が確定
- [ ] CRITICAL の場合 rollback / postmortem Issue がリンク済
- [ ] 本 Issue のコメントに observation 履歴（判定 / evidence / run id）を追記済

## 5. 参照

- runbook: `docs/runbooks/post-release-long-term-observation.md`
- 元仕様書: `docs/30-workflows/issue-350-long-term-production-observation/`
- 24h baseline: `docs/30-workflows/09c-serial-production-deploy-and-post-release-verification/`
