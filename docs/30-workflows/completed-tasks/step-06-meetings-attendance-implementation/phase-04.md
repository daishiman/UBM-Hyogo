# Phase 4: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 区分 | 設計（実装なし） |
| 想定所要 | 0.25 人日 |

## 目的

`useConfirmDialog` / `ConfirmDialog` / `MeetingPanel` / `MeetingAttendancePanel` の
unit / component / a11y テストケースを列挙し、coverage 閾値を満たす test 設計を確定する。

## test 対象と spec ファイル対応

| 対象 | spec ファイル | 種別 |
| --- | --- | --- |
| `useConfirmDialog` | `apps/web/src/features/admin/hooks/__tests__/useConfirmDialog.spec.tsx` | unit (renderHook) |
| `ConfirmDialog` | `apps/web/src/components/ui/__tests__/ConfirmDialog.spec.tsx` | component (RTL) |
| `MeetingPanel` | `apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx` | component (既存追加) |
| `MeetingAttendancePanel` | `apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx` | component (新規) |

すべて `*.spec.tsx` で命名（CLAUDE.md 不変条件 #8 / `verify-test-suffix` gate 準拠）。

## 4.1 useConfirmDialog テストケース

| # | ケース | 期待 |
| --- | --- | --- |
| U1 | initial state | `open=false`, `kind=null`, `note=""`, `submitting=false`, `validationError=null` |
| U2 | `openConfirm("approve", ctx)` | `open=true`, `kind="approve"`, `context=ctx` |
| U3 | `openConfirm` 後の `setNote("foo")` | `note="foo"` |
| U4 | `requireNote=true && kind="reject" && note=""` で `submit()` | `validationError !== null` / `onSubmit` 未呼出 |
| U5 | `maxNoteLength=10` で 11 文字 setNote | `validationError !== null` |
| U6 | 正常 submit | onSubmit が `(kind, note, ctx)` で呼ばれる / 成功後 state reset |
| U7 | submit 中の closeConfirm | submitting=true 中は no-op |
| U8 | onSubmit が throw | `submitting=false` に戻る / state は保持 / validationError は変えない |
| U9 | submit 後の closeConfirm | reset 状態 |

## 4.2 ConfirmDialog テストケース

| # | ケース | 期待 |
| --- | --- | --- |
| C1 | `open=false` | DOM に `role=dialog` が存在しない |
| C2 | `open=true` | `role=dialog`, `aria-modal=true`, `aria-labelledby` が存在 |
| C3 | description あり | `aria-describedby` が設定される |
| C4 | onCancel クリック | callback 呼出 |
| C5 | backdrop クリック | onCancel 呼出 |
| C6 | dialog 内クリック | onCancel 呼ばれない (stopPropagation) |
| C7 | Escape キー | onCancel 呼出 |
| C8 | `submitting=true` | confirm/cancel button が disabled |
| C9 | `validationError` あり | `role=alert` でエラー表示 |
| C10 | `noteRequired` 表示文言 | "（必須）" を含む |

## 4.3 MeetingPanel 追加テストケース

| # | ケース | 期待 |
| --- | --- | --- |
| M1 | 出席削除ボタン押下 | `role=dialog` が表示される / mutation 未発火 |
| M2 | confirm 内で「削除する」押下 | `attendanceMutation` が `(sessionId, memberId, attended: false)` で trigger |
| M3 | confirm 成功後 | dialog が閉じる / attended Set から該当 memberId が消える / toast 表示 |
| M4 | confirm キャンセル | mutation 呼ばれない / Set 不変 |
| M5 | 「開催日を削除」押下 → confirm | dialog `confirm.kind === "delete"` で表示 / description に "soft delete" 文言 |
| M6 | 開催日削除 confirm 成功 | `meetingUpdateMutation` trigger / `router.refresh()` / toast |
| M7 | 409 受信 (出席解除時) | toast に "登録済" 系メッセージ / Set は変えない |
| M8 | filterCandidates は既存どおり pure | 既存テスト維持 |

## 4.4 MeetingAttendancePanel テストケース

| # | ケース | 期待 |
| --- | --- | --- |
| A1 | 候補リスト rendering | `isDeleted=true` は除外される |
| A2 | 既出席メンバーの button | 「登録済」ラベル / `data-registered="true"` |
| A3 | 出席登録 button 押下 (200) | `registered` Set に追加 / toast "出席を登録しました" |
| A4 | 409 受信 | toast "既に出席登録済み" / Set に追加 |
| A5 | 422 受信 | toast "削除済み会員は登録できません" / Set 不変 |
| A6 | 5xx 受信 | toast "登録に失敗 (status)" / Set 不変 |
| A7 | 既登録 button 再押下 | `useAdminMutation.trigger` 呼ばれない (early return) |
| A8 | data-testid `attendance-register` 互換 | 既存 e2e selector が壊れない |

## test 共通方針

- `useAdminMutation` の `fetch` は MSW or 直接 `globalThis.fetch` を `vi.fn()` で stub
- `useRouter().refresh` は `vi.mock("next/navigation")` で stub
- toast は `useToast` の provider をテスト内で wrap し、`role=status` text を queries で検証
- a11y は `@testing-library/jest-dom` の `toBeInTheDocument` / role queries で確認

## coverage 目標

- `useConfirmDialog.ts`: lines ≥ 95%, branches ≥ 90%
- `ConfirmDialog.tsx`: lines ≥ 90%
- `MeetingPanel.tsx` 差分: 追加分 lines ≥ 80%（既存 test と合算）
- `MeetingAttendancePanel.tsx`: lines ≥ 80%

## 完了条件

- [ ] 上記 4 spec ファイル分の全ケースが列挙されている
- [ ] coverage 目標が CLAUDE.md / quality-gates.md と整合
- [ ] e2e selector (`data-testid`) の後方互換が維持されている
- [ ] API path 期待値は `/api/admin/meetings/:id/attendances` に統一されている

## リスク

- `<dialog>` element を使わず自前 modal にしたため、focus trap / focus restore を component test で固定する
  → Phase 11 で「a11y 改善候補」として未タスク化（次サイクル）
