# Phase 11: Evidence 収集

## 実装サマリ

- 区分: implementation（コード変更を伴う）
- 完了日: 2026-05-20
- 状態: implemented_local_evidence_captured

## コード変更

- `MeetingAttendancePanel.tsx`: 生 `fetch` を `useAdminMutation` へ統一。409 / 422 / 404 / 5xx を文脈別 toast に分岐。
- `MeetingPanel.tsx`: 出席解除 / 開催日 soft delete を `ConfirmDialog` 経由に変更。解除済み 404 は成功相当として UI から除去。
- `useConfirmDialog.ts`: note validation、submit orchestration、二重 submit guard を実装。
- `ConfirmDialog.tsx`: `role=dialog` / `aria-modal` / `useId` / focus trap / focus restore / ESC / backdrop を実装。
- `components/ui/index.ts`: `ConfirmDialog` を barrel export。
- Playwright attendance smoke: confirm dialog flow と screenshot capture を更新。

## 検証ログ

| 項目 | 結果 | Evidence |
| --- | --- | --- |
| `pnpm typecheck` | PASS | `evidence/typecheck.log` |
| `pnpm lint` | PASS | `evidence/lint.log` |
| focused Vitest | PASS: 4 files / 52 tests | `evidence/test.log` |
| design token gate | PASS: 9 tests | `evidence/design-tokens.log` |
| grep gate | PASS | `evidence/grep-gate.log` |
| root `pnpm build` | FAIL: local env missing | `evidence/build.log` |
| web local build with explicit env | PASS | `evidence/build-web-local.log` |
| attendance Playwright smoke | PASS: 5 tests | `evidence/e2e-attendance.log` |

## スクリーンショット

| # | Path | 内容 |
| --- | --- | --- |
| 1 | `screenshots/01-meetings-list.png` | meetings list before destructive action |
| 2 | `screenshots/02-confirm-remove.png` | 出席解除 confirm dialog |
| 3 | `screenshots/03-confirm-delete-meeting.png` | 開催日 soft delete confirm dialog |
| 4 | `screenshots/04-attendance-registered.png` | detail registered state |
| 5 | `screenshots/05-toast-duplicate.png` | duplicate attendance toast |

## 残境界

Staging / production smoke、commit、push、PR は Phase 13 user gate のまま。
