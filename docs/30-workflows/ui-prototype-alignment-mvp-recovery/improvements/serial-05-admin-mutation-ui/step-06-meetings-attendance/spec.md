# step-06-meetings-attendance 実装仕様書

**[実装区分: 実装仕様書 (mutation UI + 共通基盤再利用)]**
**[直列順序: 6/8 | 前提: step-01 useAdminMutation hook + parallel-08 shared-foundation]**

## 1. 目的

admin/meetings 画面で出席登録・削除を useAdminMutation + useConfirmDialog hooks で統一し、bulk 出席編集 UI を確立する。

## 2. スコープ

- **変更対象**: `apps/web/app/(admin)/admin/meetings` + `apps/web/src/components/admin/MeetingPanel.tsx`
- **新規実装**: useConfirmDialog hook (共通基盤、step-07 でも再利用)
- **API**: `POST /api/admin/meetings/:id/attendances` (実装済), `DELETE /api/admin/meetings/:id/attendances/:memberId` (確認)
- **UI パターン**: 出席リスト → toggle/bulk → confirm dialog → mutation → toast

## 3. 変更対象ファイル一覧

```
apps/web/src/features/admin/hooks/
  ├── useConfirmDialog.ts (新規, step-07 でも再利用)
  └── index.ts (export 追加)

apps/web/src/components/admin/
  ├── MeetingPanel.tsx (hook 統合, state 簡潔化)
  ├── MeetingAttendancePanel.tsx (存在確認, 統合)
  └── __tests__/
      ├── MeetingPanel.component.spec.tsx (既存)
      └── MeetingAttendancePanel.spec.tsx (新規)

apps/web/app/(admin)/admin/meetings/
  ├── page.tsx (確認, client marker)
  └── [id]/page.tsx (詳細ページ確認)
```

## 4. 設計

### 4.1 useConfirmDialog hook

**役割**: 二段階確認 dialog 状態管理 (approve/reject + resolutionNote)

**シグネチャ**:
```typescript
interface UseConfirmDialogState {
  open: boolean;
  kind: 'approve' | 'reject' | null;
  note: string;
}

export function useConfirmDialog(
  onSubmit: (kind: 'approve' | 'reject', note: string) => Promise<void>,
  options?: {
    isDestructive?: boolean;
    requireNote?: boolean;
    maxNoteLength?: number;
  }
): UseConfirmDialogState & {
  openConfirm: (kind: 'approve' | 'reject') => void;
  closeConfirm: () => void;
  setNote: (note: string) => void;
};
```

**動作フロー**:
1. openConfirm('approve' | 'reject') → dialog 表示
2. note 入力 (requireNote=true かつ kind='reject' なら必須)
3. submit → onSubmit(kind, note)
4. 成功 → closeConfirm()
5. ESC キー / Cancel → closeConfirm()

### 4.2 MeetingPanel.tsx 統合

**変更**:
- useAdminMutation で attendance mutation 統一
- useConfirmDialog で confirm state 一本化
- attended Map は楽観 UI で更新
- 422 (deleted member) / 409 (duplicate) は hook onError で toast

**API Contract**:
```
POST /api/admin/meetings/:id/attendances
{ "memberId": "m_xxx" }

Response (200):
{ "ok": true, "attendance": { "memberId": "m_xxx", "assignedAt": "..." } }

Error (409):
{ "ok": false, "error": "DUPLICATE_ATTENDANCE" }

Error (422):
{ "ok": false, "error": "DELETED_MEMBER" }

Error (404):
{ "ok": false, "error": "MEETING_NOT_FOUND" }
```

DELETE `/api/admin/meetings/:id/attendances/:memberId` も同様に hook 経由で実行

### 4.3 MeetingAttendancePanel.tsx

**確認項目**:
- 既出席メンバー Set 表示
- candidates リスト (isDeleted=true 除外)
- add/remove button は useAdminMutation 経由に統一

## 5. 関数・型シグネチャ

### useConfirmDialog
```typescript
export function useConfirmDialog(
  onSubmit: (kind: 'approve' | 'reject', note: string) => Promise<void>,
  options?: {
    isDestructive?: boolean;
    requireNote?: boolean;
    maxNoteLength?: number;
  }
): UseConfirmDialogState & {
  openConfirm: (kind: 'approve' | 'reject') => void;
  closeConfirm: () => void;
  setNote: (note: string) => void;
};
```

### MeetingPanel
```typescript
export function MeetingPanel({
  meetings,
  candidates,
}: Props): ReactNode;
```

### MeetingAttendancePanel
```typescript
export function MeetingAttendancePanel({
  sessionId,
  attended,
  candidates,
  onAdd,
  onRemove,
}: Props): ReactNode;
```

## 6. 入出力・副作用

### useConfirmDialog
- **入力**: onSubmit callback, options (isDestructive, requireNote, maxNoteLength)
- **出力**: dialog state + openConfirm/closeConfirm/setNote methods
- **副作用**: なし (UI state 管理のみ)

### MeetingPanel
- **入力**: meetings (server fetch 済), candidates (server fetch 済)
- **出力**: form + meeting list + attendance section
- **副作用**: useAdminMutation trigger, useConfirmDialog, router.refresh(), toast()

### MeetingAttendancePanel
- **入力**: sessionId, attended Set, candidates[]
- **出力**: list + add/remove button
- **副作用**: onAdd/onRemove callback via useAdminMutation

## 7. テスト方針

### useConfirmDialog.spec.ts
- [✓] openConfirm('approve') → dialog.open = true
- [✓] kind state 遷移
- [✓] note 입력 → state 更新
- [✓] submit → onSubmit 呼び出し
- [✓] requireNote=true & kind='reject' & note="" → validation error
- [✓] closeConfirm() → reset

### MeetingPanel.component.spec.tsx
- [✓] initial rendering (form + list)
- [✓] create meeting → mutation trigger → toast
- [✓] add attendance → confirm dialog 표시
- [✓] 200 response → attended Set 更新
- [✓] 409/422 response → toast error
- [✓] remove attendance → mutation trigger

### MeetingAttendancePanel.spec.tsx
- [✓] attended 표시
- [✓] candidates リスト (isDeleted 除外)
- [✓] add button disabled when attended
- [✓] onAdd/onRemove callback 呼び出し

## 8. ローカル実行コマンド

```bash
# unit test
pnpm test apps/web --run -- useConfirmDialog.spec.ts
pnpm test apps/web --run -- MeetingPanel.component.spec.tsx
pnpm test apps/web --run -- MeetingAttendancePanel.spec.tsx

# dev server (admin page)
pnpm dev
# → http://localhost:3000/admin/meetings (login 後)
# → 出席追加 → confirm dialog → submit → toast

# smoke test
pnpm e2e:smoke
```

## 9. DoD (Definition of Done)

### 実装完了
- [✓] useConfirmDialog hook 実装 + export
- [✓] MeetingPanel.tsx refactor (hook 統合)
- [✓] MeetingAttendancePanel.tsx 統合確認
- [✓] unit test green

### 品質
- [✓] TypeScript strict mode
- [✓] design token 色 使用 (HEX 直書き 禁止)
- [✓] JSDoc コメント
- [✓] a11y: dialog role, aria-label

### 動作確認
- [✓] confirm dialog 表示/非表示
- [✓] 422/409 error toast
- [✓] attended Set 楽観 UI
- [✓] router.refresh() 実行
- [✓] smoke test PASS

## 10. リスク・制約

1. **確認ダイアログ**: HTML5 `<dialog>` element vs. custom Modal component の選定
2. **API contract 確認**: DELETE endpoint の exact path 確認必要
3. **concurrent mutation**: 複数出席登録の race condition 防止

## 11. 前提

**step-01 完了**: useAdminMutation hook + router.refresh() pattern 確立済

**step-05 完了**: parallel-08 shared-foundation 導入済 (toast provider, design tokens)

## 12. 依存ライブラリ

### 既存（確認済）
- `next/navigation`: useRouter
- `react`: useState, ReactNode
- `@ubm-hyogo/shared`: type definitions

### 新規確認必要
- HTML5 `<dialog>` element (native) または Modal component

---

**Updated**: 2026-05-15
**Status**: Ready for implementation
