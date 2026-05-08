# Artifact Inventory: Issue #548 ML Model Selection (CF Audit Logs Classifier)

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/issue-548-ml-model-selection/` |
| state | `implemented_synthetic / implementation / NON_VISUAL / production winner pending FU-03-B/FU-03-D` |
| predecessor | Issue #515 (`docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/`) — FU-03-C 後継 |
| successor (production switch) | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-production-classifier-switch.md` |
| candidates | `isolation-forest`, `xgboost`, `workers-ai`（baseline = `threshold`） |
| classifier modules | `scripts/cf-audit-log/classifier/{types,index,isolation-forest,xgboost,workers-ai}.ts` |
| evaluation modules | `scripts/cf-audit-log/evaluation/{model-comparison,selection-criteria}.ts` |
| training modules | `scripts/cf-audit-log/evaluation/training/{train-isolation-forest,train-xgboost}.ts` |
| tests | `scripts/cf-audit-log/__tests__/{classifier-isolation-forest,classifier-xgboost,classifier-workers-ai,model-comparison,selection-criteria}.test.ts` (15 cases) |
| fixtures | `tests/fixtures/cf-audit/{labeled-90day.jsonl,model-isolation-forest.json,model-xgboost.json,comparison-baseline-result.json}` |
| comparison report | `outputs/phase-11/{comparison-metrics.json,model-comparison-report.md}` |
| selection criteria | precision ≥ baseline+5pt / recall ≥ baseline / fallbackRate ≤ 1% / latencyP95 ≤ 500ms; tieBreaker: `precision_desc → latencyP95_asc → fallbackRate_asc` |
| env switches | `CF_AUDIT_CLASSIFIER` (production default `threshold` 据え置き) / `CF_AUDIT_IF_MODEL` / `CF_AUDIT_XGB_MODEL` / `CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_WORKERS_AI_TOKEN` |
| SSOT — observability | `references/observability-monitoring.md` §11 ML Model Selection Contract |
| SSOT — runbook | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` Issue #548 model promotion / rollback |
| SSOT — workflow | `references/task-workflow-active.md` Issue #548 row |
| SSOT — discoverability | `indexes/{resource-map,quick-reference,topic-map}.md` Issue #548 entries |
| lessons-learned | `references/lessons-learned-issue-548-ml-model-selection-2026-05.md` (L-ISSUE548-001..005) |
| skill feedback | `outputs/phase-12/skill-feedback-report.md` (synthetic vs production boundary, status正規化, FU依存図一本化) |
| skill promotion | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`（合成vs本番winner区別ルール） |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,documentation-changelog,unassigned-task-detection,skill-feedback-report,system-spec-update-summary,phase12-task-spec-compliance-check}.md` |

## Evidence

- Synthetic dataset evaluation: `outputs/phase-11/comparison-metrics.json`（720 行 labeled-90day fixture / smoke 用途のみ）
- Local deterministic tests: 15 テスト（classifier 3 候補・model-comparison・selection-criteria）
- Secret hygiene: `secret-leakage-grep.ts` を 4 出力に対し exit 0 確認
- `datasetHash` を SHA-256 の先頭 16 hex に短縮（token-like 検出回避）

## Synthetic vs Production Boundary（不変条件）

- 合成 fixture 上の比較結果は **production winner ではない**。
- production 切替は **FU-03-B redacted 90-day dataset → FU-03-C winner 確定 → FU-03-D production switch** の wave 順序で別タスクとして実施する。
- Workers AI は sync comparison path で fallback する設計のため、synthetic 上は rejection。production runtime evidence は FU-03-D で別途取得する。

## Gate Conditions (production model promotion 前提)

| 判定 | 条件 |
| --- | --- |
| synthetic comparison 完了 | 全 candidate が selection-criteria の判定結果を持ち、leakage grep exit 0 |
| FU-03-B 起動条件 | redacted 90-day dataset 提供準備済み、secret hygiene policy 確認 |
| production switch (FU-03-D) | redacted 90-day で改善、fallback rate 許容、rollback 承認、SSOT に winner 記録 |
| rollback 維持 | env switch (`CF_AUDIT_CLASSIFIER=threshold`) を hourly run で復帰可能 |
