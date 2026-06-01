---
workflow_id: issue-1042-dismiss-confirm-optimistic-update
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-01
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: feat/issue-1042-dismiss-optimistic-update-spec
issue: 1042
issue_state: OPEN
---

# Issue #1042 — identity-conflicts dismiss confirm を optimistic update 化 (FU-AIDC-006)

## 実装区分

`[実装区分: 実装仕様書]`

本タスクはコード変更（`IdentityConflictRow.tsx` の dismiss 専用 optimistic state 追加 + focused vitest + Playwright）を伴う。
GitHub Issue #1042 はラベル上 docs-only ではないが、CONST_004 に従い明記する: 目的（dismiss 実行直後に row を一覧から消す + server error 時 rollback）はコード変更なしでは達成不可能であり、実装仕様書として作成した。

## Issue 状態に関する注記（ユーザー認識との乖離）

- ユーザー指示では「Issue #1042 はクローズド」とされていたが、**実調査時点（2026-06-01）で GitHub 上の実状態は `OPEN`**。
- 本ワークフロー作成では Issue 状態を**一切変更していない**（mutation は user-gated）。`issue_state: OPEN` は現在値の記録のみ。
- ユーザー指示「クローズドのままタスク仕様書を作成する」を尊重し、reopen / close いずれの操作も行わない。状態変更が必要なら Phase 13 で user 承認後に実施する。

## 事前調査結論（他タスクで解決済みか / コード実装完了済みか）

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| merge optimistic（操作直後に row 非表示 + rollback） | **実装済み（#1046 で完了）** | `IdentityConflictRow.tsx:29,65,71,92` に `optimisticMerged` あり。commit `f6faeb005`（PR #1046） |
| **dismiss optimistic（本 Issue #1042 の主題）** | **実装済み（本サイクルで完了）** | `IdentityConflictRow.tsx` に `optimisticDismissed` state を追加し、`onDismiss` は trigger 前に optimistic 非表示化、reject 時に rollback する。render guard は `optimisticMerged || optimisticDismissed` |
| dismiss optimistic の component test | **実装済み（本サイクルで完了）** | `IdentityConflictRow.spec.tsx` に optimistic hide / success-stays-hidden / rollback + reason 保持 / rollback 後再実行 / dismiss→merge 非干渉を追加 |
| dismiss optimistic の Playwright | **実装済み（本サイクルで完了）** | `admin-identity-conflicts.spec.ts` に dismiss optimistic row 消失と rollback + inline error + reason 保持の focused E2E を追加し、Phase 11 screenshot 2 PNG を保存 |
| 他タスクで解決済みか | **未解決** | #1046 は merge 側のみ。dismiss 側は #988 スコープ判断で意図的に除外され、本 #1042（FU-AIDC-006）へ後続化された |

→ **結論: Issue #1042 は不要ではない。dismiss optimistic 化は現行コードに未実装だったため、本サイクルで実装・focused Vitest・Playwright・screenshot evidence まで完了した。** Issue 本文の想定 surface・受け入れ基準は現行コードと整合しており陳腐化していない（参照 path は `IdentityConflictRow.tsx` / spec.tsx / Playwright spec で実在）。

## 目的

`/admin/identity-conflicts` の dismiss（別人マーク）confirm 実行後、server round-trip 完了を待たずに該当 row を一覧から即座に非表示（optimistic update）にし、server エラー時のみ rollback で row を復元し inline error / dismiss 理由入力値を保持する。merge 側挙動・既存 payload / endpoint contract は不変。

## 設計方針（要点）

| 項目 | 決定 |
| --- | --- |
| optimistic state の所在 | **コンポーネントローカル**（`IdentityConflictRow` の `useState<boolean>`）。`useAdminMutation` hook は変更しない（merge と同方針） |
| state 分離 | `optimisticMerged` とは**別の** `optimisticDismissed` を持つ。merge / dismiss の rollback 責務を混在させない（Issue 苦戦箇所の知見） |
| row の消し方 | render guard を `if (optimisticMerged || optimisticDismissed) return null;` に統合。state 自体は分離したまま、可視性条件だけ合流 |
| dismiss 実行 | `onDismiss` で `dismissMutation.trigger()` より前に `setOptimisticDismissed(true)` |
| rollback | `.catch(() => setOptimisticDismissed(false))`。`dismissReason` は clear しない（理由入力保持） |
| success 時 | `optimisticDismissed` を true 維持。既存 `router.refresh()`（applySuccess）が server list を後追い整合 |
| per-id 保証 | 各 row が独立 component instance で自身の optimistic state を持つため cross-row race は構造的に発生しない |
| 不変条件 | 既存 API のみ（不変条件 #1）/ legacy `@/lib/useAdminMutation` 不使用（#10）/ OKLch トークン正本（#2）/ admin form は FormField/primitive 経由（#9）/ `apps/web` から D1 直接アクセス禁止（#5） |

## 実装対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集 | `optimisticDismissed` state 追加 + `onDismiss` 差し替え + render guard 統合 |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集 | dismiss optimistic hide / rollback / success-stays-hidden ケース追加。merge 既存ケースは不変 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 編集 | dismiss optimistic hide + rollback シナリオ追加。既存「成功系: dismiss」は強化または別ケース化 |

> API contract（`apps/api/src/routes/admin/identity-conflicts.ts`）・D1 schema・`page.tsx`（Server Component）・`useAdminMutation` hook は**一切変更しない**。

## スコープ（CONST_007: 1 サイクル完了可能）

- **含む**: dismiss optimistic state 追加 / focused vitest 追加 / Playwright dismiss optimistic + rollback 証跡追加。すべて 03.実装.md の 1 サイクルで完了可能。
- **含まない（先送りではなく構造的別件）**: fade animation（別 Issue `admin-identity-conflicts-followup-005-row-fade-animation` に分離済み・本 Issue 本文で明記）。これは UX 拡張であり dismiss optimistic の達成に不要。

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
| 11 | `outputs/phase-11/phase-11.md` | completed（focused Vitest + Playwright + screenshot 2 PNG captured） |
| 12 | `outputs/phase-12/phase-12.md` | completed (spec) |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 関連リソース

- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/1042
- 親 Issue / 発見元: https://github.com/daishiman/UBM-Hyogo/issues/988（merge optimistic、#1046 で実装済み）
- merge 側実装 PR: #1046（commit `f6faeb005`）
- merge 側 workflow: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/`
- 既存実装: `apps/web/src/components/admin/IdentityConflictRow.tsx`
