# step-07-requests-approve-reject 実装仕様書

**[実装区分: 実装仕様書 (mutation UI + 共通基盤再利用)]**
**[直列順序: 7/8 | 前提: step-01 useAdminMutation hook + step-06 useConfirmDialog hook]**

## 1. 目的

admin/requests 画面で visibility_request / delete_request の approve/reject を二段階確認で実行し、409 conflict（他の管理者が既に処理）を特別表示する。useConfirmDialog を再利用。

## 2. スコープ

- **変更対象**: `apps/web/app/(admin)/admin/requests/` + `apps/web/src/components/admin/RequestQueuePanel.tsx`
- **再利用実装**: useAdminMutation + useConfirmDialog hooks (step-01, step-06 で確立)
- **API**: `POST /api/admin/requests/:noteId/resolve` (実装済)
- **UI パターン**: request queue list → select → detail + dialog → approve/reject → mutation → toast

## 3. 変更対象ファイル一覧

```
apps/web/src/components/admin/
  ├── RequestQueuePanel.tsx (hook 統合, state 簡潔化)
  ├── RequestQueueDetail.tsx (新規, detail view component)
  ├── RequestConfirmDialog.tsx (新規, confirm dialog wrapper)
  └── __tests__/
      ├── RequestQueuePanel.component.spec.tsx (既存)
      ├── RequestQueueDetail.spec.tsx (新規)
      └── RequestConfirmDialog.spec.tsx (新規)

apps/web/app/(admin)/admin/requests/
  ├── page.tsx (確認, client marker + filter params)
  └── layout.tsx (確認)
```

## 4. 設計

### 4.1 RequestQueuePanel.tsx 統合

**変更**:
- useAdminMutation で resolve mutation 統一
- useConfirmDialog で approve/reject state 一本化
- 409 conflict → 全体再読込 (router.refresh())
- reject 時 resolutionNote 必須（useConfirmDialog requireNote=true で実装）

**API Contract**:
```
POST /api/admin/requests/:noteId/resolve
{
  "action": "approve" | "reject",
  "resolutionNote": "optional reason (reject 時は必須)"
}

Response (200):
{ "ok": true, "resolvedAt": "2026-05-15T10:00:00Z" }

Error (404):
{ "ok": false, "error": "NOT_FOUND" }

Error (409):
{ "ok": false, "error": "ALREADY_RESOLVED" }

Error (422):
{ "ok": false, "error": "INVALID_REQUEST_TYPE" }
```

### 4.2 RequestQueueDetail.tsx

**役割**: 選択された request の詳細情報表示

**Props**:
```typescript
interface RequestQueueDetailProps {
  readonly item: RequestQueueItem | null;
  readonly type: RequestNoteType;
  readonly onApprove: () => void;
  readonly onReject: () => void;
  readonly busy: boolean;
}
```

**表示内容**:
- request type label
- member summary (publicHandle, publishState)
- requested reason (if any)
- payload summary
- approve / reject buttons

**状態**:
- busy=true → buttons disabled

### 4.3 RequestConfirmDialog.tsx

**役割**: confirm dialog 展開（二段階確認UI）

**Props**:
```typescript
interface RequestConfirmDialogProps {
  readonly kind: 'approve' | 'reject' | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (note: string) => Promise<void>;
  readonly isDestructive?: boolean; // delete_request approve は赤色
  readonly busy: boolean;
}
```

**HTML5 `<dialog>` element 使用**:
- showModal() で表示
- ESC キー / cancel button で close
- submit button: "確認" (approve) / "却下" (reject)

**reject 時**:
- resolutionNote textarea 必須
- "却下理由を入力してください" validation

## 5. 関数・型シグネチャ

### RequestQueuePanel
```typescript
export function RequestQueuePanel({
  initial,
  type,
}: Props): ReactNode;
```

### RequestQueueDetail
```typescript
export function RequestQueueDetail({
  item,
  type,
  onApprove,
  onReject,
  busy,
}: RequestQueueDetailProps): ReactNode;
```

### RequestConfirmDialog
```typescript
export function RequestConfirmDialog({
  kind,
  open,
  onClose,
  onSubmit,
  isDestructive,
  busy,
}: RequestConfirmDialogProps): ReactNode;
```

## 6. 入出力・副作用

### RequestQueuePanel
- **入力**: initial (server fetch 済), type (filter param)
- **出力**: queue list + detail + confirm dialog
- **副作用**: useAdminMutation trigger, useConfirmDialog, router.refresh(), toast()

### RequestQueueDetail
- **入力**: item, type, callbacks, busy
- **出力**: detail view + approve/reject buttons
- **副作用**: onApprove/onReject callback 呼び出し

### RequestConfirmDialog
- **入力**: kind, open, onSubmit callback, isDestructive, busy
- **出力**: `<dialog>` element + form
- **副作用**: dialog.showModal() / .close(), onSubmit 呼び出し

## 7. テスト方針

### RequestQueuePanel.component.spec.tsx
- [✓] initial 렌더링 (list + detail)
- [✓] item select → detail 더新
- [✓] approve button → dialog 표시
- [✓] reject button → dialog 표시
- [✓] 200 response → toast + list update
- [✓] 409 response (ALREADY_RESOLVED) → toast "他の管理者が既に処理済み" + refresh
- [✓] filter params (type, cursor) handling

### RequestQueueDetail.spec.tsx
- [✓] render item 내용
- [✓] approve button → onApprove callback
- [✓] reject button → onReject callback
- [✓] busy=true → buttons disabled
- [✓] RequestNoteType label 표시 (visibility_request / delete_request)

### RequestConfirmDialog.spec.tsx
- [✓] open={true} → `<dialog>`.showModal() 呼び出し
- [✓] ESC キー → close + onClose callback
- [✓] cancel button → close
- [✓] kind='reject' & requireNote=true & note="" → validation error
- [✓] submit button → onSubmit(note) 呼び出し
- [✓] isDestructive=true (delete_request approve) → 赤色警告表示
- [✓] busy=true → buttons disabled

## 8. ローカル実行コマンド

```bash
# unit test
pnpm test apps/web --run -- RequestQueuePanel.component.spec.tsx
pnpm test apps/web --run -- RequestQueueDetail.spec.tsx
pnpm test apps/web --run -- RequestConfirmDialog.spec.tsx

# dev server
pnpm dev
# → http://localhost:3000/admin/requests (login 後)
# → request item select → detail 표시
# → approve / reject button → dialog 표시
# → submit → toast

# e2e smoke test
pnpm e2e:smoke
```

## 9. DoD (Definition of Done)

### 実装完了
- [✓] RequestQueuePanel.tsx refactor (hook 統合)
- [✓] RequestQueueDetail.tsx 新規実装
- [✓] RequestConfirmDialog.tsx 新規実装 (`<dialog>` element)
- [✓] unit test green

### 品質
- [✓] TypeScript strict mode
- [✓] design token 色 使用 (HEX 直書き 禁止)
- [✓] a11y: dialog role, aria-label, label↔input
- [✓] isDestructive=true 時の赤色警告表示

### 動作確認
- [✓] dialog showModal() / close()
- [✓] reject 時 note validation
- [✓] 409 conflict → toast + refresh
- [✓] approve/reject → mutation 後 list update
- [✓] smoke test PASS

## 10. リスク・制約

1. **HTML5 `<dialog>` element 互換性**: iOS Safari 17.4+ で deprecated, fallback Modal component 必要か検討
2. **409 conflict handling**: 全体再読込（router.refresh()）で OK か、段階的再読込か
3. **resolutionNote character limit**: 最大500文字で制限
4. **404 vs 409**: noteId not found と already resolved の区別（UI メッセージ分岐）

## 11. 前提

**step-01 完了**: useAdminMutation hook + router.refresh() pattern 確立済

**step-06 完了**: useConfirmDialog hook 確立済

**parallel-08 完了**: toast provider, design tokens 導入済

## 12. 依存ライブラリ

### 既存（確認済）
- `next/navigation`: useRouter
- `react`: useState, ReactNode, useRef
- `@ubm-hyogo/shared`: type definitions

### 新規確認必要
- HTML5 `<dialog>` element native API (showModal, close)

---

**Updated**: 2026-05-15
**Status**: Ready for implementation
