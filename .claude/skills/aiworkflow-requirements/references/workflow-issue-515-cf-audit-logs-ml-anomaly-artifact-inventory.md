# Artifact Inventory: Issue #515 Cloudflare Audit Logs ML-ready Classifier

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| state | implemented_local_runtime_pending / implementation / NON_VISUAL / production ML switch external-gated |
| predecessor | Issue #408 (`docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`) |
| classifier modules | `scripts/cf-audit-log/classifier/{types,threshold,ml,index}.ts` |
| feature export | `scripts/cf-audit-log/features/{schema,extract}.ts` |
| evaluation | `scripts/cf-audit-log/evaluation/{offline-replay,secret-leakage-grep}.ts` |
| migration | `apps/api/migrations/0016_cf_audit_log_classification.sql` (ADD COLUMN only / forward-safe) |
| workflow env | `.github/workflows/cf-audit-log-monitor.yml` (`CF_AUDIT_CLASSIFIER` default `threshold`, `ML_MODEL_PATH`) |
| tests | `scripts/cf-audit-log/__tests__/{classifier,evaluation,features-extract}.test.ts` |
| fixtures | `tests/fixtures/cf-audit/{leakage-clean,leakage-positive,synthetic-anomaly}/` |
| SSOT — observability | `references/observability-monitoring.md` §10 ML-ready Classifier Contract |
| SSOT — secrets | `references/deployment-secrets-management.md` (`CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` / `CF_AUDIT_REDACT_SECRET`) |
| SSOT — runbook | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` Issue #515 audit-log classifier rollback |
| SSOT — workflow | `references/task-workflow-active.md` Issue #515 row |
| lessons-learned | `references/lessons-learned-issue-515-cf-audit-logs-ml-anomaly-2026-05.md` (L-ISSUE515-001..005) |
| skill feedback | `outputs/phase-12/skill-feedback-report.md` (3-state Phase 11 template proposal — pending promotion) |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,documentation-changelog,unassigned-task-detection,skill-feedback-report,system-spec-update-summary,phase12-task-spec-compliance-check}.md` |
| follow-up unassigned | `docs/30-workflows/unassigned-task/issue-515-{90day-baseline-observation,redacted-feature-export,ml-model-selection,production-ml-switch}.md` |

## Evidence

- Local deterministic tests: classifier / evaluation / features extract Vitest スイート
- Phase 12 strict outputs: `outputs/phase-12/`
- Rollback drill: env switch (`CF_AUDIT_CLASSIFIER=threshold`) + hourly run + D1 metadata 確認 (runbook §Issue #515 audit-log classifier rollback)

## Gate Conditions (production ML switch 前提)

| 判定 | 条件 |
| --- | --- |
| threshold 継続 | false positive rate ≤ 5% かつ tuning cost < 4h/month |
| baseline 延長 | false positive rate > 5% かつ baseline 7 日のみ |
| ML 比較開始 | 90 日 evidence あり、false positive rate > 5% または tuning cost ≥ 4h/month |
| production ML 切替 | offline replay で改善、fallback rate 許容、rollback 承認済み |
