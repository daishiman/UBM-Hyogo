# 2026-05-07 Issue #515 Cloudflare Audit Logs ML-ready Classifier

- workflow root: `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/`
- state: `implemented_local_runtime_pending / implementation / NON_VISUAL`
- predecessor: Issue #408 threshold 監視を継承し、本サイクルでは ML-ready abstraction のみ追加 (production 切替は外部 Gate)

## 追加 references / specs

- `references/observability-monitoring.md` §10 Issue #515 ML-ready Classifier Contract、§11 変更履歴に 2026-05-07 行
- `references/deployment-secrets-management.md` `CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` / `CF_AUDIT_REDACT_SECRET` 行、Issue #408 セクションに #515 連動メモ
- `references/task-workflow-active.md` Issue #515 行
- `references/lessons-learned-issue-515-cf-audit-logs-ml-anomaly-2026-05.md` (L-ISSUE515-001..005) — 新規
- `references/workflow-issue-515-cf-audit-logs-ml-anomaly-artifact-inventory.md` — 新規
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` 「Issue #515 audit-log classifier rollback」節
- `indexes/quick-reference.md` Issue #515 ML-ready 行
- `indexes/resource-map.md` Issue #515 workflow 行
- `LOGS/_legacy.md` 2026-05-07 entry
- `task-specification-creator/LOGS/_legacy.md` 2026-05-07 entry

## 実装

- `scripts/cf-audit-log/classifier/{types,threshold,ml,index}.ts` (ML skeleton は threshold fallback)
- `scripts/cf-audit-log/features/{schema,extract}.ts` (RedactedFeatures、raw 値非保持)
- `scripts/cf-audit-log/evaluation/{offline-replay,secret-leakage-grep}.ts`
- `apps/api/migrations/0016_cf_audit_log_classification.sql` (forward-safe ADD COLUMN)
- `.github/workflows/cf-audit-log-monitor.yml` (`CF_AUDIT_CLASSIFIER` default `threshold`, `ML_MODEL_PATH`)
- `tests/fixtures/cf-audit/{leakage-clean,leakage-positive,synthetic-anomaly}/`

## 外部 Gate (未タスク 4 件)

- `unassigned-task/issue-515-90day-baseline-observation.md`
- `unassigned-task/issue-515-redacted-feature-export.md`
- FU-03-C model selection successor: `docs/30-workflows/issue-548-ml-model-selection/` (formalized 2026-05-08)
- FU-03-D production switch successor: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-production-classifier-switch.md`
