---
phase: 4
title: データ契約 — Props / ref / focus event
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 4 — データ契約

[実装区分: 実装仕様書]

## 1. Props 契約（不変）

```ts
type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};
```

Next.js App Router の error boundary 規約（`app/error.tsx` の default export）に従い、本 Phase でも **変更しない**。

## 2. 内部 ref 契約（新規）

```ts
const headingRef = useRef<HTMLHeadingElement>(null);
```

- 型: `RefObject<HTMLHeadingElement>`
- 初期値: `null`
- mount 後: `<h1>` DOM element への参照
- unmount 後: React が `null` にリセット

## 3. focus 呼び出し契約

```ts
headingRef.current?.focus({ preventScroll: true });
```

| 項目 | 値 |
|------|---|
| メソッド | `HTMLElement.prototype.focus(options)` |
| `preventScroll` | `true`（既定の scroll-into-view を抑制） |
| optional chaining | `headingRef.current` が `null` の場合は no-op |
| 戻り値 | `void` |
| throw 条件 | 通常発生しない（DOM 不在時も optional chaining で skip） |

## 4. useEffect 副作用契約

```ts
useEffect(() => {
  logger.error({ event: "error.boundary.caught", digest: error.digest, err: error });
  headingRef.current?.focus({ preventScroll: true });
}, [error]);
```

| 項目 | 値 |
|------|---|
| deps | `[error]`（変更なし。既存と同一） |
| 実行順 | `logger.error` → `focus` の順固定 |
| cleanup 関数 | 不要（focus 移譲は冪等） |
| 実行タイミング | mount 後 + `error` prop 変更時 |

## 5. JSX 契約

h1 要素の attribute を以下のように拡張する:

```tsx
<h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-danger">
  画面を表示できませんでした
</h1>
```

| attribute | 値 | 役割 |
|-----------|---|------|
| `ref` | `headingRef` | DOM element 参照 |
| `tabIndex` | `-1` | programmatic focus 可能 / tab order 汚染なし |
| `className` | 不変 | 既存スタイルを維持 |

## 6. テスト契約

| アサーション | 期待値 |
|---|---|
| `screen.getByRole("heading", { level: 1 }).toHaveFocus()` | mount 後 true |
| `screen.getByText(/abc123/)` | digest が prop に含まれる場合に DOM 上に存在 |

`testing-library/jest-dom` の `toHaveFocus` matcher を使用する（既存 setup 済前提。Phase 6 で確認）。
