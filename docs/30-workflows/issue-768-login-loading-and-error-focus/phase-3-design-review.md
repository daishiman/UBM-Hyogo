# Phase 3: 設計レビュー

## 1. 設計妥当性チェック

| 観点 | 結論 | 根拠 |
|---|---|---|
| 不変条件 1 (Google Form schema) | 影響なし | login boundary のみ、schema 触らず |
| 不変条件 2 (consent key) | 影響なし | consent 非関与 |
| 不変条件 5 (D1 直接アクセス禁止) | 遵守 | client / SSR ともに D1 binding 未使用 |
| design tokens 正本 (task-08/09) | 遵守 | OKLch token (`--ubm-color-surface-2`) のみ使用、HEX 直書きなし |
| primitive 正本 (task-10) | 遵守 | 既存 `Card` / `CardContent` 使用、新規 primitive 追加なし |
| Next.js App Router 規約 | 遵守 | loading.tsx は server component、error.tsx は client component (`"use client"`) |
| a11y 基準 | 遵守 | role / aria-live / aria-busy / focus 移譲 / sr-only すべて適用 |

## 2. 代替案検討

| 案 | 採用可否 | 理由 |
|---|---|---|
| A. `useAutoFocusOnMount(ref)` 共通 hook を i05 内で抽出 | 不採用 | parent spec の横展開メモが「i05/i06 完了後に refactor として抽出」と明示。i05 単独での先行抽出は scope 拡大 |
| B. `aria-live="polite"` に降格 | 不採用 | error boundary は緊急性が高く、`assertive` が WCAG 推奨 |
| C. Card layout を best-effort → optional | 不採用 | `Card` primitive が既存（`apps/web/src/components/ui/Card.tsx`）のため必須項目に昇格 |
| D. focus 後に `scrollIntoView` 追加 | 不採用 | `preventScroll: true` で scroll jump 抑止が目的。追加 scroll は逆行 |

## 3. リスクと緩和策

| リスク | 影響 | 緩和策 |
|---|---|---|
| StrictMode 二重 render 中の double-focus | 軽微（focus 安定） | optional chain と `useEffect` dep に `error` のみ指定 |
| `Card` primitive の className 競合 | 視覚崩れ | `space-y-4 p-6` のみ追加、既存 Card デフォルトを上書きしない |
| `bg-surface-2` utility 未定義 | skeleton 透明化 | Phase 5 着手前に grep 確認、未定義時のみ `globals.css` に追加 |
| Vitest jsdom 環境で `.focus()` 失敗 | テスト不安定 | `@testing-library/react` の `act` でラップ、`toHaveFocus()` matcher を使う |
| Next.js 16 / Turbopack で loading.tsx hydration mismatch | render 失敗 | server component のまま keep、client directive を付けない |

## 4. 横展開メモ確認

- i06 (root error focus) 着手時に `useAutoFocusOnMount(ref)` hook を `apps/web/src/lib/a11y/` 配下に抽出し、i05/i06 双方で import に置換する。本 spec では hook 抽出を行わない。

## 5. レビュー結論

設計は parent spec / 既存資産（Card primitive, OKLch token）と整合。**Phase 4 以降へ進行可**。
