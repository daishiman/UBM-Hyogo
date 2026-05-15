# Workflow Artifact Inventory: issue-667-stage3b-mock-api-fixture-coverage

| 項目 | 値 |
|------|-----|
| workflow root | `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/` |
| state | `implemented_local_runtime_pending` |
| source unassigned task | `docs/30-workflows/completed-tasks/task-e2e-stage3b-mock-api-fixture-coverage-001.md` (formalize 移動済み) |
| branch | `feat/issue-667-stage3b-mock-api-fixture-coverage` |
| parent stage | E2E quality uplift Stage 3B (mock API fixture coverage) |
| lessons-learned | `references/lessons-learned-issue-667-stage3b-mock-api-fixture-coverage-2026-05.md` (L-667-001..004) |

## Workflow Artifacts

| path | role | state |
|------|------|-------|
| `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/artifacts.json` | workflow root artifacts manifest | runtime_pending |
| `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/phase-1.md` .. `phase-13.md` | Phase 1-13 specs | Phase 1-12 completed / Phase 13 blocked on runtime |
| `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/outputs/phase-11/` | focused local evidence | present |
| `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/outputs/phase-11/evidence/dispatcher-grep.txt` | dispatcher 順序 grep gate evidence | present |
| `docs/30-workflows/completed-tasks/issue-667-stage3b-mock-api-fixture-coverage/outputs/phase-12/` | strict close-out outputs | present |

## Implementation Artifacts

| path | role |
|------|------|
| `packages/contracts/` | `@ubm-hyogo/contracts` パッケージ新設（zod-only / plain ESM `.mjs`） |
| `packages/contracts/src/index.mjs` | barrel re-export entry |
| `packages/contracts/src/{me,public,admin,identity-conflicts,fixtures}.mjs` | named export schemas + fixtures |
| `scripts/e2e-mock-api.mjs` | mock API runtime。`safeJson(res, status, body, schema)` ラッパーで全業務 endpoint 強制 parse、parse 失敗で HTTP 500 + `zodIssues`。dispatcher 順序は exact-match → regex → startsWith。`/health` と `/__test__/*` のみ parse 例外境界 |
| `scripts/__tests__/e2e-mock-api.contract.spec.ts` | contract test (28 tests PASS / local) |
| `.github/workflows/ci.yml` | `Mock API contract tests` step を追加 |
| `.github/workflows/e2e-tests.yml` | curl readiness wait (30s max) + mock API log artifact (retention 7d) |
| `apps/api/package.json` / `apps/web/package.json` | `@ubm-hyogo/contracts` を依存に追加 |

## Canonical reference set

本 workflow が依拠する既存 references（実在確認済み）:

- `references/testing-fixtures.md`
- `references/quality-e2e-testing.md`
- `references/testing-playwright-e2e.md`
- `references/workflow-issue-504-extended-fixture-50k-artifact-inventory.md`
- `references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md`
- `references/workflow-e2e-stage-2-2d-contract-artifact-inventory.md`

## New SSOT introduced

- `@ubm-hyogo/contracts` パッケージは mock (`scripts/e2e-mock-api.mjs`) / `apps/api` / `apps/web` / playwright tests が共通参照する schema 正本。zod-only 依存 + plain ESM `.mjs` + barrel 経由 named export という topology を Phase 1 で確定済み（`[[contracts-package-ssot]]`）。
- `scripts/e2e-mock-api.mjs` の dispatcher は exact-match → regex → startsWith という固定順序を持ち、新規 endpoint 挿入時の混入順制約を grep gate で検証する（`[[mock-api-dispatcher-pattern]]`）。

## Cross-link

- `[[contracts-package-ssot]]`
- `[[mock-api-dispatcher-pattern]]`
- `[[lessons-learned-issue-667-stage3b-mock-api-fixture-coverage-2026-05]]`
- `[[testing-fixtures]]`
- `[[quality-e2e-testing]]`
- `[[testing-playwright-e2e]]`
- `[[workflow-issue-504-extended-fixture-50k-artifact-inventory]]`
- `[[workflow-e2e-quality-uplift-stage-0-3-artifact-inventory]]`
- `[[workflow-e2e-stage-2-2d-contract-artifact-inventory]]`

## Boundary

This inventory registers local implementation and focused local evidence only. It does **not** claim:

- GitHub Actions runtime evidence (CI green on PR)
- commit / push / PR creation
- GitHub Issue mutation (label / comment / close)
- D1 schema change, new API endpoint, Cloudflare deploy, or secret rotation

Runtime evidence transition (`implemented_local_runtime_pending` → `completed`) requires GitHub Actions の `Mock API contract tests` step と `e2e-tests` job が PR で green になることをもって行う。
