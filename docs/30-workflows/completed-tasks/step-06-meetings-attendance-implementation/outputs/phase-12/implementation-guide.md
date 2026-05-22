# Implementation Guide

## Part 1: 中学生レベル

出席をつける管理画面で、削除ボタンを押したときに「本当に削除していい？」を確認する小窓を出す。
これは、学校の出席簿で名前を消す前に先生がもう一度確認するのと同じで、うっかり間違えて消すことを防ぐため。

同じ仕組みは「申請を承認する / 却下する」画面でも次に使いまわす予定なので、`useConfirmDialog`
という再利用できる部品として作る。

別の画面では、これまでそれぞれの画面がばらばらにサーバーへお願いを送っていたが、共通の
`useAdminMutation` 経由に統一する。これでエラーが起きたときの表示やログイン切れの対応が画面全体で同じになる。

実装後の画面は Phase 11 で撮影済み。開催日一覧、出席解除の確認小窓、開催日削除の確認小窓、出席登録済み状態、重複登録のお知らせを確認できる。

### 専門用語セルフチェック

| 用語 | 言い換え |
| --- | --- |
| hook | 画面の動きをまとめる部品 |
| dialog | 確認用の小窓 |
| mutation | データを書き換えるお願い |
| endpoint | サーバーへの送り先 |
| toast | 画面に少しだけ出るお知らせ |

## Part 2: 技術者レベル

- 新規: `apps/web/src/features/admin/hooks/useConfirmDialog.ts`
- 新規: `apps/web/src/components/ui/ConfirmDialog.tsx`
- 改修: `apps/web/src/components/admin/MeetingPanel.tsx`
- 改修: `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`
- API contract: current UI surface は `POST /api/admin/meetings/:id/attendances` with `{ memberId, attended }`
- legacy API-only route は新規 UI では使わない。current UI は `/attendances` alias の `{ attended: true | false }` に統一。

### Dialog / a11y Contract

- `ConfirmDialog` は `role="dialog"` / `aria-modal="true"` / `aria-labelledby` を持つ。
- `useId()` で static id 衝突を避ける。
- open 時に dialog 内の最初の focusable element へ focus し、close 時に元 focus を復元する。
- `Tab` / `Shift+Tab` は dialog 内で循環する。
- `useConfirmDialog.submit()` は submitting 中の二重 submit を no-op にする。

### Error Mapping

| status | error | UI |
| --- | --- | --- |
| 404 | `session_not_found` / `member_not_found` / `attendance_not_found` | 開催日または会員が見つかりません |
| 409 | `attendance_already_recorded` | 既に出席登録済み |
| 422 | `member_is_deleted` | 削除済み会員は登録できません |
| 5xx | other | 登録に失敗 |

出席解除 (`attended:false`) で `404 attendance_not_found` を受けた場合は、他管理者が先に解除した状態として成功相当で UI から除去し、「既に出席解除されています」を表示する。

### Phase 11 Visual Evidence

| Path | 内容 |
| --- | --- |
| `outputs/phase-11/screenshots/01-meetings-list.png` | meetings list before destructive action |
| `outputs/phase-11/screenshots/02-confirm-remove.png` | 出席解除 confirm dialog |
| `outputs/phase-11/screenshots/03-confirm-delete-meeting.png` | 開催日 soft delete confirm dialog |
| `outputs/phase-11/screenshots/04-attendance-registered.png` | detail registered state |
| `outputs/phase-11/screenshots/05-toast-duplicate.png` | duplicate attendance toast |
