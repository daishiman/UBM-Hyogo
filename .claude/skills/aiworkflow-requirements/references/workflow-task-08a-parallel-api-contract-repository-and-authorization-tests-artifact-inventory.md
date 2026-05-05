# 08a-parallel-api-contract-repository-and-authorization-tests Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | 08a-parallel-api-contract-repository-and-authorization-tests |
| タスク種別 | implementation（apps/api 配下のテスト整備 / NON_VISUAL） |
| ワークフロー | Phase 1-10 completed / Phase 11-12 partial / Phase 13 pending（user approval 待ち） |
| canonical task root | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` |
| 旧 task root | `docs/30-workflows/02-application-implementation/08a-parallel-api-contract-repository-and-authorization-tests/`（2026-04-30 に新 root へ移動） |
| wave | 08 test wave（同 wave: 08b Playwright E2E / 09a staging smoke） |
| 実装日 | 2026-04-30 |
| owner | apps/api（API contract / repository / authz / brand type / invariants tests） |
| domain | API contract testing / repository testing / authorization matrix / brand 型 runtime / invariants assertion |
| visualEvidence | NON_VISUAL（UI route なし。API + Vitest evidence で成立） |
| depends_on | 04a（public API）/ 04b（member self-service API）/ 04c（admin API）/ 05a（admin gate）/ 07a/07b/07c（admin workflow APIs）/ 02b/02c（repository / audit_log） |
| follow-up wave | UT-08A-01〜06（public use-case coverage hardening / visual regression / production load test / D1 migration test guideline / shared package type test / test suffix rename）/ 08b（E2E）/ 09a（staging smoke） |

## Acceptance Criteria

詳細は `outputs/phase-07/main.md`（AC-1〜AC-6）を正本とする。要点:

- AC-1: `apps/api/src/repository/__tests__/` で per-table repository test を網羅（D1 binding 依存の正常 / 異常 / boundary）
- AC-2: `apps/api/src/__tests__/authz-matrix.test.ts` で role × resource × action の代表 matrix（公開 / 認証必須 / admin only の 3 層）を集約 assert、個別 endpoint は既存 route tests に委譲
- AC-3: `apps/api/src/__tests__/invariants.test.ts` で不変条件 #1 / #2 / #5 / #6 / #7 / #11 を集約 assert
- AC-4: `apps/api/src/__tests__/brand-type.test.ts` で `asResponseId` / `asResponseEmail` 等の brand 型の runtime 健全性を観測
- AC-5: API contract（zod schema × route handler × test 共有）で zod schema drift を遮断
- AC-6 **PARTIAL**: coverage gate Statements ≥85%（実測 84.18%、0.82pt 未達）→ UT-08A-01 で formalize

## Phase Outputs（current canonical set）

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1-10 | `outputs/phase-01/` 〜 `outputs/phase-10/` | 要件 / 設計 / 設計レビュー / テスト戦略 / 実装ランブック / 異常系 / AC マトリクス / DRY 化 / 品質保証 / 最終レビュー |
| 11 | `outputs/phase-11/` | NON_VISUAL manual smoke evidence。74 files / 442 tests PASS / 61.09s。`evidence/{test-run.log,coverage-report.txt,ci-workflow.yml}` で AC-6 PARTIAL を justify |
| 12 | `outputs/phase-12/` | `main.md` / `implementation-guide.md`（中学生レベル説明含む）/ `system-spec-update-summary.md` / `documentation-changelog.md`（path drift correction 節含む）/ `phase12-task-spec-compliance-check.md`（不変条件 #1〜#11 trace）/ `skill-feedback-report.md` / `unassigned-task-detection.md`（UT-08A-01〜06 formalize 一覧） |
| 13 | `outputs/phase-13/` | pending（user approval 待ち） |

## 主要実装物

### Cross-cutting tests（apps/api/src/__tests__/）

| ファイル | 役割 |
|---|---|
| `apps/api/src/__tests__/authz-matrix.test.ts` | 公開 / 認証必須 / admin only の 3 層代表 authz matrix を集約 assert。個別 endpoint の細かい分岐は既存 route tests に委譲 |
| `apps/api/src/__tests__/brand-type.test.ts` | `asResponseId` / `asResponseEmail` 等の brand 型の runtime 健全性を観測。型 narrow 関数 + zod refine の error code 同一性も検証 |
| `apps/api/src/__tests__/invariants.test.ts` | 不変条件 #1 / #2 / #5 / #6 / #7 / #11 を集約 assert。`describe('invariant #N: <意味>', ...)` 命名規約で検索性を担保 |

### Repository tests（apps/api/src/repository/__tests__/）

per-table repository test を D1 binding mock factory（`int-test-skill/references/d1-mock-factory-setup.md`）で網羅。各 repository の正常 / 異常 / boundary を観測。

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 変更履歴表 v1.32.0 行追加 + タスク種別別ガイドの 08a 行（既存） |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 08a 早見ブロックに UT-08A-02〜06 の 5 行追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 08a 行に Phase 12 close-out outputs / UT-08A-01〜06 follow-up / task root path drift 注記を追記 |
| `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md` | Task Root Path Drift Register 節を新設して 08a の旧→新 root を登録 |
| `.claude/skills/aiworkflow-requirements/lessons-learned/20260430-161419-task-20260430-161419-wt-6-08a-partial-close-out.md` | L-08A-001〜005（AC-6 coverage gate 構造的未達 / authz 集約境界 / invariants 集約粒度 / brand 型 runtime 観測 / task root path drift 残置検出） |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴に v2026.04.30-08a 行追加 |
| `.claude/skills/int-test-skill/references/api-contract-test-pattern.md` | 新規（Hono route × zod × fetch 型契約検証手順、配置規約、必須 assertion 群） |
| `.claude/skills/int-test-skill/references/authz-matrix-pattern.md` | 新規（role × resource × action 網羅 authz テスト pattern、代表 matrix vs 個別 route 委譲の判断基準） |
| `.claude/skills/int-test-skill/SKILL.md` | 概要に「`apps/api` の D1 binding 依存 repository test / Hono route contract test / authz matrix も対象」を追記、references 一覧に 2 ファイル追加 |
| `.claude/skills/task-specification-creator/references/phase-template-phase1.md` | Schema Ownership 節に「並列 wave で test file ownership も宣言。authz/invariants 等の cross-cutting test は wave 跨ぎで重複作成しない」1 行追記 |

## 実装で確定した値

- coverage 実測: Statements 84.18% / Branches 84.13% / Functions 83.37% / Lines 84.18%
- AC-6 gate: Statements ≥85% → 0.82pt 未達（PARTIAL）
- Test 構成: 74 files / 442 tests PASS / 0 fail / 61.09s
- 配置規約: cross-cutting test は `apps/api/src/__tests__/`、per-table repository test は `apps/api/src/repository/__tests__/`
- authz 集約境界: 公開 / 認証必須 / admin only の 3 層を `authz-matrix.test.ts` 1 ファイル集約、resource × action は route 個別 test に委譲
- invariants 集約: `describe('invariant #N: <意味>', ...)` 命名規約

## Follow-up 未タスク（formalize 済み）

| 未タスク ID | ファイル | 概要 |
|---|---|---|
| UT-08A-01 | `docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md` | 公開 use-case 直接観測点を `apps/api/src/__tests__/` に追加して AC-6 を満たす |
| UT-08A-02 | `docs/30-workflows/unassigned-task/UT-08A-02-visual-regression-coverage.md` | `apps/web` 公開ディレクトリ / 会員マイページの UI regression 監視（VISUAL / 低 / 中規模） |
| UT-08A-03 | `docs/30-workflows/unassigned-task/UT-08A-03-production-load-test.md` | Cloudflare Workers / D1 の production 環境負荷テスト（NON_VISUAL / 低 / 中規模） |
| UT-08A-04 | `docs/30-workflows/unassigned-task/UT-08A-04-d1-migration-test-guideline.md` | 新規 D1 migration 追加時の test 化ガイドライン（governance / 中 / 小規模） |
| UT-08A-05 | `docs/30-workflows/unassigned-task/UT-08A-05-shared-package-type-test.md` | `packages/shared` の `@ts-expect-error` 型テスト整備（NON_VISUAL / 中 / 小規模） |
| UT-08A-06 | `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md` | `*.test.ts` → `*.contract.spec.ts` 段階的 rename（refactor / 低 / 中規模） |

## Validation Chain

- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`
- `mise exec -- pnpm --filter @ubm-hyogo/api lint`
- `mise exec -- pnpm --filter @ubm-hyogo/api test -- --run`（74 files / 442 tests / 0 fail / 61.09s）
- `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage`（Statements 84.18% / Branches 84.13% / Functions 83.37% / Lines 84.18%）
- root / outputs `artifacts.json` parity（`docs/30-workflows/08a-.../artifacts.json`）
- `phase12-task-spec-compliance-check.md` 不変条件 #1〜#11 全項目 trace
- `pnpm indexes:rebuild` → `node scripts/validate-structure.js` で aiworkflow-requirements skill 構造検証
