# parallel-i03-dialog-refresh-order: profile request dialog で router.refresh() 順序を spec 通りに修正

**[実装区分: 実装仕様書]** — コード変更を伴う

## 目的

`parallel-02-state-sync` spec 4.2 (line 95-117) が明示する**呼び出し順序固定ルール**:

```
1) router.refresh()
2) onSubmitted(res.accepted)
3) onClose()
```

が、実コードでは `RequestActionPanel.tsx:57` の `onSubmitted` callback 内で
`router.refresh()` を呼ぶ実装になっており、dialog が `onClose()` で unmount された後に
parent callback が refresh を発火する可能性がある（"unmounted component から navigation API
呼び出し" warning および race condition のリスク）。

本タスクは spec 通りの順序固定を **dialog component 内**で実施する。

## スコープ

### 含む
- `VisibilityRequestDialog.tsx` 内の onSubmit 成功時 path で `router.refresh()` を最先に発火
- `DeleteRequestDialog.tsx` 同様
- `RequestActionPanel.tsx` の `onSubmitted` callback から `router.refresh()` を撤去
- 関連 component spec で順序の検証

### 含まない
- mutation endpoint 変更
- banner UI の変更
- QueueAccepted 型の変更

## 変更対象ファイル

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | modify | `useRouter` import + `onSubmit` 内で `router.refresh()` を first 発火 |
| `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | modify | 同上 |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | modify | `onSubmitted` callback から `router.refresh()` 撤去（parent 側で重複発火しない） |
| `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx` | modify | 呼び出し順序の検証 |
| `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx` | modify | 同上 |

## 設計

### VisibilityRequestDialog.tsx

**Before** (現状: line 78 付近):
```ts
const res = await requestVisibilityChange({...});
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
  router.refresh();           // 1) Server Component 再 fetch 先発火
  onSubmitted(res.accepted);  // 2) parent 通知
  onClose();                  // 3) unmount は最後
}
```

`else` / `catch` 分岐は変更しない（spec の race condition 対象は成功 path のみ）。

### DeleteRequestDialog.tsx

`VisibilityRequestDialog` と同パターン。同じ順序で 3 行を追加。

### RequestActionPanel.tsx

**Before** (line 57):
```ts
const onSubmitted = () => {
  ...
  router.refresh();
};
```

**After**:
```ts
const onSubmitted = () => {
  // local UI state の更新のみ。refresh は dialog 側で発火済み。
  ...
};
```

`useRouter()` の import が他用途で使われていない場合は削除（lint clean）。

## 関数シグネチャ

`onSubmitted: (accepted: QueueAccepted) => void` の型は不変。
dialog props も不変（既存 caller への破壊なし）。

## 入出力・副作用

| 時点 | 動作 |
|------|------|
| mutation success | `router.refresh()` 即時 schedule → server component が次 commit で再 fetch |
| `onSubmitted()` | parent local state 更新（必要に応じて） |
| `onClose()` | dialog unmount。この時点で refresh は既に scheduled |

副作用順序の保証により、unmount 後の navigation API 呼び出し warning を排除。

## テスト方針

### `VisibilityRequestDialog.component.spec.tsx`

`vi.mock("next/navigation", ...)` で `useRouter` をモックし、`mockRouter.refresh` の call order を検証:

```ts
const callOrder: string[] = [];
const refresh = vi.fn(() => callOrder.push("refresh"));
const onSubmitted = vi.fn(() => callOrder.push("onSubmitted"));
const onClose = vi.fn(() => callOrder.push("onClose"));

// ... submit success path
expect(callOrder).toEqual(["refresh", "onSubmitted", "onClose"]);
```

### `DeleteRequestDialog.component.spec.tsx`

同一パターンを適用。

### `RequestActionPanel.component.spec.tsx`

`router.refresh` mock が**呼ばれない**ことを assert（dialog 側で発火済みのため duplicate なし）。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components
```

## DoD

- [ ] `VisibilityRequestDialog.tsx` で `router.refresh() → onSubmitted → onClose` の順
- [ ] `DeleteRequestDialog.tsx` 同上
- [ ] `RequestActionPanel.tsx` の `onSubmitted` から `router.refresh()` 撤去
- [ ] 各 dialog component spec で順序 assertion PASS
- [ ] `RequestActionPanel.component.spec.tsx` で refresh が parent から発火しないこと確認
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] dev で profile 操作 → mutation 成功 → banner 即時更新を目視

## リスク

| リスク | 対策 |
|--------|------|
| `router.refresh()` を 2 重発火（dialog + parent） | `RequestActionPanel.tsx` から確実に撤去。test で assert |
| `useRouter` を server component から呼び出す場合 | dialog は既に client component（`"use client"` directive あり）のため問題なし |
| catch 分岐で refresh が必要なケース | 現状 spec / UI 設計では成功時のみ refresh。catch では error toast のみで refresh 不要 |

## 並列性

- 独立: i01, i02, i04, i05 と編集対象ファイル重複なし
- 依存: なし

## スコープ確定ノート

このタスクは canonical workflow root へ昇格するか、in-place fix で完結するかをここで明示する。

- **status**: pending
- **canonical_workflow**: null（in-place fix で完結予定）
- **判断**: 編集は dialog 2 件 + parent 1 件の呼び出し順序入れ替えのみ。p-02 spec の race condition 解消が目的で実装規模が小さいため、Phase 1-13 のフル昇格は不要と判断。本 spec.md を発注書として in-place fix で完結させる。実装中に dialog API 設計変更が必要になった場合は canonical workflow root へ昇格させ `artifacts.json` を更新する。
