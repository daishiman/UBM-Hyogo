# Skill Feedback Report

## Template Improvement

| Item | Routing | Evidence |
| --- | --- | --- |
| `taskType` と `visualEvidence` の 2 軸分類 | no-op | `task-specification-creator/references/task-type-decision.md` で既に正本化済み。本 workflow 側を `implementation / NON_VISUAL` に整合。 |
| Phase 12 strict 7 物理配置 | no-op | `task-specification-creator/references/phase-12-spec.md` と compliance template で既に規定済み。本 workflow 側を物理配置。 |
| 同型違反の parity 適用パターン（admin → profile） | applied-with-spec-sync | `fix-admin-server-components-render-error-stg` の env.ts accessor 経路是正 + localhost fallback 撤去パターンを `apps/web/src/lib/fetch/authed.ts` に転用。`getEnv()` full-schema では PUBLIC fallback に到達できないため、`getApiBaseEnv()` を追加して owning spec へ同期済み。 |

## Workflow Improvement

| Item | Routing | Evidence |
| --- | --- | --- |
| Server Component の `try/catch + throw err;` パターン | possible-lessons-learned | SCR digest 化を誘発する。`safeServerFetch` で降格させる設計を member routes 全体で標準化する余地あり。本タスクでは `/profile` の `/me` のみ修正。 |
| runtime PASS と user-gated pending の混同 | no-op | `phase12-compliance-check-template.md` の 3-state verdict vocabulary で既に規定済み。本 workflow 側は local PASS と staging runtime pending を分離。 |

## Documentation Improvement

| Item | Routing | Evidence |
| --- | --- | --- |
| aiworkflow-requirements ledger 同期 | completed | quick-reference / resource-map / task-workflow-active / artifact inventory を同一サイクルで同期済み。 |

追加の owning skill 変更は本サイクルでは不要。今回検出した改善点は実コード・実仕様書・aiworkflow 正本に反映済み。
