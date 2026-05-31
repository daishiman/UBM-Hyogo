---
workflow_id: issue-988-identity-conflicts-merge-optimistic-update
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-29
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: docs/issue-988-identity-conflicts-merge-optimistic-update
issue: 988
issue_state: CLOSED
---

# Issue #988 — identity-conflicts merge confirm を optimistic update 化

## 実装区分

`[実装区分: 実装仕様書]`

本タスクはコード変更（`IdentityConflictRow.tsx` の state 機構追加 + focused vitest + Playwright）を伴う。
GitHub Issue #988 はラベル上 docs-only ではないが、念のため明記する: 目的（merge 操作直後に row を一覧から消す + server error 時 rollback）はコード変更なしでは達成不可能であり、CONST_004 の判定により実装仕様書として作成した。

## Issue 状態に関する注記

- **Issue #988 は実調査時点（2026-05-29）で `OPEN`**。ユーザー認識（「クローズド」）と GitHub 実状態が乖離していたため記録する。
- **2026-05-30 再照合時点では GitHub 上で `CLOSED`**。本移動処理では Issue 状態を変更しておらず、現在値のみメタ情報へ反映した。
- 本ワークフローの残 user-gate は commit / push / PR。

## 事前調査結論（実装済みか否か）

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| merge optimistic（操作直後に row 非表示） | **実装済み** | `IdentityConflictRow.tsx` に component-local `optimisticMerged` を追加し、`onMerge` 先頭で row を非表示化 |
| server error 時 rollback | **実装済み** | `trigger(...).catch` で `optimisticMerged=false` に戻し、既存 inline error を保持 |
| 他タスクで解決済みか | **未解決** | 直近 `#990`（identity-conflicts prototype alignment）は UI primitives 整合のみ。optimistic 化なし |

→ Issue #988 の実装内容は本サイクルで実コードと focused tests まで反映済み。

## 目的

`/admin/identity-conflicts` の merge 二段階 confirm 後、server round-trip 完了を待たずに該当 row を一覧から即座に非表示（optimistic update）にし、server エラー時のみ rollback で row を復元し inline error を表示する。dismiss 側挙動は不変。

## 設計方針（要点）

| 項目 | 決定 |
| --- | --- |
| optimistic state の所在 | **コンポーネントローカル**（`IdentityConflictRow` の `useState`）。`useAdminMutation` hook は変更しない |
| row の消し方 | `optimisticMerged === true` のとき component が collapsed（`null` 相当の非表示）を render。page.tsx は Server Component のまま維持 |
| rollback の per-id 保証 | 各 row が独立した component instance で自身の optimistic state を持つため、cross-row race（§6 の懸念）は構造的に発生しない |
| success 時 | `optimisticMerged` を true 維持。既存 `router.refresh()`（applySuccess）が server list を後追い整合 |
| error 時 | trigger の `.catch` で `optimisticMerged=false`（rollback）。既存 `mergeError` の inline 表示はそのまま surface |
| 不変条件 | 既存 API のみ（#1）/ legacy `@/lib/useAdminMutation` 不使用（#10）/ OKLch トークン正本（#2）/ admin form は FormField/primitive 経由（#9） |

## 実装対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集 | optimistic state 追加 + merge ハンドラ差し替え + collapsed render |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集 | optimistic hide / rollback / success-stays-hidden ケース追加 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 編集 | optimistic hide + rollback シナリオ追加 |

> API contract（`apps/api/src/routes/admin/identity-conflicts.ts`）・D1 schema・page.tsx（Server Component）は**一切変更しない**。

## Phase 一覧

| Phase | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | completed (spec) |
| 2 | `outputs/phase-2/phase-2.md` | completed (spec) |
| 3 | `outputs/phase-3/phase-3.md` | completed (spec) |
| 4 | `outputs/phase-4/phase-4.md` | completed (spec) |
| 5 | `outputs/phase-5/phase-5.md` | completed (spec) |
| 6 | `outputs/phase-6/phase-6.md` | completed (spec) |
| 7 | `outputs/phase-7/phase-7.md` | completed (spec) |
| 8 | `outputs/phase-8/phase-8.md` | completed (spec) |
| 9 | `outputs/phase-9/phase-9.md` | completed (spec) |
| 10 | `outputs/phase-10/phase-10.md` | completed (spec) |
| 11 | `outputs/phase-11/phase-11.md` | completed (local evidence + screenshots captured) |
| 12 | `outputs/phase-12/phase-12.md`（サマリ: `outputs/phase-12/main.md`） | completed |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 関連リソース

- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/988
- 発見元仕様: `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/unassigned-task-specs/admin-identity-conflicts-followup-002-merge-confirm-optimistic-update.md`
- 親サイクル: `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/`
- 既存実装: `apps/web/src/components/admin/IdentityConflictRow.tsx`
