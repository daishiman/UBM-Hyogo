# Phase 05: 実装計画

## ファイル別変更計画

### `VisibilityRequestDialog.tsx`

- `import { useRouter } from "next/navigation";` を追加
- 関数本体に `const router = useRouter();` を追加
- `onSubmit` の success branch (`res.ok` 内) で:
  - `router.refresh();` を `onSubmitted(res.accepted)` の前に追加
- failure branch は不変（refresh を呼ばない）

### `DeleteRequestDialog.tsx`

- 同上のパターンを適用

### `RequestActionPanel.tsx`

- `onSubmitted` callback 内に存在した `router.refresh()` を削除
- accepted response を `useState` に保存し、`RequestPendingBanner` へ橋渡し
- server reads（`/me/profile` の `pendingRequests`）が反映されるまでの一時 fallback として bridge state を使用

### `*.component.spec.tsx` 3 件

- `vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshSpy }) }))`
- ケース追加:
  - success: refresh が 1 回呼ばれ、`onSubmitted` → `onClose` の順
  - 409 / 422 / 401 / 5xx: refresh が呼ばれない
  - RequestActionPanel: refresh が呼ばれない（dialog 側に移譲）

## ロールバック方針

- 失敗時は `git restore apps/web/app/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog,RequestActionPanel}.tsx` および 3 spec ファイル

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
```
