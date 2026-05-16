# issue-324-shared-package-type-contracts

## メタ情報

| 項目 | 値 |
| --- | --- |
| GitHub Issue | #324 (UT-08A-05) |
| 状態 | implemented_local_evidence_captured / 実装仕様書 / NON_VISUAL |
| workflow | shared package type contract reinforcement |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Phase | 01-13 |
| Phase 13 | blocked_pending_user_approval |
| 元仕様書 | `docs/30-workflows/completed-tasks/UT-08A-05-shared-package-type-test.md` |
| 発見元 | `.claude/skills/aiworkflow-requirements/references/workflow-task-08a-parallel-api-contract-repository-and-authorization-tests-artifact-inventory.md` UT-08A-05 row |

## 目的

`packages/shared` の brand 型 / view-model schema に対する compile-time 型契約テストを vitest `expectTypeOf` と `@ts-expect-error` で固定し、消費側 (`apps/api` / `apps/web`) からの利用契約を回帰として保護する。Issue #324 の AC のうち、既に `packages/shared/src/types/ids.spec.ts` でカバー済の 2 件を除く未カバー 5 件を本タスクで実装する。

## 背景（既存資産との関係）

- `packages/shared/src/branded/index.ts` — brand 型の正本（MemberId / ResponseId / ResponseEmail / StableKey / SessionId / TagId / AdminId）。
- `packages/shared/src/types/ids.ts` — `branded` からの再 export 層。
- `packages/shared/src/types/ids.spec.ts` — 既存 9 件の `expectTypeOf` テスト（plain string→branded の代入禁止 / MemberId↔ResponseId 相互排他 / `BRANDED_KIND_LIST`）。
- `packages/shared/src/zod/viewmodel.ts` — view-model schema 群（`MemberProfileZ` / `PublicMemberListViewZ` / `PublicMemberProfileZ` / `AdminMemberListViewZ` / `AdminMemberDetailViewZ` / `AdminDashboardViewZ` / `SessionUserZ` / `AuthGateStateZ` 等）と `VIEWMODEL_PARSER_LIST`。
- `packages/shared/src/schemas/admin/admin-request-resolve.ts` — admin 専用 body schema（`adminRequestResolveBodySchema`）。
- `packages/shared/src/schemas/admin/tag-queue-resolve.ts` — admin 専用 schema 第 2 弾。

## 実行タスク

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 01 | `phase-01.md` | completed |
| 02 | `phase-02.md` | completed |
| 03 | `phase-03.md` | completed |
| 04 | `phase-04.md` | completed |
| 05 | `phase-05.md` | completed |
| 06 | `phase-06.md` | completed |
| 07 | `phase-07.md` | completed |
| 08 | `phase-08.md` | completed |
| 09 | `phase-09.md` | completed |
| 10 | `phase-10.md` | completed |
| 11 | `phase-11.md` | completed |
| 12 | `phase-12.md` | completed |
| 13 | `phase-13.md` | blocked_pending_user_approval |

## 成果物

| 成果物 | パス |
| --- | --- |
| 型契約テスト本体 | `packages/shared/src/__tests__/type-contracts.spec.ts` |
| Phase 07 evidence | `outputs/phase-11/evidence/shared-test.txt`（focused shared test evidence に統合） |
| Phase 11 evidence | `outputs/phase-11/main.md`, `outputs/phase-11/evidence/shared-typecheck.txt`, `outputs/phase-11/evidence/shared-lint.txt`, `outputs/phase-11/evidence/shared-test.txt` |
| Phase 12 strict outputs | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| 元 spec への close note | `docs/30-workflows/completed-tasks/UT-08A-05-shared-package-type-test.md` |

## 完了条件

- [x] `packages/shared/src/__tests__/type-contracts.spec.ts` が新規作成され、5 describe / 15 it block で AC-1..AC-5 をカバー。
- [x] `mise exec -- pnpm --filter @ubm-hyogo/shared test` が PASS（18 files / 210 tests）。
- [x] `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` が PASS（`@ts-expect-error` 行が「実際にエラー」を捕捉していることを tsc で保証）。
- [x] runtime コード変更なし（新規 test 1 ファイルのみ）。
- [x] `*.spec.ts` 命名 convention（不変条件 #8）に準拠（`*.test-d.ts` 不採用）。
- [x] Phase 12 strict 7 outputs を生成。
- [x] Phase 13 で commit / push / PR を作成せず user approval gate に止める。

## 不変条件

- 新規 endpoint / D1 schema / Google Form 仕様変更を行わない。
- D1 直接アクセスを追加しない。
- Cloudflare 系 CLI を呼ばない。
- `tsd` を導入しない（理由: 既存 `expectTypeOf` 資産との一貫性、turbo cache 共有、新規 dev 依存追加の回避）。
- vitest typecheck mode (`test.typecheck.enabled`) を導入しない（理由: `pnpm typecheck` が `.spec.ts` を含めて tsc --noEmit で検査済、二重化を避ける）。
