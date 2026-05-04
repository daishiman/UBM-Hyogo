# UT coverage 2026-05 wave-3 roadmap

Status: `COMPLETED`

Phase 5〜9 の実測値・gap mapping・候補タスクをこのファイルに統合。詳細は `../issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-{05..08}/` を参照する。

## 1. Background

Wave-2 completed task-scoped coverage hardening, but task-level `unassigned-task-detection` being zero does not mean repository-wide coverage gaps are gone. Wave-3 needs a layer-level roadmap that separates measured coverage gaps from integration and e2e delegation.

## 2. Terms And Scoring

The executable definitions live in `../issue-433-ut-web-cov-05-wave3-roadmap/phase-02.md` and `../issue-433-ut-web-cov-05-wave3-roadmap/phase-03.md`.

スコア = 業務影響(1-3) × 実装規模(1-3) × dependency(1-3) の単純積。スコアが大きいほど「業務影響大・規模小・依存少」の即着手候補。

## 3. Current Coverage Numbers

Phase 5 で `mise exec -- pnpm --filter @ubm-hyogo/{web,api,shared,integrations} test:coverage` を 4 並列実行し全件 PASS。各ワークスペースの total。

| package | tests | line% | branch% | function% | statements% |
| --- | --- | --- | --- | --- | --- |
| @ubm-hyogo/web | PASS | 86.88 | 90.17 | 88.01 | 86.88 |
| @ubm-hyogo/api | PASS | 88.76 | 83.01 | 88.88 | 88.76 |
| @ubm-hyogo/shared | PASS | 95.51 | 86.00 | 95.45 | 95.51 |
| @ubm-hyogo/integrations | PASS | 100.00 | 100.00 | 100.00 | 100.00 |

### Layer 別集計（Phase 6）

| layer | files | line% | branch% | function% | uncovered | wave-2 touched? |
| --- | --- | --- | --- | --- | --- | --- |
| admin component | 8 | 80.07 | 87.38 | 76.14 | 4 | yes |
| public component | 6 | 100.00 | 100.00 | 100.00 | 0 | yes |
| lib | 20 | 89.54 | 89.89 | 95.29 | 3 | yes |
| use-case | 10 | 95.86 | 81.86 | 90.48 | 4 | yes (public のみ) |
| route handler | 29 | 87.94 | 89.63 | 88.89 | 7 | partial |
| shared module | (packages) | 95.51 / 100.00 | 86.00 / 100.00 | 95.45 / 100.00 | 0 | no |
| other (api 内部) | 120 | 88.92 | 81.86 | 89.42 | 35 | partial |

詳細: `../issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-06/layer-aggregation.md`

## 4. Gap Mapping

Phase 6 で line / branch / function いずれか < 80% の file を 30 件抽出。Phase 7 で integration / e2e / polish へ委譲分を分離し、wave-3-unit 候補 19 件を確定。

- 生 gap (30 件): `../issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-06/gap-mapping.md`
- 解決済 gap (19 件 wave-3-unit): `../issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-07/gap-mapping-resolved.md`

主な gap-class 分布:
- `under-tested-unit`: 7 件（admin component / 一部 repository / type 系を除く）
- `branch-only-gap`: 12 件（repository / route helper / use-case の fallback 系）
- `integration-required`: 7 件（sync / Sheets API / Hono entry）
- `mock-coverage-only` / 除外: 4 件（type-only / env binding）

## 5. NON_VISUAL Backlog

integration / e2e / polish へ委譲する 13 件を `../issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-07/non-visual-backlog.md` に集約。

主な委譲:
- **integration-test**: `apps/api/src/{index,jobs/sheets-fetcher,sync/{sheets-client,manual,backfill},routes/admin/sync*}.ts` (D1 / Sheets / Queue 同時依存)
- **e2e**: `lib/oauth-client.ts` redirect 動線、admin component の VISUAL 回帰
- **polish-only / 除外**: `env.ts` / `*.test-d.ts` / `sync/types.ts` (type-only や mock-only)

## 6. Wave-3 Candidate Tasks

Phase 8 で 8 件を抽出（要件: 5〜10 件）。

| rank | slug | summary | layer | delegation-target | score |
| --- | --- | --- | --- | --- | --- |
| 1 | ut-web-cov-06-admin-identity-conflict-row | admin row UI 単体カバレッジ強化 | admin component | wave-3-unit | 27 |
| 2 | ut-api-cov-07-error-handler-branch | `middleware/error-handler.ts` branch 網羅 | other (middleware) | wave-3-unit | 27 |
| 3 | ut-api-cov-08-repository-branch-bundle | repository 6 ファイルの branch / function 一括補強 | other (repository) | wave-3-unit | 18 |
| 4 | ut-web-cov-09-admin-members-request-queue | `MembersClient` / `RequestQueuePanel` interaction 補強 | admin component | wave-3-unit | 18 |
| 5 | ut-api-cov-10-public-route-branch | `routes/public/members` / `use-cases/public/get-form-preview` branch | route handler / use-case | wave-3-unit | 18 |
| 6 | ut-api-cov-11-admin-requests-handler | `routes/admin/requests.ts` handler 別 unit | route handler | wave-3-unit | 12 |
| 7 | ut-shared-cov-12-jobs-shared-branded-types | `jobs/_shared` / branded-types 単体 | other / shared | wave-3-unit | 8 |
| 8 | ut-int-cov-13-sync-integration-suite | sync 系束ね integration suite | integration | integration-test | 6 |

詳細 rationale: `../issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-08/wave3-candidate-tasks.md`

## 7. Inclusion And Exclusion Criteria

Include repository-wide coverage gaps that can be traced to measured line, branch, or function coverage, or to explicit NON_VISUAL integration/e2e delegation in wave-2 Phase 12 outputs.

Exclude individual test implementation work from this roadmap file; those become separate wave-3 implementation specs.

## 8. References

- `../issue-433-ut-web-cov-05-wave3-roadmap/`
- `../unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md`
