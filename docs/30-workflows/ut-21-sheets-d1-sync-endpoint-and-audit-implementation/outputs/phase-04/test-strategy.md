# Test Strategy

## Result

BLOCKED pending architecture reconciliation.

## Valid Test Targets

- Bearer token 200 / 401 / 403
- 409 same-kind job conflict
- D1 retry / backoff
- Forms response sync idempotency

## Invalid Until Reconciled

- Sheets row sync acceptance as current canonical
- `sync_audit_logs` / `sync_audit_outbox` acceptance
