# Phase 2: 設計

## 1. 変更対象ファイル

| Path | 種別 | 変更内容 |
|------|------|---------|
| `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | modify | `useRouter` import 追加。onSubmit 成功 path で `router.refresh()` を最先発火 |
| `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | modify | 同上 |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | modify | `onSubmitted` callback から `router.refresh()` 撤去。`useRouter` import が未使用化されたら削除 |
| `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx` | modify | 副作用呼び出し順序の assertion 追加 |
| `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx` | modify | 同上 |
| `apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx` | modify | parent 由来 refresh が**呼ばれない**ことを assert |

## 2. シグネチャ (変更前 / 変更後)

### 2.1 VisibilityRequestDialog.tsx

```ts
// Before (apps/web/app/profile/_components/VisibilityRequestDialog.tsx:66-96)
const onSubmit = async () => {
  // ...
  const res = await requestVisibilityChange({ desiredState, ... });
  if (res.ok) {
    onSubmitted(res.accepted);
    onClose();
  } else { ... }
};

// After
import { useRouter } from "next/navigation";

export function VisibilityRequestDialog({ ... }: VisibilityRequestDialogProps) {
  const router = useRouter();
  // ...
  const onSubmit = async () => {
    // ...
    const res = await requestVisibilityChange({ desiredState, ... });
    if (res.ok) {
      router.refresh();            // (1) Server Component 再 fetch を先 schedule
      onSubmitted(res.accepted);   // (2) parent local state 通知
      onClose();                   // (3) unmount は最後
    } else { ... }
  };
}
```

### 2.2 DeleteRequestDialog.tsx

`VisibilityRequestDialog.tsx` と同パターン。`res.ok` 分岐に同 3 行を順序固定で挿入。

### 2.3 RequestActionPanel.tsx

```ts
// Before (apps/web/app/profile/_components/RequestActionPanel.tsx:37, 57-60)
const router = useRouter();
// ...
const onSubmitted = () => {
  router.refresh();
};

// After
// useRouter import / router 変数 / onSubmitted の refresh 行を削除。
// onSubmitted を不要にできるなら関数自体を削除し、dialog props には no-op を渡さず undefined 不可型のため空関数を渡すか、props 設計を不変としつつ空関数を渡す。
// 本タスクの最小変更方針: onSubmitted を空関数として残し型契約を維持する。
const onSubmitted = () => {
  // refresh は dialog 内で先発火済み。parent では local UI state 更新が無いため no-op。
};
```

`useRouter` import が他で未使用ならその行も削除する (lint clean)。

## 3. 副作用順序の保証

| 時点 | 動作 | 観測ポイント |
|------|------|------|
| `requestVisibilityChange`/`requestDelete` resolve, `res.ok === true` | `router.refresh()` 即時 schedule | mock router.refresh() が呼ばれる |
| 同 tick | `onSubmitted(res.accepted)` 同期実行 | parent callback 呼び出し |
| 同 tick | `onClose()` 同期実行 → `open=false` で `if (!open) return null` により unmount | dialog DOM 消滅 |

`router.refresh()` の fetch 完了は非同期だが、schedule は同期的。unmount 後の navigation API 呼び出し warning は schedule 完了前に unmount される事象が起因のため、本順序により解消される。

## 4. 設計上の判断

- **dialog 側で発火する理由**: parent 側で発火すると `onClose` → 親が再 render → `if (!open) return null` で dialog がアンマウントされた後に refresh が走るタイミングが生じ得る。dialog 内で先に schedule すれば、unmount 前に navigation API 呼び出しが完了する。
- **catch / error 分岐**: refresh は不要。エラー時は dialog を閉じないため、表示中の error message でユーザに通知する。
- **DUPLICATE_PENDING_REQUEST**: 既存挙動 (`onSubmitted` で server pending を表現) を維持。refresh は不要 (server state は既に pending なので fetch しても変化しない)。

## 5. 影響範囲

- 影響ファイル数: 6 (実装 3 + テスト 3)
- 影響する公開 API: なし
- 影響する型: なし
- 影響する D1 / API: なし
