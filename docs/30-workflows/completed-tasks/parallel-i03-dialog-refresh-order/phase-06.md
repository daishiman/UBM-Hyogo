# Phase 06: 実装手順

## Step 1: VisibilityRequestDialog.tsx

```diff
+ import { useRouter } from "next/navigation";

  export function VisibilityRequestDialog(props: VisibilityRequestDialogProps) {
+   const router = useRouter();
    // ...
    const onSubmit = async () => {
      const res = await requestVisibilityChange({ /* ... */ });
      if (res.ok) {
+       router.refresh();
        onSubmitted(res.accepted);
        onClose();
      }
    };
  }
```

## Step 2: DeleteRequestDialog.tsx

`VisibilityRequestDialog` と同パターン。同じ 3 行 (`import`, `const router = useRouter()`, `router.refresh()`) を挿入する。

## Step 2-B: duplicate pending branch

`DUPLICATE_PENDING_REQUEST` でも旧 parent-owned refresh と同じ再取得を維持する。

```ts
if (res.code === "DUPLICATE_PENDING_REQUEST") {
  router.refresh();
  onSubmitted(existingPending);
}
```

## Step 3: RequestActionPanel.tsx

```diff
- import { useRouter } from "next/navigation";  // 他で未使用なら削除

  export function RequestActionPanel(/* ... */) {
-   const router = useRouter();                  // 同上
    // ...
    const onSubmitted = (accepted: QueueAccepted) => {
      // local state 更新
-     router.refresh();
    };
  }
```

> `useRouter` が他箇所で使われていれば import / hook は残置する。

## Step 4: テスト更新（詳細は Phase 07）

3 spec ファイルに `callOrder` assertion を追加。

## Step 5: 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components
```

すべて PASS を確認。

## Step 6: コミット (user 承認後)

```bash
git add apps/web/app/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog,RequestActionPanel}.tsx \
        apps/web/app/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog,RequestActionPanel}.component.spec.tsx
# commit message は phase-13.md 参照
```

## DoD

- [x] 3 component の diff が想定通り
- [x] 3 spec の diff が想定通り
- [x] typecheck / lint / spec 実行が PASS
- [x] `outputs/phase-06/implementation-steps.md` に diff サマリを記録
