---
workflow_id: issue-911-meeting-attendance-unregister-ui-treat404-wiring
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-25
owner: daishiman
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: extend
implementation_status: local_evidence_captured
source_issue: https://github.com/daishiman/UBM-Hyogo/issues/911
parent_workflow: docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/
---

# issue-911 MeetingAttendancePanel 出席解除 UI + `treat404AsSuccess` 配線

**[実装区分: 実装仕様書]**

## 目的

`apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` に **出席解除 (unregister)** UI を追加し、解除 mutation に `useAdminMutation` の `treat404AsSuccess: { toast: "既に解除済みです" }` policy を配線する。これにより、複数管理者が同一の attendance を並行で解除した際の **DELETE-race**（既に他者が解除済 → 404 `attendance_not_found`）を **成功相当へ収束** させ、UI 上の `data-registered` state を `false` で確定する。

## 背景

- issue #911 起票時は「新規 DELETE attendance route を実装し `treat404AsSuccess` を caller へ配線する」設計を想定していた。
- しかし最新コードベースの実測（`apps/api/src/routes/admin/meetings.ts:200-249`）で **既存 POST `/api/admin/meetings/:id/attendances` endpoint は `attended: true` / `attended: false` の双方を実装済み**、`attended: false` 経路は `removeAttendance()` を呼び、unattended 状態に対して 404 `attendance_not_found` を返す挙動も完備していると判明した。
- 一方、`apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` は POST `attended: true` 専用で **解除 UI が存在しない**。これが根本問題である。
- `useAdminMutation` 側の `treat404AsSuccess: false | "silent" | { readonly toast: string }` policy は issue-842 で既に実装済み（line 30-31 / 47-48 / 240-246）。policy 側の追加実装は不要。
- 結論として、CLAUDE.md UI prototype alignment 不変条件 1（既存 API surface のみ）に従い **新 endpoint 追加を行わず**、UI 側に解除 button + 第 2 mutation を追加することで 1 サイクル完結（CONST_007）の最適解を採る。

## 実装サマリ

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-911-meeting-attendance-unregister-ui-treat404-wiring/` |
| 状態 | `implemented_local_evidence_captured` |
| 実装対象 | `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`（解除 button + unregister mutation 追加）、`apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx`（解除 UI 契約 + 404=成功相当 spec 追加） |
| 正本 source | `apps/web/src/features/admin/hooks/useAdminMutation.ts`（`treat404AsSuccess` policy 既実装）、`apps/api/src/routes/admin/meetings.ts:200-249`（POST `attended: false` 経路 + 404 既実装） |
| 主要変更 | UI に `data-testid="attendance-unregister"` button を 1 件追加、`unregisterMutation` を新規宣言、register mutation は無改変、spec に B1..B5 ケース追加 |
| API / D1 / auth boundary | `apps/api/**` 差分なし。D1 schema 変更なし。Google Form 仕様変更なし |
| runtime boundary | local typecheck / lint / vitest までを本サイクルで実施。staging deploy / smoke / commit / push / PR は user-gated |

## Phase 一覧

| Phase | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | completed |
| 2 | `outputs/phase-2/phase-2.md` | completed |
| 3 | `outputs/phase-3/phase-3.md` | completed |
| 4 | `outputs/phase-4/phase-4.md` | completed |
| 5 | `outputs/phase-5/phase-5.md` | completed |
| 6 | `outputs/phase-6/phase-6.md` | completed |
| 7 | `outputs/phase-7/phase-7.md` | completed |
| 8 | `outputs/phase-8/phase-8.md` | completed |
| 9 | `outputs/phase-9/phase-9.md` | completed |
| 10 | `outputs/phase-10/phase-10.md` | completed |
| 11 | `outputs/phase-11/phase-11.md` | completed |
| 12 | `outputs/phase-12/main.md` | completed |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 受入条件 (AC)

- AC-1: `MeetingAttendancePanel.tsx` に `data-testid="attendance-unregister"` button が registered=true の候補行に対してのみ可視化される（registered=false 行では非表示、または disabled）。
- AC-2: 解除 button click は `useAdminMutation(endpoint, "POST", { treat404AsSuccess: { toast: "既に解除済みです" }, refreshOnSuccess: false })` を経由し、`trigger({ memberId, attended: false })` を発火する。
- AC-3: 解除 200 OK で `registered` Set から該当 memberId を削除し、当該 `<li>` の `data-registered` 属性が `"false"` に反転、`toast` に `"出席を解除しました"` が表示される。
- AC-4: 解除 404 (`attendance_not_found`) で **エラー toast を出さず**、`treat404AsSuccess.toast` の `"既に解除済みです"` を表示、Set からも削除して `data-registered="false"` に収束する。
- AC-5: 解除 5xx / network error は既存 register mutation と同様に `登録に失敗 (status)` 系 toast で失敗扱いする（404 のみが特例）。
- AC-6: register mutation は無改変。POST `attended: true` の 404（session/member not found）は引き続き失敗扱いで `"開催日または会員が見つかりません"` toast を保つ。
- AC-7: 既存 spec A1..A8 は無改変で pass、追加 spec B1..B5 が全て pass。
- AC-8: `apps/api/**` および D1 schema に差分が出ていないことを `git diff --stat` で確認する。
- AC-9: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test -- MeetingAttendancePanel` がいずれも 0 fail。

## 4 条件 verdict

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | register / unregister は別 mutation で隔離。register 側 404 は失敗扱い継続、unregister 側 404 のみ成功相当に倒すため policy 適用範囲が衝突しない |
| 漏れなし | PASS | UI 改修 / mutation 追加 / spec 追加 / 既存 spec 互換 / API 不変 を全てスコープ化 |
| 整合性あり | PASS | `extend` モード / `NON_VISUAL` / `implemented_local_evidence_captured` の状態語彙で統一。`useAdminMutation.treat404AsSuccess` 既存 API と整合 |
| 依存関係整合 | PASS | API / D1 / auth handler 不変。UI の単独 PR で完結。staging deploy / smoke / PR は user-gated |

## 関連

- 親 workflow: `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`
- 既存実装参照: `apps/web/src/features/admin/hooks/useAdminMutation.ts` (`treat404AsSuccess` policy)
- 既存 API: `apps/api/src/routes/admin/meetings.ts:200-249` (POST `attended:true|false` 双方既実装)
- 元 issue: https://github.com/daishiman/UBM-Hyogo/issues/911
