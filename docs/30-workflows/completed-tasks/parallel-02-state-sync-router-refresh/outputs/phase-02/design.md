# Phase 02: 設計

## onSubmit シグネチャ（dialog 共通方針）

```ts
const onSubmit = async () => {
  setPending(true);
  try {
    const res = await <client>(args);
    if (res.ok) {
      router.refresh();      // 1. server state を Next App Router に再 fetch 指示
      onSubmitted(res.accepted); // 2. parent bridge: accepted を渡し banner ロード時の橋渡し
      onClose();             // 3. dialog unmount（最後）
    } else {
      // failure: refresh しない / setError(res.code) のみ
    }
  } catch (err) { ... } finally { setPending(false); }
};
```

## 呼び出し順序（不変条件 #6）

`router.refresh() → onSubmitted() → onClose()` 固定。理由:

- `router.refresh()` は次 render 時の RSC 再 fetch を schedule するため、unmount 前に呼ぶ必要がある（unmount 後の呼び出しは React の dev warning 対象）
- `onSubmitted` は parent が pending banner を bridge 表示するための accepted 引き渡し
- `onClose` は dialog unmount。最後でないと内部状態の clean up 中に refresh が走り、不整合の温床になる

## failure path 方針

- HTTP 409 (`DUPLICATE_PENDING_REQUEST`) / 422 (`INVALID_REQUEST`) / 401 (`UNAUTHORIZED`) / 5xx (`SERVER`): `router.refresh()` を呼ばず `setError(code)` のみ
- 例外: `DUPLICATE_PENDING_REQUEST` のみ「既存 pending 表示の橋渡し」として `onSubmitted(existingPendingPlaceholder)` を呼ぶ（既存挙動を踏襲）。refresh は依然として呼ばない

## RequestActionPanel.tsx の役割再定義

| Before | After |
| --- | --- |
| `onSubmitted` callback 内で `router.refresh()` を呼ぶ（dialog unmount 後タイミング） | `onSubmitted` は accepted response を bridge state に保存し、refresh は dialog ローカルに移譲 |

bridge state は server reads が反映されるまでの一時表示用。次回 RSC fetch で `pendingRequests` が server から返ると Banner が server state に切替わる。

## 影響範囲

- `apps/web/app/profile/_components/VisibilityRequestDialog.tsx`
- `apps/web/app/profile/_components/DeleteRequestDialog.tsx`
- `apps/web/app/profile/_components/RequestActionPanel.tsx`
- 3 つの `*.component.spec.tsx`

## 不変条件確認

- API / D1 / token / `apps/api` 配下無変更
- `next/navigation` の `useRouter` を dialog 内で個別 hook 呼び出し（React idiom）
