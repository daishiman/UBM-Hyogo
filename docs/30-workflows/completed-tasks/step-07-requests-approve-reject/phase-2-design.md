# Phase 2: 設計

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-1-requirements
**次 Phase**: phase-3-design-review

## 目的

要件 AC-1〜AC-10 を満たすコンポーネント構成・props・API contract・状態遷移を確定する。

## コンポーネント分割

```
RequestQueuePanel (refactor)
├── RequestQueueList (既存 / inline)
├── RequestQueueDetail (新規)
│   ├── approve button
│   └── reject button
└── RequestConfirmDialog (新規, HTML5 <dialog>)
    ├── (reject 時) FormField + textarea (resolutionNote)
    ├── submit button
    └── cancel button
```

## 変更対象ファイル一覧

| Path | 種別 |
|---|---|
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | modify |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | add |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | add |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | modify |
| `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | add |
| `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | add |

## 関数・型シグネチャ（親 spec Section 5 を採用）

### RequestQueuePanel

```typescript
interface Props {
  readonly initial: ReadonlyArray<RequestQueueItem>;
  readonly type: RequestNoteType;
}

export function RequestQueuePanel({ initial, type }: Props): ReactNode;
```

### RequestQueueDetail

```typescript
interface RequestQueueDetailProps {
  readonly item: RequestQueueItem | null;
  readonly type: RequestNoteType;
  readonly onApprove: () => void;
  readonly onReject: () => void;
  readonly busy: boolean;
}

export function RequestQueueDetail(props: RequestQueueDetailProps): ReactNode;
```

### RequestConfirmDialog

```typescript
interface RequestConfirmDialogProps {
  readonly kind: 'approve' | 'reject' | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (note: string) => Promise<void>;
  readonly isDestructive?: boolean;
  readonly busy: boolean;
}

export function RequestConfirmDialog(props: RequestConfirmDialogProps): ReactNode;
```

## API Contract

```
POST /api/admin/requests/:noteId/resolve
Body: { resolution: 'approve' | 'reject', resolutionNote?: string }

200: { ok: true, noteId, requestStatus, resolvedAt, resolvedByAdminId, memberAfter, retentionPurgeScheduledAt }
400: { ok: false, error: 'invalid json' | '<zod message>' | 'unsupported note type' }
404: { ok: false, error: 'note not found' | 'member_status_not_found' }
409: { ok: false, error: 'already_resolved', currentStatus }
422: { ok: false, error: 'invalid desiredState in request payload' }
```

`reject` 時 `resolutionNote` は client 側で必須 validation する。shared schema は `resolutionNote?: string.max(500)` を検証し、空欄 reject の業務 validation は UI 側で止める。

## 状態遷移

| state | 説明 | 遷移先 |
|---|---|---|
| `idle` | item 未選択 | item 選択 → `selected` |
| `selected` | detail 表示中 | approve/reject button → `dialogOpen` |
| `dialogOpen` | dialog 表示中 | submit → `submitting` / cancel → `selected` |
| `submitting` | mutation in-flight | 200 → `idle` + list refresh / 409 → `idle` + refresh / 400/404/422/その他 → `selected` |

useConfirmDialog hook がこの状態を吸収し、`RequestQueuePanel` は `kind` (approve/reject/null) + `targetItem` のみ保持する。

## 入出力・副作用

### RequestQueuePanel
- 入力: `initial`, `type`
- 出力: list + detail + dialog
- 副作用: `useAdminMutation` trigger / `router.refresh()` / `toast()`

### RequestQueueDetail
- 入力: `item`, `type`, callbacks, `busy`
- 出力: 詳細 view + buttons
- 副作用: callback 呼び出しのみ

### RequestConfirmDialog
- 入力: props
- 出力: `<dialog>` element
- 副作用: `dialog.showModal()` / `dialog.close()` / `onSubmit(note)`

## design token 利用

- approve button: `--color-action-primary`
- reject button: `--color-action-secondary` / 警告系 token
- `isDestructive=true`: `--color-action-destructive`
- 全色 token は `apps/web/src/styles/tokens.css` 経由。HEX 直書き禁止。

## a11y

- `<dialog>` element 標準の modal role
- `aria-labelledby` で dialog title と紐付け
- reject 時 `<textarea>` に `<label>` を `FormField` 経由で付与
- focus trap: `<dialog>.showModal()` のブラウザ標準挙動に従う
- ESC で close（標準挙動）

## 409 conflict 戦略

```ts
onError: (err) => {
  if (err.status === 409 && err.error === 'already_resolved') {
    toast({ kind: 'warning', message: '他の管理者が既に処理済みです' });
    router.refresh();
    return;
  }
  if (err.status === 404) {
    toast({ kind: 'error', message: '対象が見つかりません' });
    router.refresh();
    return;
  }
  if (err.status === 400 || err.status === 422) {
    toast({ kind: 'error', message: 'リクエスト種別が不正です' });
    return;
  }
  toast({ kind: 'error', message: '処理に失敗しました' });
}
```
