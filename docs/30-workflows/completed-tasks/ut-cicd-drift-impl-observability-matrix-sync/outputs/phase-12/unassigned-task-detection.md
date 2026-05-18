# Phase 12 Output: Unassigned Task Detection

## 検出結果

| status | 候補 | formalize decision | path | 根拠 |
| --- | --- | --- | --- | --- |
| open | Discord / Slack 通知導入 | 既存未タスクへ委譲 | `docs/30-workflows/unassigned-task/UT-07-notification-infrastructure.md`, `docs/30-workflows/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md`, `docs/30-workflows/unassigned-task/UT-29-cd-post-deploy-smoke-healthcheck.md` | 5 workflow の失敗通知を外部通知へ集約する実装は本タスクの docs-only 範囲外 |
| open | SSOT 自動同期 CI workflow | 既存未タスクへ委譲 | `docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE.md`, `docs/30-workflows/unassigned-task/task-ref-cicd-workflow-topology-drift-001.md` | `.github/workflows/` と `observability-matrix.md` の drift 自動検知は lint / topology drift 系の責務 |
| open | スコープ外 workflow の SSOT 統合判断 | 既存未タスクへ委譲 | `docs/30-workflows/unassigned-task/task-08b-playwright-e2e-full-execution-001.md`, `docs/30-workflows/unassigned-task/UT-GOV-002-EVAL-oidc-and-workflow-run.md`, `docs/30-workflows/unassigned-task/task-ref-cicd-workflow-topology-drift-001.md` | `e2e-tests.yml` / `pr-build-test.yml` / `pr-target-safety-gate.yml` は owner と運用文脈が異なる |
| open | Phase file detection hardening | 新規未タスクとして formalize 済み | `docs/30-workflows/unassigned-task/TASK-SPEC-PHASE-FILENAME-DETECTION-001.md` | `phase-01.md` root file と `outputs/phase-*/main.md` の二系統検出が弱いと Phase 12 監査が false green / false negative になる |

0 件ではない。上記 4 件は「推奨」に留めず、既存未タスクへの委譲または新規 formalize 済みとして本タスクの境界外に分離する。
