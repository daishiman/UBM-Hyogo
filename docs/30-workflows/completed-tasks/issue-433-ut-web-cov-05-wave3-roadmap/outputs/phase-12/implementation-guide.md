# Implementation Guide

## Part 1: 中学生レベル

テストは「どこを通ったか」を記録する地図のようなものです。wave-2 では公開ページなど大事な道を通れるようにしました。今回は地図全体を見直し、まだ通っていない道（カバーしていないコード）を集めて、次の wave-3 でどこから直すかを 8 個のタスクにまとめました。

## Part 2: 技術者レベル

Issue #433 の `implementation / NON_VISUAL` workflow を Phase 5〜13 まで完走させ、wave-3 の roadmap を実測値ベースで確定。

## AC Trace

| AC | Owner Phase | Current State |
| --- | --- | --- |
| AC-1 layer coverage report | Phase 5 / 6 | COMPLETED — `phase-05/coverage-summary-{web,api,packages}.json` + `phase-06/layer-aggregation.md` |
| AC-2 gap mapping | Phase 6 / 7 | COMPLETED — `phase-06/gap-mapping.md` (raw 30) + `phase-07/gap-mapping-resolved.md` (19 wave-3-unit) |
| AC-3 5-10 candidate tasks | Phase 8 | COMPLETED — `phase-08/wave3-candidate-tasks.md` (8 件) |
| AC-4 aiworkflow references | Phase 10 / 12 | COMPLETED — references 同期済、indexes 再生成済 |
| AC-5 indexes / CI | Phase 10 / 11 / 13 | LOCAL PASS for indexes rebuild / drift 0; CI verify remains PENDING_CI_EVIDENCE until push / PR approval |

## Coverage 数値（最終）

| package | line% | branch% | function% |
| --- | --- | --- | --- |
| @ubm-hyogo/web | 86.88 | 90.17 | 88.01 |
| @ubm-hyogo/api | 88.76 | 83.01 | 88.88 |
| @ubm-hyogo/shared | 95.51 | 86.00 | 95.45 |
| @ubm-hyogo/integrations | 100.00 | 100.00 | 100.00 |

## Wave-3 候補タスク（8 件）

| rank | slug | score |
| --- | --- | --- |
| 1 | ut-web-cov-06-admin-identity-conflict-row | 27 |
| 2 | ut-api-cov-07-error-handler-branch | 27 |
| 3 | ut-api-cov-08-repository-branch-bundle | 18 |
| 4 | ut-web-cov-09-admin-members-request-queue | 18 |
| 5 | ut-api-cov-10-public-route-branch | 18 |
| 6 | ut-api-cov-11-admin-requests-handler | 12 |
| 7 | ut-shared-cov-12-jobs-shared-branded-types | 8 |
| 8 | ut-int-cov-13-sync-integration-suite | 6 (integration delegation) |

## 主要変更ファイル

- `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md` — Status COMPLETED、§3〜§6 を実測値で埋め込み
- `docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-{04..12}/*.md` — 全 main.md / 各成果物の Status を COMPLETED 化
- `docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-05/coverage-summary-{web,api,packages}.json` — 計測 JSON
- `.claude/skills/aiworkflow-requirements/indexes/{topic-map.md,keywords.json}` — indexes 再生成
- `vitest.config.ts` — pnpm isolated linker での React 解決失敗を root `node_modules` alias + dedupe + `optimizeDeps.include` で修復（`react/jsx-dev-runtime` 等の subpath exports 解決）。本来 CONST_005 scope 外の修復だが、Phase 5 全 4 package coverage 計測の安定化に必須のため例外的に同 wave 内で適用。

## Canonical Inputs

| Input | Canonical Path |
| --- | --- |
| ut-web-cov-01 | `docs/30-workflows/completed-tasks/ut-web-cov-01-admin-components-coverage/` |
| ut-web-cov-02 | `docs/30-workflows/completed-tasks/ut-web-cov-02-public-components-coverage/` |
| ut-web-cov-03 | `docs/30-workflows/completed-tasks/ut-web-cov-03-auth-fetch-lib-coverage/` |
| ut-web-cov-04 | `docs/30-workflows/completed-tasks/ut-web-cov-04-admin-lib-ui-primitives-coverage/` |
| ut-08a-01 | `docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/` |

## Commands (実行済)

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
mise exec -- pnpm --filter @ubm-hyogo/shared test:coverage
mise exec -- pnpm --filter @ubm-hyogo/integrations test:coverage
mise exec -- pnpm indexes:rebuild
```
