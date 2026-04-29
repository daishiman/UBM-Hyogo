# Audit Best Effort Design

## Result

BLOCKED. UT-21 の `sync_audit_logs` / `sync_audit_outbox` は、現行 `sync_jobs` ledger と責務が重複する。

## Next Decision

`sync_jobs` で不足する監査要件を先に分析し、不足が証明された場合のみ追加テーブルを設計する。
