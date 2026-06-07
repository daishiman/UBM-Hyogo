---
phase: 5
name: 実装
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 5: 実装（GREEN）

Phase 4 の RED テスト（HT-1〜HT-7）を GREEN にし、2 consumer を hook へ置換する。
挙動不変（NON_VISUAL）が絶対条件。

## 5.1 変更ファイル一覧（[Feedback RT-03]）

| 区分 | パス | 内容 |
| --- | --- | --- |
| 新規 | `apps/web/src/hooks/useDismissable.ts` | 汎用 dismiss hook（本体） |
| 新規 | `apps/web/src/hooks/__tests__/useDismissable.spec.tsx` | hook 単体 spec（Phase 4 で設計・RED→GREEN） |
| 修正 | `apps/web/src/components/shell/SidebarUserMenu.tsx` | inline dismiss `useEffect`（L34-58）を hook 呼び出しへ置換 |
| 修正 | `apps/web/src/components/public/DensityToggle.client.tsx` | inline dismiss `useEffect`（L76-101）を hook 呼び出しへ置換 |
| 無改修（回帰） | `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 変更しない（回帰確認） |
| 無改修（回帰） | `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 変更しない（回帰確認） |

## 5.2 `useDismissable.ts` 実装コード

```ts
import { useEffect, type RefObject } from "react";
import { browserDocument } from "../lib/is-browser";

/** dismiss が発火した理由。呼び出し側で挙動を分岐するために渡す。 */
export type DismissReason = "pointerdown-outside" | "escape";

export interface UseDismissableOptions {
  /** false のとき listener を張らない（既定 true）。条件付き有効化に使う。 */
  readonly enabled?: boolean;
}

/**
 * 要素の外側 pointerdown / Escape キーで「閉じたい」契機を検知し `onClose(reason)` を呼ぶ汎用 hook。
 *
 * 設計上の不変条件:
 * - I-2: この hook は open state を所有しない。`<details>.open` の読み書きや React state 化は行わない。
 *   「開いているときだけ閉じる」等のガードと実際の close は、呼び出し側が `onClose` 内で行う。
 * - I-5: DOM へのアクセスは `browserDocument()` 経由のみ。SSR / Cloudflare Workers では
 *   `browserDocument()` が undefined を返すため副作用ゼロの no-op となり、throw しない。
 *
 * 安定化の注意: `onClose` はレンダー毎に新規生成すると listener が毎回 re-register される。
 * 呼び出し側で `useCallback` により安定参照にすること。
 *
 * @param ref     dismiss 領域の root 要素への参照（内側判定に `el.contains(target)` を使う）。
 * @param onClose 外側 pointerdown / Escape を検知したときに理由付きで呼ばれる。
 * @param options `enabled`（既定 true）で有効/無効を切り替える。
 */
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  onClose: (reason: DismissReason) => void,
  options?: UseDismissableOptions,
): void {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    const doc = browserDocument();
    if (!doc) return; // SSR / Workers: no-op (I-5)

    const onPointerDown = (event: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const target = event.target;
      if (target instanceof Node && el.contains(target)) return; // 内側は無視
      onClose("pointerdown-outside");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose("escape");
    };

    doc.addEventListener("pointerdown", onPointerDown);
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown);
      doc.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, onClose, enabled]);
}
```

> `import` パスは配置（`apps/web/src/hooks/`）からの相対で `../lib/is-browser`。
> `browserDocument` の実エクスポート名は `apps/web/src/lib/is-browser.ts` を確認して合わせる。

## 5.3 `SidebarUserMenu.tsx` Before / After

### Before（抜粋・L34-58 の dismiss `useEffect`）

```tsx
// import に browserDocument を含む
import { browserDocument } from "@/lib/is-browser"; // ← 直接 import（削除対象）

// route-close（L30-32・pathname 依存）— 残す
useEffect(() => {
  const d = detailsRef.current;
  if (d?.open) d.open = false;
}, [pathname]);

// dismiss（L34-58）— 削除対象
useEffect(() => {
  const doc = browserDocument();
  if (!doc) return;
  const closeIfOutside = (event: PointerEvent) => {
    const d = detailsRef.current;
    if (!d?.open) return;
    if (event.target instanceof Node && d.contains(event.target)) return;
    d.open = false;
  };
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    const d = detailsRef.current;
    if (d?.open) d.open = false;
  };
  doc.addEventListener("pointerdown", closeIfOutside);
  doc.addEventListener("keydown", closeOnEscape);
  return () => {
    doc.removeEventListener("pointerdown", closeIfOutside);
    doc.removeEventListener("keydown", closeOnEscape);
  };
}, []);
```

### After

```tsx
import { useCallback, useEffect, useRef } from "react"; // useCallback を追加
import { useDismissable } from "@/hooks/useDismissable"; // 追加
// browserDocument の直接 import は削除

// route-close（L30-32）はそのまま残す
useEffect(() => {
  const d = detailsRef.current;
  if (d?.open) d.open = false;
}, [pathname]);

// dismiss を hook へ集約（旧 L34-58 を置換）
const closeMenu = useCallback(() => {
  const d = detailsRef.current;
  if (d?.open) d.open = false;
}, []);
useDismissable(detailsRef, closeMenu);
```

- SidebarUserMenu は `reason` を使わない（両理由で同じ単純 close）。
- 旧 listener が持っていた「`d?.open` ガード」は `closeMenu` 内に移植済み（挙動不変）。

## 5.4 `DensityToggle.client.tsx` Before / After

### Before（抜粋・L76-101 の dismiss `useEffect` ＋ closeHelp）

```tsx
import { browserDocument } from "@/lib/is-browser"; // ← 直接 import（削除対象）

const closeHelp = useCallback(() => {            // L69-71（onDismiss へ統合可）
  const d = detailsRef.current;
  if (d?.open) d.open = false;
}, []);

useEffect(() => {                                 // L76-101（削除対象）
  const doc = browserDocument();
  if (!doc) return;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    const d = detailsRef.current;
    if (!d?.open) return;
    d.open = false;
    d.querySelector("summary")?.focus();
  };
  const onPointerDown = (event: PointerEvent) => {
    const d = detailsRef.current;
    if (!d?.open) return;
    if (event.target instanceof Node && d.contains(event.target)) return;
    d.open = false;
  };
  doc.addEventListener("keydown", onKeyDown);
  doc.addEventListener("pointerdown", onPointerDown);
  return () => {
    doc.removeEventListener("keydown", onKeyDown);
    doc.removeEventListener("pointerdown", onPointerDown);
  };
}, []);
```

### After

```tsx
import { useCallback } from "react";
import { useDismissable, type DismissReason } from "@/hooks/useDismissable"; // 追加
// browserDocument の直接 import は削除

// closeHelp は onDismiss に統合（reason 分岐で summary focus 復帰を保持）
const onDismiss = useCallback((reason: DismissReason) => {
  const d = detailsRef.current;
  if (!d?.open) return;
  d.open = false;
  if (reason === "escape") d.querySelector("summary")?.focus();
}, []);
useDismissable(detailsRef, onDismiss);
```

- **挙動差の保持**: DensityToggle のみ Escape 時に `summary` へ focus 復帰する。これは
  `reason === "escape"` 分岐で完全保持（旧 `onKeyDown` の挙動と同一）。外側 pointerdown 時は
  focus 復帰しない（旧 `onPointerDown` と同一）。
- `closeHelp` の他参照（例: `onChange` や明示ボタンからの close）があれば `onDismiss` に揃えるか、
  `closeHelp` を残して `onDismiss` から内部呼びしてもよい。**`onChange` 等の他ロジックは不変**。

## 5.5 import 整理（共通）

| ファイル | 削除 | 追加 |
| --- | --- | --- |
| SidebarUserMenu.tsx | `browserDocument` 直接 import | `useDismissable`、`useCallback`（未 import の場合） |
| DensityToggle.client.tsx | `browserDocument` 直接 import | `useDismissable`、`type DismissReason`（未 import の場合は `useCallback` も） |

`browserDocument` は hook 内部に隠蔽されるため、両 consumer から直接参照が消える。

## 5.6 実装順序

1. **hook + spec（RED→GREEN）**: `useDismissable.ts` を作成し、Phase 4 の `useDismissable.spec.tsx`
   （HT-1〜HT-7）を GREEN にする。
2. **SidebarUserMenu 置換**: §5.3 の After に置換し、既存 `SidebarUserMenu.spec.tsx` を**無改修**で全パス（AC-6）。
3. **DensityToggle 置換**: §5.4 の After に置換し、既存 `DensityToggle.client.spec.tsx` を**無改修**で全パス（AC-7）。
   特に TC-4（Escape→summary focus 復帰）が hook 化後も通ることを確認する。

## 5.7 DoD と検証コマンド

- ビルド成功・hook spec（HT-1〜HT-7）GREEN・2 consumer 既存 spec 無改修で全パス。
- JSDoc に I-2 / I-5 を明記し、`<details>.open` を React state 化しない（AC-8）。
- HEX 直書きなし（CSS 変更なしのため非該当だが念のため確認）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/hooks/__tests__/useDismissable.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```
