# Phase 11 Link Checklist

判定: `SPEC_CONTRACT_READY`

| 参照元 | 参照先 | 状態 | 備考 |
| --- | --- | --- | --- |
| `index.md` | `phase-01.md` - `phase-13.md` | OK | 13 phase files present |
| `phase-12.md` | `outputs/phase-12/main.md` + 6補助 | OK | Strict 7 files materialized |
| `phase-13.md` | `outputs/phase-13/*.md` / `.sql` | OK | G1-G4 skeleton materialized |
| workflow | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | OK | Issue #514 cold storage contract added |
| workflow | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | OK | `CF_AUDIT_R2_TOKEN_PROD` contract added |
| workflow | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | OK | cold storage restore drill runbook added |
| local impl | `apps/api/migrations/0015_add_audit_export_manifest.sql` | OK_LOCAL_RUNTIME_PENDING | Local migration file exists; production apply remains G2 user-gated |
| local impl | `scripts/cf-audit-log/export-to-r2.ts` | OK_LOCAL_RUNTIME_PENDING | Local exporter exists and focused tests cover schema column alignment / manifest 2-phase / redaction gate |
| local impl | `.github/workflows/cf-audit-log-cold-storage.yml` | OK_LOCAL_RUNTIME_PENDING | Workflow file exists; production mutation remains G1-G3 user-gated |
