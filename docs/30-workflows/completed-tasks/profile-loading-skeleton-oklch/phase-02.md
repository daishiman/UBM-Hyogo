# Phase 2: 設計

## 変更対象ファイル

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/app/profile/loading.tsx` | modify | skeleton 化（本体実装） |
| `apps/web/app/profile/loading.spec.tsx` | create | a11y / sr-only 属性検証 |
| `apps/web/src/styles/globals.css` | conditional modify | `bg-surface-2` utility が未定義の場合のみ最小追加 |

## ファイルレイアウト設計

### `apps/web/app/profile/loading.tsx` (After)

```tsx
import type { ReactElement } from "react";

export default function ProfileLoading(): ReactElement {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-3xl space-y-6 px-6 py-12"
      data-page="profile-loading"
    >
      <span className="sr-only">マイページを読み込み中</span>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-8 w-48 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-5/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-4/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-3/6 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
    </main>
  );
}
```

### 関数シグネチャ

```ts
export default function ProfileLoading(): ReactElement;
```

引数なし、副作用なし、純粋関数。

## class 設計

| className | 役割 | token 参照先 |
|-----------|------|--------------|
| `mx-auto max-w-3xl px-6 py-12` | コンテナ幅・余白（profile page と統一） | Tailwind core |
| `space-y-6 / space-y-3` | 縦リズム | Tailwind core |
| `bg-surface-2` | skeleton fill 色 | `--color-surface-2` → `--ubm-color-surface-bg-2` |
| `rounded-full / rounded` | 形状 | Tailwind core |
| `motion-safe:animate-pulse` | reduced-motion 尊重 pulse | Tailwind core |
| `sr-only` | screen reader 専用テキスト | Tailwind core |

`bg-surface-2` utility は `@theme inline` 経由で `var(--color-surface-2)` を解決する。Phase 5 の実装直前に `rg -n -e "--color-surface-2|--ubm-color-surface-bg-2|bg-surface-2" apps/web/src/styles apps/web/app/profile/loading.tsx` で実在を確認する。

## 入出力・副作用

| 時点 | 動作 |
|------|------|
| `/profile` streaming 中 | skeleton 表示 + sr-only `aria-live` アナウンス |
| streaming 完了 | Next.js が本体 page と差し替え |
| reduced-motion 有効 | pulse 停止、形状は維持 |

副作用なし（Server Component / 純粋 render）。

## エラーハンドリング

`loading.tsx` は Next.js App Router の Suspense placeholder であり、throw / catch 経路を持たない。
runtime error は `apps/web/app/error.tsx` (task-05) が補足する。

## 並列性 / 依存

- 独立: i01..i06 と編集対象ファイル重複なし
- 上流依存: design token bridge (`--color-surface-2`) が globals.css に存在すること（確認済み）

## 完了条件

- [ ] After 状態の `loading.tsx` 全文確定
- [ ] `bg-surface-2` utility の実在確認手順を Phase 5 に渡す
- [ ] テストファイル骨格を Phase 4 に渡す
