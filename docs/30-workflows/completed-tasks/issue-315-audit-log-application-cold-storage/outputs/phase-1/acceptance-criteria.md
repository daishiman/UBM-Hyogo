# Phase 1 成果物: Acceptance Criteria (Issue #315)

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC-1 | application audit_log の日次差分が redacted JSONL.gz として `UBM_AUDIT_APP_COLD_STORAGE` (R2) に export される | export-to-r2.spec TC-EXP-02 |
| AC-2 | D1 `audit_log_export_manifest` で 2-phase commit (pending→completed/failed) 記録、`UNIQUE(yyyy,mm,dd)` | auditLog-export.spec TC-REP-02..04 |
| AC-3 | export 対象 row の email/phone/address/actor_email が `[REDACTED:<kind>]` 置換 | redact.spec TC-RED-01..04, export-to-r2.spec TC-EXP-05 |
| AC-4 | R2 bucket は Object Lock COMPLIANCE 7 年 | runbook (manual setup, Phase 11 gate) |
| AC-5 | D1 内 retention 90 日、completed manifest 被覆範囲のみ purge | auditLog-export.spec TC-REP-05/06 |
| AC-6 | GitHub Actions cron `0 3 * * *` で起動、cf 系 `0 2 * * *` と分離 | .github/workflows/audit-log-cold-storage.yml |
| AC-7 | redaction grep gate で raw email/phone 0 件 | redact-grep-gate.spec TC-GREP-01/02 |
| AC-8 | semi-annual restore drill 手順整備 | runbook semi-annual restore drill section |
| AC-9 | 外部 SIEM 連携は未実装（明示却下） | index.md スコープアウト |
