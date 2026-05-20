# Phase 5: 実装

## 1. 実装手順 (順序固定)

### Step 1: VisibilityRequestDialog.tsx

1. `import { useRouter } from "next/navigation";` を既存 import 群に追加
2. `export function VisibilityRequestDialog({...})` 本体先頭付近 (state 宣言と同列) に `const router = useRouter();` を追加
3. `onSubmit` 関数内、`if (res.ok) {` 分岐の先頭に以下を 3 行で挿入:

```ts
if (res.ok) {
  router.refresh();
  onSubmitted(res.accepted);
  onClose();
}
```

旧 `onSubmitted(res.accepted); onClose();` の 2 行を `router.refresh(); onSubmitted(res.accepted); onClose();` の 3 行に置き換える。

### Step 2: DeleteRequestDialog.tsx

Step 1 と同じ手順を `DeleteRequestDialog.tsx` に適用。

### Step 3: RequestActionPanel.tsx

1. `onSubmitted` callback (line 57-60) から `router.refresh();` を削除:

```ts
const onSubmitted = () => {
  // refresh は dialog 内で先発火済み。parent では追加処理なし。
};
```

2. `useRouter` import が他 (file 内) で使われていないことを `rg "router\." apps/web/app/profile/_components/RequestActionPanel.tsx` で確認し、未使用なら `import { useRouter } from "next/navigation";` の行と `const router = useRouter();` の行を削除。

## 2. 差分プレビュー (実行前確認)

```diff
--- a/apps/web/app/profile/_components/VisibilityRequestDialog.tsx
+++ b/apps/web/app/profile/_components/VisibilityRequestDialog.tsx
@@
 "use client";

 import { ... } from "react";
+import { useRouter } from "next/navigation";
 import { ... } from "../../../src/lib/api/me-requests";
@@
 export function VisibilityRequestDialog({ ... }: VisibilityRequestDialogProps) {
+  const router = useRouter();
   const titleId = useId();
@@
   const onSubmit = async () => {
@@
     if (res.ok) {
+      router.refresh();
       onSubmitted(res.accepted);
       onClose();
     } else {
```

```diff
--- a/apps/web/app/profile/_components/DeleteRequestDialog.tsx
+++ b/apps/web/app/profile/_components/DeleteRequestDialog.tsx
@@
+import { useRouter } from "next/navigation";
@@
 export function DeleteRequestDialog({ ... }: DeleteRequestDialogProps) {
+  const router = useRouter();
@@
     if (res.ok) {
+      router.refresh();
       onSubmitted(res.accepted);
       onClose();
     }
```

```diff
--- a/apps/web/app/profile/_components/RequestActionPanel.tsx
+++ b/apps/web/app/profile/_components/RequestActionPanel.tsx
@@
 "use client";

 import { useState } from "react";
-import { useRouter } from "next/navigation";
 import { STABLE_KEY } from "@ubm-hyogo/shared";
@@
 export function RequestActionPanel({ ... }: RequestActionPanelProps) {
-  const router = useRouter();
   const [visibilityDialogState, setVisibilityDialogState] = ...
@@
   const onSubmitted = () => {
-    // pending は server state を正本にし、送信後は再取得して durable な banner を表示する（S1）
-    router.refresh();
+    // refresh は dialog 内で先発火済み（issue #766）。
+    // parent では追加の副作用なし。
   };
```

## 3. 実装直後の検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components
```

## 4. ロールバック手順

`git restore apps/web/app/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog,RequestActionPanel}.tsx` で原状復帰可能。

## 5. DoD (Phase 5 単体)

- [ ] 3 つの実装ファイルに差分プレビュー通りの変更が反映されている
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS (未使用 import は撤去済み)
- [ ] 既存テストが緑 (Phase 6 でテスト更新するまでは赤になる場合あり → 許容)
