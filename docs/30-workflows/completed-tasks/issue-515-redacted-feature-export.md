## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-03-B |
| source | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| status | consumed_by_issue_547_implemented_local_runtime_pending |
| reason | redacted production dataset は Gate-A 達成後でないと不足 |
| consumedBy | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/` |
| consumedAt | 2026-05-08 |

## 苦戦箇所【記入必須】

D1 raw source store には IP / UA / raw_json があるため、export 時に redacted feature だけへ変換する境界が必要。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| raw 値混入 | `secret-leakage-grep.ts` の clean/positive fixture 検証を export pipeline に組み込む。 |
| production runtime false green | production 90 日 runtime export は user approval 後の `PENDING_RUNTIME_EVIDENCE` として残す。 |

## 検証方法

Issue #547 の local fixture export で redacted JSONL、secret leakage grep exit 0、schema validation、manifest SHA-256、production user gate を確認済み。production 90 日 runtime export は user approval 後の `PENDING_RUNTIME_EVIDENCE` として残す。

## スコープ

### 含む

- redacted feature export

### 含まない

- モデル選定
- production ML switch
