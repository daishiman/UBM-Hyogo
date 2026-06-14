---
workflow_id: admin-meetings-card-ux-clarity
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-10
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: feat/admin-meetings-card-ux-clarity
relatedIssue: null
---

# Admin Meetings — カード/展開編集/出席者一覧の視覚情報設計改善

## 目的

staging `/admin/meetings`（開催日管理）の UI/UX を、UI/UX エンジニアとして直感的に改善する。ユーザー報告:「カードがくっついている / 色が見にくい / カードがめちゃくちゃ見にくい / 触りにくい / 何がしたいか直感的に分からない」（色は今回スコープ外と明示）。

**真因 = apps/web 表現層の視覚情報設計欠如のみ**。マークアップに存在する `.admin-timeline*` / `.admin-meeting-drawer` / `.ui-card--flat` の **CSS 実体が無く**、開催日カードの見出し・展開ドロワー・出席者行がブラウザ既定スタイルのまま描画され、視覚階層が崩壊している。API（`apps/api/src/routes/admin/meetings.ts` / `attendance.ts`）/ D1 / Google Form は無罪。

## 実装サマリ

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/admin-meetings-card-ux-clarity/` |
| 状態 | `implemented_local_evidence_captured`（apps/web 実装 + local validation PASS。staging screenshot / commit / PR は user-gated） |
| 実装区分 | `[実装区分: 実装仕様書]`（VISUAL UI task / CONST_004 デフォルト） |
| 変更対象 | F1 `apps/web/src/styles/globals.css`、F2 `MeetingAttendanceDrawer.tsx`、F3 `MeetingTimeline.tsx`、T1/T2 対応 spec、既存未定義 token 参照の `border-default` 収束 |
| API contract | `apps/api/src/routes/admin/meetings.ts` / `attendance.ts` を一切変更しない（`git diff dev -- apps/api` 空が AC） |
| token 正本 | `apps/web/src/styles/tokens.css`（OKLch / spacing / radius / shadow）。HEX 直書き禁止・`verify:tokens` green |
| runtime boundary | local typecheck / lint / vitest / verify:tokens は本 wave で PASS。staging deploy / screenshot / commit / push / PR は Phase 13 (user-gated) |

## スコープ決定（AskUser 確定）

- 展開方式: **カード内インライン展開を維持**（右ドロワー化しない）し、各セクションを見出し付きサブカードで整理。
- 実装範囲: **再利用可能な admin 詳細セクション/行 primitive を新設**し、今回は `/admin/meetings` に適用して完結。他 admin 画面への DOM 適用は **同 primitive を使う別タスク**（未タスク OOS-1）。理由＝各画面で DOM/テストが異なり 1 PR では CONST_007 抵触。
- 出席者: **見やすい行リスト**に整える。
- 色: 今回スコープ外（既存 OKLch トークン範囲のみ・OOS-2）。

## Phase 一覧

| Phase | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | completed (spec) |
| 1 | `outputs/phase-1/spec-extraction-map.md` | completed (spec) |
| 2 | `outputs/phase-2/phase-2.md` | completed (spec) |
| 3 | `outputs/phase-3/phase-3.md` | completed (spec) |
| 4 | `outputs/phase-4/phase-4.md` | completed (spec) |
| 5 | `outputs/phase-5/phase-5.md` | completed (spec) |
| 6 | `outputs/phase-6/phase-6.md` | completed (spec) |
| 7 | `outputs/phase-7/phase-7.md` | completed (spec) |
| 8 | `outputs/phase-8/phase-8.md` | completed (spec) |
| 9 | `outputs/phase-9/phase-9.md` | completed (spec) |
| 10 | `outputs/phase-10/phase-10.md` | completed (spec) |
| 11 | `outputs/phase-11/phase-11.md` | completed (spec) — runtime evidence pending (user-gated) |
| 12 | `outputs/phase-12/main.md` | completed (spec) |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 4 条件 verdict

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | API/D1/Form 不変。表現層 CSS + wrapper のみ。token 正本に整合 |
| 漏れなし | PASS | カード分離 / 展開階層 / 出席者行の3課題を F1-F3 で網羅。DoD で検証 |
| 整合性あり | PASS | 既存 BEM 実体化 + 汎用 primitive 最小新設。invariant #3/#9/#10 準拠 |
| 依存関係整合 | PASS | apps/web 単独完結。staging/visual/commit は user-gated 分離 |

## Spec-extraction (route owner / handoff / state owner / view)

詳細は `outputs/phase-1/spec-extraction-map.md` 参照。要約:

| 系統 | owner | 場所 |
| --- | --- | --- |
| route 定義 | apps/api | `apps/api/src/routes/admin/meetings.ts` / `attendance.ts`（不変） |
| state owner (client) | apps/web | `MeetingsClientShell.tsx`（meetings / attended / selectedId / toast） |
| view (一覧) | apps/web | `MeetingTimeline.tsx` |
| view (展開編集) | apps/web | `MeetingAttendanceDrawer.tsx` + `BulkAttendanceChecklist.tsx` / `BulkAttendanceModal.tsx` |
| style 正本 | apps/web | `apps/web/src/styles/globals.css` / `tokens.css` |

## SSOT

設計の前提・決定・CSS 契約・DOM 改修・DoD は `shared-context.md` を正本とする。
