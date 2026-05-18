# Phase 02: 設計

## 設計方針

dialog component 内に `useRouter()` を持ち込み、success path の最先で `router.refresh()` を発火する。parent (`RequestActionPanel.tsx`) からは refresh 発火責務を撤去し、二重発火を防止する。success path は厳密に `refresh → onSubmitted → onClose` 固定、duplicate pending path は `refresh → onSubmitted` 固定とし、test で assertion 化する。

## Before / After (spec.md からの抜粋)

### VisibilityRequestDialog.tsx

**Before**:
```ts
const res = await requestVisibilityChange({ /* ... */ });
if (res.ok) {
  onSubmitted(res.accepted);
  onClose();
}
```

**After**:
```ts
import { useRouter } from "next/navigation";

// component 内
const router = useRouter();

// onSubmit 成功時
if (res.ok) {
  router.refresh();           // 1) Server Component 再 fetch を先に schedule
  onSubmitted(res.accepted);  // 2) parent 通知
  onClose();                  // 3) unmount は最後
}
```

`DUPLICATE_PENDING_REQUEST` 分岐は旧 parent refresh と同じ再取得を維持するため、`onSubmitted` 前に `router.refresh()` を発火する。その他 `else` / `catch` 分岐は変更しない。

### DeleteRequestDialog.tsx

`VisibilityRequestDialog` と同パターン。`useRouter` import 追加・`router` 取得・成功 path に refresh を最先発火の 3 行を挿入する。

### RequestActionPanel.tsx

**Before** (line 57 付近):
```ts
const onSubmitted = () => {
  // ... local state 更新
  router.refresh();
};
```

**After**:
```ts
const onSubmitted = () => {
  // local UI state の更新のみ。refresh は dialog 側で発火済み。
  // ...
};
```

`useRouter()` を他で使っていない場合は import ごと削除して lint clean を保つ。

## 順序契約 (call order contract)

| step | actor | 動作 | 失敗時挙動 |
|------|-------|------|------------|
| 1 | dialog | `router.refresh()` schedule | throw は想定しない（Next.js 内部で吸収） |
| 2 | dialog | `onSubmitted(res.accepted)` | parent local state 更新 |
| 3 | dialog | `onClose()` | dialog unmount |

順序入れ替えはバグ。test で `callOrder.push` 方式により detect する。

Duplicate pending branch は dialog を閉じず、`refresh → onSubmitted(existingPending)` の順序だけを保証する。

## 関数シグネチャ (不変)

```ts
type VisibilityRequestDialogProps = {
  onSubmitted: (accepted: QueueAccepted) => void;
  onClose: () => void;
};

type DeleteRequestDialogProps = {
  onSubmitted: (accepted: QueueAccepted) => void;
  onClose: () => void;
};
```

## 設計決定

| 決定 | 理由 |
|------|------|
| refresh を dialog 側で発火 | unmount 前に schedule することで race condition を物理的に排除 |
| parent 側で refresh しない | 二重発火を構造的に禁止 |
| duplicate pending は refresh する | 旧 parent-owned refresh の再取得挙動を維持する |
| catch / その他 else は変更しない | error toast 単独で十分 |
| `useRouter` 撤去 (parent) | lint clean。他用途で使われていれば残置 |

## 副作用一覧

- `useRouter()` の hook 呼び出しが dialog 内で増える（client component 内のみ）
- `RequestActionPanel.tsx` の hook 呼び出しが 1 つ減る可能性あり

## DoD

- [x] Before / After snippet が `outputs/phase-02/dialog-refresh-order-design.md` に記載
- [x] 順序契約表が同 doc に記載
- [x] dialog props 不変であることを明示
- [x] duplicate pending と catch / その他 else 分岐の扱いを明示
