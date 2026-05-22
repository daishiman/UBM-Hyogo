# Phase 1: 要件定義 / SSOT 確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 区分 | 設計（実装なし） |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | spec_created |
| artifacts | `artifacts.json` |
| 想定所要 | 0.25 人日 |

## 目的

admin meetings 出席 mutation を `useAdminMutation` + 新規 `useConfirmDialog` に統一するための前提を
SSOT として確定する。あわせて step-07 (requests approve/reject) で再利用される
`useConfirmDialog` の公開 API を確定する。

## 入力

- 元仕様: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-06-meetings-attendance/spec.md`
- 既存実装:
  - `apps/web/src/components/admin/MeetingPanel.tsx`
  - `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`
  - `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- API 正本:
  - `apps/api/src/routes/admin/attendance.ts`
  - contract test: `apps/api/src/routes/admin/attendance.contract.spec.ts`
- 共通 UI: `apps/web/src/components/ui/` (Toast / FormField / Input / EmptyState)

## SSOT 決定事項

### 1. API endpoint contract（現行 UI alias を正本とする）

| 動作 | Method | Path | Body | 成功 | 主要エラー |
| --- | --- | --- | --- | --- | --- |
| 出席登録 | POST | `/api/admin/meetings/:sessionId/attendances` | `{ memberId, attended: true }` | 200 + `{ ok: true, attended: true }` | 404 (`session_not_found` / `member_not_found`) / 409 (`attendance_already_recorded`) / 422 (`member_is_deleted`) |
| 出席削除 | POST | `/api/admin/meetings/:sessionId/attendances` | `{ memberId, attended: false }` | 200 + `{ ok: true, attended: false }` | 404 (`attendance_not_found`) |

> **注**: legacy route `apps/api/src/routes/admin/attendance.ts` は単数 `/attendance` を持つが、
> current web helper `apps/web/src/lib/admin/api.ts` と UI route owner `apps/api/src/routes/admin/meetings.ts`
> は 06c-E alias endpoint `/attendances` を使う。step-06 の実装対象は admin UI なので、
> Phase 5 では複数形 alias を SSOT とする。

### 2. mutation 統一範囲

| ファイル | 現状 | 目標 |
| --- | --- | --- |
| `MeetingPanel.tsx` | 既に `useAdminMutation` 経由 | **削除確認 / 出席解除確認** で `useConfirmDialog` に置換 |
| `MeetingAttendancePanel.tsx` | 生 `fetch` を直接呼ぶ | `useAdminMutation` 経由に置換 + 409 を toast |

### 3. `useConfirmDialog` 公開 API（step-07 でも再利用する SSOT）

```typescript
export type ConfirmKind = "approve" | "reject" | "delete" | "remove";

export interface UseConfirmDialogOptions {
  readonly requireNote?: boolean;       // kind === "reject" でデフォルト true
  readonly maxNoteLength?: number;      // default 500
  readonly isDestructive?: boolean;     // ボタンの危険スタイル切替
}

export interface UseConfirmDialogState {
  readonly open: boolean;
  readonly kind: ConfirmKind | null;
  readonly note: string;
  readonly submitting: boolean;
  readonly validationError: string | null;
}

export interface UseConfirmDialogReturn extends UseConfirmDialogState {
  readonly openConfirm: (kind: ConfirmKind, ctx?: unknown) => void;
  readonly closeConfirm: () => void;
  readonly setNote: (note: string) => void;
  readonly submit: () => Promise<void>;
  readonly context: unknown; // openConfirm の第二引数を保持
}

export function useConfirmDialog(
  onSubmit: (kind: ConfirmKind, note: string, context: unknown) => Promise<void>,
  options?: UseConfirmDialogOptions,
): UseConfirmDialogReturn;
```

### 4. ConfirmDialog presentational

- 位置: `apps/web/src/components/ui/ConfirmDialog.tsx`
- 実装: HTML `<dialog>` 直書き禁止（test 環境差吸収のため）。`role="dialog"` `aria-modal="true"`
  `aria-labelledby` `aria-describedby` を持つ自前 modal。
- backdrop click / ESC で `closeConfirm()` 発火。
- focus trap は MVP 範囲外（次サイクルで追加）。a11y todo を Phase 11 で明示記録。

### 5. 後方互換

- `MeetingPanel.tsx` の export shape (`MeetingPanel`, `filterCandidates`, `MeetingItem`, `MeetingsListView`, `MemberCandidate`) は維持。
- `MeetingAttendancePanel` の props shape (`{ detail: Detail }`) は維持。

### 6. 非機能要件

- lines coverage: 追加コード ≥ 80%
- typecheck / lint / build green
- visual regression: 既存スクリーンショットを更新差分のみで PASS
- a11y: dialog open 時に `role=dialog` の DOM が存在

## 実行タスク

- 本 Phase: SSOT 固定 (実コード変更なし)
- Phase 2 以降: 本 SSOT に整合させる

## 参照資料

- `docs/00-getting-started-manual/specs/design-tokens.md`
- `apps/api/src/routes/admin/attendance.contract.spec.ts`
- `apps/api/src/routes/admin/meetings.contract.spec.ts`
- `apps/web/src/lib/admin/api.ts` (`addAttendance` / `removeAttendance`)

## 成果物

- 本ファイル (phase-01.md) に SSOT 6 項目を記録

## 完了条件

- [ ] SSOT 6 項目が本ドキュメントに記載されている
- [ ] 後続 Phase 2-13 が本 SSOT に整合する
- [ ] API path 正本（UI alias `/attendances`）が確定している

## リスク

- legacy単数 route と現行UI複数形 alias の混同 → 本 Phase で UI alias `/attendances` を SSOT として確定済
- `useConfirmDialog` を step-07 で再利用するため、公開 API は step-07 着手前に凍結する
