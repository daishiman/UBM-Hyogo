## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-03-D |
| source | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| status | 未実施 |
| reason | production switch は model artifact / rollback approval / Gate 判定後のみ可能 |

## 苦戦箇所

production 切替は GitHub Actions env、D1 migration、model artifact 配布、rollback 手順が同時に関係する。

## リスクと対策

誤検知・見逃しが増えた場合は `CF_AUDIT_CLASSIFIER=threshold` に戻す。D1 追加列は残す forward-safe rollback を原則にする。

## 検証方法

production dry-run、hourly run 7 日観測、Issue body redaction、fallback rate を確認する。

## スコープ

含む: production ML switch と post-switch 観測。含まない: 90 日 baseline 作成とモデル学習。

