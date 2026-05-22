# システム仕様書更新サマリ — Issue #325

## 更新済み

| 対象 | 内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-325-test-suffix-rename-migration-artifact-inventory.md` | Issue #325 workflow の正本 inventory を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #325 を `implementation_completed / implementation / NON_VISUAL / Phase 11 evidence captured` として登録 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | canonical task root と主要参照を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 08a follow-up / test suffix rename の早見導線を追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-08a-parallel-api-contract-repository-and-authorization-tests-artifact-inventory.md` | UT-08A-06 を Issue #325 successor として consumed 表記へ更新 |

## 更新しないもの

| 対象 | 理由 |
| --- | --- |
| `docs/00-getting-started-manual/specs/` | 本 ADR は `apps/api` test suite の実装規約であり、現時点では `aiworkflow-requirements` の workflow inventory / quick-reference / resource-map を正本導線とする。全リポジトリ横断のテスト命名規約へ拡張しないため manual specs へは昇格しない |
| `apps/web` / `packages` test files | Issue #325 / UT-08A-06 の親責務外。`vitest.config.ts` は移行安全性のため repo-wide に `*.{test,spec}` を許容するが、命名規約 ADR の適用範囲は `apps/api/src/**/*` に限定する |

## Issue #548 workflow root 保全

レビュー中に `docs/30-workflows/issue-548-ml-model-selection/` の削除差分を検出したが、既存 runbook / unassigned task / completed task が canonical successor として参照しているため復元した。Issue #325 の scope では Issue #548 の状態変更は行わない。
