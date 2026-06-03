---
workflow_id: issue-1043-identity-conflicts-row-fade-animation
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-02
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: docs/issue-1043-identity-conflicts-row-fade-animation-spec
issue: 1043
issue_state: CLOSED
---

# Issue #1043 — optimistic row 消失に fade animation を追加 (FU-AIDC-007)

## 実装区分

`[実装区分: 実装仕様書]`

本タスクはコード変更（`IdentityConflictRow.tsx` の exiting 相 state 追加 + Tailwind transition utility + focused Vitest + Playwright）を伴う。
issue ラベルは `type:improvement`（docs-only ではない）。目的「optimistic hide 時に短い fade / collapse で消える」はコード変更なしでは達成不可能であり、CONST_004 の判定により実装仕様書として作成した。

## Issue 状態に関する注記

- Phase 1 作成時点（2026-06-02）では GitHub 上 `OPEN` と記録していたが、その後 GitHub 側で **Issue #1043 は `CLOSED`**（closed 2026-06-01）。現在値 `CLOSED` をメタ情報へ反映した。
- ユーザー指示に従い、本ワークフローでは **Issue 状態を変更しない**（reopen も close もしない）。
- 本ワークフローは active workflow であり `completed-tasks/` への close-out 移動は行っていない（移動は別途 user-gated）。残 user-gate は commit / push / PR / Issue mutation。

## 事前調査結論（実装済みか否か）

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| optimistic row 消失の fade / collapse animation | **未実装** | `IdentityConflictRow.tsx:92` が `if (optimisticMerged) return null;` のまま即時除去 |
| 他タスクで解決済みか | **未解決** | 親 #988 は animation を意図的に scope 外として分離。兄弟 #1042（dismiss optimistic）は独立タスクで fade を巻き込まない |
| Issue 陳腐化 | **陳腐化なし** | `return null` 記述は現コードと一致。参照先 #988 の completed-tasks 移動・苦戦箇所の古い worktree パスのみ本仕様書で是正 |

→ Issue #1043 は実行が必要。本ワークフローで Phase 1-13 の実装仕様書を作成した（実装済み）。

## 目的

`/admin/identity-conflicts` の merge optimistic hide を、即時 `return null` から「短い fade / collapse による退場（exiting 相）→ DOM 除去（removed 相）」へ置き換える。`prefers-reduced-motion: reduce` では animation を抑制し、server error 時は exiting をキャンセルして row を復元する。dismiss 側挙動は不変。

## 設計方針（要点）

| 項目 | 決定 |
| --- | --- |
| state の所在 | **コンポーネントローカル**（`IdentityConflictRow` の `useState` / `useRef`）。`useAdminMutation` hook は変更しない |
| state 構成 | `stage`（既存・dialog）/ `optimisticMerged`（既存・removed 相 = `return null`）/ `isExiting`（新規・exiting 相 = fade 中で DOM 残存）/ `exitTimerRef`（新規・fallback timer） |
| 退場アニメ | Tailwind `transition-[opacity,transform] duration-200` + 条件付き `opacity-0`。removed への遷移は `transitionend` + timeout fallback の二重 |
| reduced-motion | globals.css グローバル `transition-duration: 0.001ms` + Tailwind `motion-reduce:transition-none` + timeout fallback の 3 重保証 |
| rollback | `trigger().catch` で `clearTimeout(exitTimerRef)` + `isExiting=false`。`mergeError` の inline 表示はそのまま surface |
| 不変条件 | 既存 API のみ（#1）/ OKLch token・HEX 禁止（#2）/ legacy hook 不使用（#10）/ design token gate 非抵触（新規 token・keyframes なし） |

## 実装対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集 | exiting 相 state + timer + transitionend handler + 条件付き fade class |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 編集 | exiting / removed / rollback-cancels-exiting / reduced-motion ケース追加・既存 2 ケース更新 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 編集 | animation 完了後の安定 DOM 状態を待つ + rollback シナリオ |

> API contract・D1 schema・page.tsx（Server Component）・`useAdminMutation`・`globals.css`・`tokens.css` は**一切変更しない**。

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
| 11 | `outputs/phase-11/phase-11.md` | completed (spec) |
| 12 | `outputs/phase-12/phase-12.md`（サマリ: `outputs/phase-12/main.md`） | completed (spec) |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 関連リソース

- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/1043
- 発見元仕様: `docs/30-workflows/unassigned-task/admin-identity-conflicts-followup-005-row-fade-animation.md`
- 親 workflow: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/`
- 兄弟 followup（dismiss optimistic）: `#1042`
- 既存実装: `apps/web/src/components/admin/IdentityConflictRow.tsx`
