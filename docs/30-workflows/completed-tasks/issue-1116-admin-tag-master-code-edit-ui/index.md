# issue-1116 admin tag master code edit UI — タスク仕様書（Phase 1-13）

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。
> 本ディレクトリは Issue #1116「admin tag master code edit UI 導線」（= `task-issue-1069-followup-001`）の
> Phase 1-13 実装仕様書一式 + local implementation evidence。CONST_004/005 に基づき、本サイクルで apps/web 実装まで完了。

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | `TASK-ISSUE-1116-ADMIN-TAG-MASTER-CODE-EDIT-UI` |
| issue | [#1116](https://github.com/daishiman/UBM-Hyogo/issues/1116)（**CLOSED**・2026-06-06 時点・本仕様書では状態変更しない / `Refs #1116` のみ） |
| recovered_from_unassigned | `docs/30-workflows/unassigned-task/task-issue-1069-followup-001-admin-tag-code-edit-ui.md` |
| 親タスク | `issue-1069-tag-code-rename`（completed・API 本体） |
| taskType | implementation |
| visualEvidence | VISUAL（admin 新規ページ・スクリーンショット証跡あり） |
| implementation_mode | new |
| workflow_state | implemented_local_evidence_captured |
| spec_creation_strategy | optimize_to_current_codebase |
| canonical_root | `docs/30-workflows/completed-tasks/issue-1116-admin-tag-master-code-edit-ui` |

## 実装区分の判定根拠（CONST_004）

Issue #1116 の達成条件「admin tag master の `code` を UI から安全に編集できる**導線を作る**」は、
新規 admin ルート・client component・web API client・sidebar nav 配線という **apps/web の実コード追加なしには達成不可能**。
よって docs-only ではなく **実装タスク**として実コードまで同一 wave で反映した。

## CLOSED Issue 鮮度調査（issue は古い前提を含む）

- **根本問題**: admin が tag master の `code` を UI から修正する導線が無い。API（`PATCH /admin/tags/:tagId` の code/expectedCode）は issue-1069 で完備だが、operator が叩く画面が存在しない。
- **issue の「`/admin/tags` を master CRUD に使う」前提は陳腐化**: 現コードで `/admin/tags` は tag QUEUE（`shell-config.ts:82` / nav `tag-queue`）。`isNavItemActive` の prefix 一致により**子ルートにすると nav 衝突**するため、sibling ルート `/admin/tag-master` を新設する。
- 詳細な鮮度調査 2 表は `outputs/phase-1/phase-1.md` §1.3。最適化方針は `artifacts.json` の `issue_optimization_note`。

## スコープ

### 含む
- 新規 admin ルート `/admin/tag-master`（server component・既存 `safeServerFetch('/admin/tags?...')` 再利用）
- `TagMasterPanel`（一覧 + 行選択）/ `TagMasterEditForm`（code/label/category 編集・`expectedCode` 保持・409 分離表示）
- web API client `updateTag(tagId, ...)` + error code 分離（`tag_code_conflict` / `tag_stale_conflict`）
- sidebar nav 配線（`shell-config.ts` / `icons.tsx`）
- focused component / API client test + authenticated visual evidence spec

### 含まない（先送りでなく別スコープ）
- API rename 実装（issue-1069 完了）・`apps/api` 変更（不変条件 #1 / #7）
- tag 物理削除 / reactivate UI（issue-1070 で API のみ存在）
- member drawer inline-create UI（`task-issue-1035-followup-001`）
- commit / push / PR / staging deploy / authenticated visual capture / Issue 状態変更（全 user-gated）

## Phase 一覧

| Phase | 名称 | canonical output |
| --- | --- | --- |
| 1 | 要件定義 | `outputs/phase-1/phase-1.md` |
| 2 | 設計 | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー | `outputs/phase-3/phase-3.md` |
| 4 | テスト作成 | `outputs/phase-4/phase-4.md` |
| 5 | 実装 | `outputs/phase-5/phase-5.md` |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト | `outputs/phase-11/phase-11.md` |
| 12 | ドキュメント同期 | `outputs/phase-12/main.md` |
| 13 | commit-pr-release | `outputs/phase-13/phase-13.md` |

## 不変条件チェックリスト

- [x] 不変条件 #1: 既存 API endpoint surface のみ利用（`apps/api` 変更なし）
- [x] 不変条件 #2: 色は OKLch token（HEX 直書き / `bg-[#xxx]` 禁止）
- [x] 不変条件 #5: `apps/web` から D1 binding 直接アクセス禁止
- [x] 不変条件 #9: admin form input は `FormField` 経由
- [x] 不変条件 #10: admin mutation は `@/features/admin/hooks/useAdminMutation` 経由

## Local evidence

- focused Vitest: `pnpm exec vitest run apps/web/src/features/admin/api/__tests__/tags.update.spec.ts apps/web/src/features/admin/components/_tags/__tests__/TagMasterPanel.spec.tsx apps/web/src/components/shell/__tests__/shell-config.spec.ts` → PASS（3 files / 19 tests）
- typecheck: `pnpm --filter @ubm-hyogo/web typecheck` → PASS
- lint: `pnpm --filter @ubm-hyogo/web lint` → PASS
- design tokens: `pnpm verify:tokens` → PASS
- inline style gate: `pnpm verify:no-inline-style` → PASS

Authenticated staging visual capture、commit、push、PR、Issue mutation は user-gated。
