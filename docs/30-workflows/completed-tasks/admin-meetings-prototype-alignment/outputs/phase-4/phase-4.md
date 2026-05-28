# Phase 4: Implementation Plan

## 4.1 タスク分割の根拠

CONST_007（1-cycle スコープ）を満たしつつ、関心ごとを分離するため 2 タスクに分割する:

- Task A: `/admin/meetings` list ページ全体（state owner / KPI / form / timeline / drawer）
- Task B: `/admin/meetings/[id]` detail ページ（既存 panel 群の primitive ラップ）

両タスクは共有 component を変更しないため並列実装可能。`MeetingPanel.tsx` 削除は Task A の責務。

## 4.2 実装順序（推奨）

並列実装する場合:
1. Task A の `meetingStats.ts` + spec を最初に固定
2. Task A の `MeetingsClientShell` 実装と並行して Task B の page.tsx 書き換えを進める
3. 両タスク完了後、同一 commit / 同一 PR で `dev` へ出す

直列実装する場合: A → B の順序を推奨（Task B の primitive ラッピング pattern が A で確立される）

## 4.3 実装境界の確認

- 本ワークフローは `implemented_local_evidence_captured / VISUAL_ON_EXECUTION` 状態であり、Task A/B の apps/web 実装、focused test/typecheck、primitive gate、local Playwright screenshot evidence は完了している。
- commit / push / PR と staging runtime recapture は user-gated として残す。ローカル evidence は `outputs/phase-11/screenshots/` と `outputs/phase-11/screenshot-coverage.md` を正本とする。
- staging 404 (`ADMIN_FETCH_404`) は本 workflow 範囲外として Phase 1.4 と unassigned task に分離済み。本タスクの完了条件は UI alignment 仕様と既存 API/DB 不変条件であり、auth gate 復旧を混ぜない。
