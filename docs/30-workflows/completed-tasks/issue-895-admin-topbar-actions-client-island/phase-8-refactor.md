# Phase 8 — リファクタ

## 8.1 リファクタ方針

本タスクは「最小差分でグローバル操作 island を導入する」ことが目的。over-engineering を避ける。

## 8.2 やる

- `AdminTopbarActions.tsx` 冒頭 JSDoc に「責務境界」「client boundary」を明記（Phase 5 step 1 で実装済み）
- import 順序は既存プロジェクト規約（ESLint）に従う

## 8.3 やらない（NG リスト）

| 項目 | 理由 |
|------|------|
| AdminTopbar に `"use client"` 付与 | 認証ガード崩壊 / 不変条件 #11 fail-closed 破綻 |
| `(admin)/layout.tsx` の client 化 | 同上 |
| 新規 UI primitive（IconButton 等）追加 | 不変条件 3 違反 |
| `AdminTopbarActions` を server component 化して children に SignOutButton 渡す中間層化 | 中間 wrapper を増やすだけで意味なし |
| 通知ベル等の新規操作追加 | スコープ外（別タスク化） |
| HEX / arbitrary color の導入 | 不変条件 2 違反 / `verify-design-tokens` gate fail |
| SignOutButton 自体の props 改変 | 既存 contract を壊す。本タスクは流用のみ |

## 8.4 DoD

- 8.3 の NG リストに該当する変更が grep で 0 件
  - `grep -n '"use client"' apps/web/src/components/layout/AdminTopbar.tsx` → 0 件
  - `grep -n '"use client"' "apps/web/app/(admin)/layout.tsx"` → 0 件
- import 順序 lint pass
