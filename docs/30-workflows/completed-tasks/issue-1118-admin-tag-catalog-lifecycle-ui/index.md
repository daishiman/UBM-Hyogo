# issue-1118 — Admin tag catalog lifecycle UI（tag master 管理画面の新規構築 + 3 lifecycle 操作）

| 項目 | 値 |
|------|-----|
| workflow_id | `issue-1118-admin-tag-catalog-lifecycle-ui` |
| 元 Issue | [#1118](https://github.com/daishiman/UBM-Hyogo/issues/1118)（= `task-issue-1070-followup-002-admin-tag-lifecycle-ui`・**CLOSED 維持**） |
| 親 workflow | `issue-1070-tag-reactivate-physical-delete`（API 実装済み） |
| 実装区分 | **実装仕様書**（`[実装区分: 実装仕様書]`・CONST_004 デフォルト） |
| implementation_mode | `new`（新規 UI 構築） |
| 視覚証跡 | **VISUAL**（管理画面の新規構築・Phase 11 screenshot はuser-gated runtime/staging cycle で取得） |
| status | `implemented_local_evidence_captured`（apps/web 実装・focused tests・typecheck 完了。runtime/staging screenshot・commit・PR は user-gated） |
| priority / scale | 中 / 中規模 |

---

## 0. このタスクの実装区分判定（CONST_004）

`[実装区分: 実装仕様書]`。本タスクは admin 管理画面を新規に構築し、3 つの lifecycle 操作を既存 API へ配線する **コード実装を伴うタスク**である。ユーザー指定の docs-only ラベルは無く、目的（「管理者が画面上で tag を棚に戻す/しまう/完全削除できる」）はコード変更なしに達成不可能。よって実装仕様書として作成し、CONST_005 の必須項目（変更対象ファイル・関数シグネチャ・入出力・テスト方針・ローカル実行コマンド・DoD）を Phase 1-13 で埋める。

automation-30 / CONST_004・CONST_005 により、本サイクルで仕様書作成に留めず **実コードへ同一 wave 実装**した。runtime/staging screenshot 取得・commit・push・PR のみ user-gated として残す。

---

## 1. issue 陳腐化と現コード最適化（最重要）

Issue #1118 は「**既存の** admin tag master UI（tag 一覧 / tag 行 / 論理削除導線）に lifecycle 操作を**追加する**」前提で書かれていたが、2026-06-06 の現コード調査で前提が崩れていることが判明した:

| issue の前提 | 現コードの実態 |
|--------------|----------------|
| 既存の admin tag master 一覧/行 UI がある | **存在しない**。`/admin/tags` は `TagQueuePanel`（member-tag 付与 **queue** 画面）であり tag_definitions master 画面ではない。tag_definitions は member-drawer / bulk-action の picker 内にしか現れない |
| 論理削除導線（#1035 land 済み） | **apps/web に存在しない**。#1035 は API のみ land。`DELETE /admin/tags/:tagId` を apps/web から呼ぶ箇所は 0 件 |
| #1068 inline-create UI が tag master 管理画面 | `MemberTagInlineCreate` は **member-drawer 内の inline-create** であり master 管理画面ではない |
| reactivate / physical / referenceCount UI | 仕様作成前の調査時点では apps/web に 0 hit。automation-30 改善で本 workflow により実装済み |

→ **根本問題は「ボタンを足す」ではなく「lifecycle 操作を載せる土台（tag master catalog 画面）が無い」こと**。ユーザー判断（2026-06-06 AskUserQuestion =「専用画面を新規構築」）に基づき、本仕様は **新規 `/admin/tags/catalog` 画面を構築し、その上に 3 lifecycle 操作を配線する**方向へ最適化した。土台 API（`GET /admin/tags`）と 3 mutation endpoint は既に存在し変更不要。

---

## 2. 受け入れ基準（現コード最適化後）

| ID | 受け入れ基準 |
|----|--------------|
| AC-0 | **新規** route `/admin/tags/catalog` が存在し、`GET /admin/tags`（q/page/pageSize）を消費して tag_definitions（code/label/category/active）を一覧表示する |
| AC-1 | 論理削除済み（active=false）の tag 行から reactivate を呼べ、成功後に active 状態と一覧が即時反映される（`POST /admin/tags/:tagId/reactivate` 200 row） |
| AC-2 | active な tag 行から physical delete を呼べ、実行前に **不可逆である旨を明示した確認ダイアログ**が表示され、確認操作なしには削除されない（`ConfirmDialog` `isDestructive`） |
| AC-3 | physical delete が 409 `tag_has_references` を返した場合、`referenceCount` を「使用中のため削除不可（N 人に使用中）」の形で UI に表示する |
| AC-4 | reactivate / 論理削除 / physical delete の 3 操作が UI 上で視覚的・文言的に区別され、混同して誤操作できない |
| AC-5 | 既存の `/admin/tags`（TagQueuePanel）・member-drawer / bulk-action の tag picker が退化しない（非退化・新規 route の additive 追加） |
| AC-6 | reactivate 冪等（既に active な tag への reactivate）が UI でエラー扱いされず、状態が静かに維持される（200 + 現 row） |
| AC-7 | 404 `tag_not_found`（既に削除された tag への操作）が読める形のエラーとして表示され、操作が詰まらない |
| AC-8 | desktop / mobile の双方で lifecycle 操作部品・確認ダイアログ・409 referenceCount 表示が崩れず重ならない |
| AC-9 | 色は OKLch トークン正本（`tokens.css` / `globals.css`）のみ。HEX 直書き・`bg-[#xxx]` 禁止（`verify-design-tokens` gate 合格） |

---

## 3. Phase 一覧

| Phase | 名称 | 成果物 |
|-------|------|--------|
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
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント同期 | `outputs/phase-12/main.md` ほか strict 7 |
| 13 | commit / PR | `outputs/phase-13/phase-13.md`（**user-gated**） |

---

## 4. スコープ

### 含む
- 新規 `/admin/tags/catalog` 画面（Server Component page + client `TagCatalogPanel` + `TagCatalogRow` + pure `tagCatalogLifecycle.ts`）
- 3 lifecycle 操作（reactivate / 論理削除 / physical delete）の配線と視覚的・文言的区別
- 409 `tag_has_references` の `referenceCount` 表示・404 / 冪等 no-op の UI state
- admin sidebar nav への `/admin/tags/catalog` 導線追加
- focused component / pure helper / shell nav regression test の実装と実行
- VISUAL screenshot の取得計画（runtime/staging 取得は user-gated）

### 含まない
- API・D1 schema・Google Form 仕様の変更（既存 endpoint surface のみ消費・不変条件 #1/#4）
- physical delete 参照あり時の強制移行 migration（別タスク・#1070 followup-001 / unassigned U-1）
- `member_tags` への DB FK 追加評価（別タスク・#1070 followup-003 / unassigned U-3）
- API・D1 schema・Google Form 仕様の変更
- runtime/staging screenshot 取得・commit・push・PR（user-gated）

---

## 5. 参照
- Issue #1118 / #1070（API contract）/ #1035（logical delete API）/ #1068（inline-create）
- API: `apps/api/src/routes/admin/tags.ts`（GET /tags, POST /tags/:id/reactivate, DELETE /tags/:id, DELETE /tags/:id/physical）
- 足場: `apps/web/app/(admin)/admin/tags/page.tsx`, `src/components/admin/TagQueuePanel.tsx`, `src/features/admin/hooks/useAdminMutation.ts`, `src/components/ui/ConfirmDialog.tsx`, `src/lib/admin/safe-server-fetch.ts`, `src/features/admin/components/_layout/AdminPageHeader.tsx`
- token: `apps/web/src/styles/tokens.css`, `globals.css`（`admin-tag-status-badge[data-status]` L1124）
