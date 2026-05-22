# Phase 3: 詳細設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 区分 | 設計（実装なし） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 1/2 の SSOT に基づき、新規ファイルの構造・関数シグネチャ・状態遷移・UI markup を確定する。

## 3.1 `useConfirmDialog.ts` 詳細設計

### state shape

```typescript
interface InternalState {
  open: boolean;
  kind: ConfirmKind | null;
  note: string;
  submitting: boolean;
  validationError: string | null;
  context: unknown;
}

const initialState: InternalState = {
  open: false,
  kind: null,
  note: "",
  submitting: false,
  validationError: null,
  context: null,
};
```

### action 一覧

| action | 効果 |
| --- | --- |
| `openConfirm(kind, ctx)` | `{ open: true, kind, context: ctx, note: "", validationError: null, submitting: false }` |
| `closeConfirm()` | submitting=true なら no-op、それ以外は initialState に戻す |
| `setNote(note)` | 値を保持し、入力中の `validationError` を解除する。超過判定は `submit()` の validation に集約 |
| `submit()` | (1) validation → (2) submitting=true → (3) onSubmit 呼び出し → (4) 成功時 closeConfirm / 失敗時 submitting=false |

### validation ルール

```typescript
function validate(
  kind: ConfirmKind,
  note: string,
  opts: UseConfirmDialogOptions,
): string | null {
  const requireNote = opts.requireNote ?? (kind === "reject");
  if (requireNote && note.trim() === "") {
    return "理由を入力してください";
  }
  const max = opts.maxNoteLength ?? 500;
  if (note.length > max) {
    return `${max}文字以内で入力してください`;
  }
  return null;
}
```

### submit シーケンス

```
submit()
  → validation (NG → setState({ validationError }) で return)
  → setState({ submitting: true, validationError: null })
  → try { await onSubmit(kind, note, context) }
  → ok → setState(initialState)
  → catch (e) → setState({ submitting: false }) // toast は onSubmit 側で発火
```

## 3.2 `ConfirmDialog.tsx` 詳細設計

### Props

```typescript
interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string; // default "キャンセル"
  readonly isDestructive?: boolean;
  readonly note?: string;
  readonly onNoteChange?: (note: string) => void;
  readonly noteRequired?: boolean;
  readonly maxNoteLength?: number;
  readonly validationError?: string | null;
  readonly submitting?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}
```

`isDestructive` は hook option ではなく `ConfirmDialogProps` の表示責務として扱う。hook は
状態・validation・submit orchestration のみを持ち、button 色や危険操作ラベルは presentational
component 側で決める。

### markup（疑似 JSX）

```tsx
{open && (
  <div role="presentation" className="ubm-dialog-backdrop" onClick={onCancel}>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? "confirm-dialog-desc" : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 id="confirm-dialog-title">{title}</h2>
      {description && <p id="confirm-dialog-desc">{description}</p>}
      {onNoteChange && (
        <label>
          理由{noteRequired ? "（必須）" : "（任意）"}
          <textarea
            value={note ?? ""}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={maxNoteLength}
            aria-invalid={validationError ? "true" : "false"}
          />
        </label>
      )}
      {validationError && <p role="alert">{validationError}</p>}
      <button type="button" onClick={onCancel} disabled={submitting}>
        {cancelLabel ?? "キャンセル"}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={submitting}
        data-destructive={isDestructive ? "true" : undefined}
      >
        {confirmLabel}
      </button>
    </div>
  </div>
)}
```

### ESC ハンドリング

`useEffect` で `keydown` を listen し、`Escape` かつ `!submitting` で `onCancel()`。

## 3.3 MeetingPanel.tsx の差分設計

### 統合方針

```tsx
// 出席解除と meeting 削除の 2 種類の確認 dialog を一本化
const confirm = useConfirmDialog(
  async (kind, _note, ctx) => {
    if (kind === "remove") {
      const { sessionId, memberId } = ctx as { sessionId: string; memberId: string };
      await attendanceMutation.trigger({ sessionId, memberId, attended: false });
      setAttended((s) => /* Set から remove */);
      setToast("出席を削除しました");
    } else if (kind === "delete") {
      const { sessionId } = ctx as { sessionId: string };
      await meetingUpdateMutation.trigger({ sessionId, deletedAt: new Date().toISOString() });
      router.refresh();
      setToast("開催日を削除しました");
    }
  },
  { isDestructive: true },
);

// 既存 onRemove / onSoftDelete を openConfirm に置換
const onRemove = (sessionId: string, memberId: string) =>
  confirm.openConfirm("remove", { sessionId, memberId });
const onSoftDelete = (sessionId: string) =>
  confirm.openConfirm("delete", { sessionId });
```

### render 末尾に追加

```tsx
<ConfirmDialog
  open={confirm.open}
  title={
    confirm.kind === "remove" ? "出席を削除しますか？"
    : confirm.kind === "delete" ? "この開催日を削除しますか？"
    : ""
  }
  description={
    confirm.kind === "delete" ? "この操作は soft delete です。後で復元できません。" : undefined
  }
  confirmLabel="削除する"
  isDestructive
  submitting={confirm.submitting}
  validationError={confirm.validationError}
  onConfirm={confirm.submit}
  onCancel={confirm.closeConfirm}
/>
```

## 3.4 MeetingAttendancePanel.tsx の差分設計

### 統合方針

```tsx
const registerMutation = useAdminMutation<{ attendance: { memberId: string } }>(
  `/api/admin/meetings/${detail.sessionId}/attendance`,
  "POST",
  {
    refreshOnSuccess: false,
    onError: (e) => {
      if (e instanceof AdminMutationError && e.status === 409) {
        setRegistered((s) => new Set(s).add(/* memberId 保持要 */));
        setToast("既に出席登録済み");
      } else if (e instanceof AdminMutationError && e.status === 422) {
        setToast("削除済み会員は登録できません");
      } else {
        setToast(`登録に失敗 (${e instanceof AdminMutationError ? e.status : "unknown"})`);
      }
    },
  },
);

const onRegister = async (memberId: string) => {
  if (registered.has(memberId)) {
    setToast("既に出席登録済み");
    return;
  }
  try {
    await registerMutation.trigger({ memberId, attended: true });
    setRegistered((s) => new Set(s).add(memberId));
    setToast("出席を登録しました");
  } catch {
    /* onError で toast 済 */
  }
};
```

> 注意: `useAdminMutation` の signature は本リポジトリ実装に合わせる
> （`endpoint` 第一引数 + `payload` で trigger）。実装時に `apps/web/src/features/admin/hooks/useAdminMutation.ts` の
> 最新シグネチャを確認してから差分を適用する。

## 3.5 index.ts への export 追加

`apps/web/src/features/admin/hooks/index.ts` に以下を追加:

```typescript
export { useConfirmDialog } from "./useConfirmDialog";
export type {
  ConfirmKind,
  UseConfirmDialogOptions,
  UseConfirmDialogState,
  UseConfirmDialogReturn,
} from "./useConfirmDialog";
```

## 完了条件

- [ ] `useConfirmDialog` の action / validation / submit シーケンスが定義されている
- [ ] `ConfirmDialog` の aria 属性が SSOT に準拠している
- [ ] MeetingPanel / MeetingAttendancePanel の差分疑似コードが提示されている
- [ ] 既存 export shape が変更されていない

## リスク

- `useAdminMutation` の最新 signature と本仕様の不整合 → Phase 5 着手時に `useAdminMutation.ts` を再 Read して合わせる
