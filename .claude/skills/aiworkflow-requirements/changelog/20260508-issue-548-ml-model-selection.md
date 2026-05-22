# 2026-05-08 Issue #548 Cloudflare Audit Logs ML Model Selection

- workflow root: `docs/30-workflows/issue-548-ml-model-selection/`
- state: `implemented_synthetic / implementation / NON_VISUAL / production winner pending FU-03-B/FU-03-D`
- parent: Issue #515 ML-ready classifier
- synced SSOT: `references/observability-monitoring.md`, `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`, `references/task-workflow-active.md`, `indexes/resource-map.md`, `indexes/quick-reference.md`
- candidates: Isolation Forest / XGBoost / Workers AI against threshold baseline
- criteria: precision >= baseline + 5pt, recall >= baseline, fallback rate <= 1%, latency p95 <= 500ms
- boundary: synthetic fixture is harness smoke only; production winner requires FU-03-B redacted 90-day replay
- follow-up: FU-03-D production classifier switch remains user-gated
