# Phase 3: 設計レビュー

## 検討した代替案

| 設計判断 | 採用 | 代替 | 採用理由 |
| --- | --- | --- | --- |
| admin gate 配置 | `app/(admin)/layout.tsx` 内 `auth()` | `middleware.ts` matcher | Edge runtime コスト削減、Server Component で JWT 一度のみ復号 |
| data fetch | Server Component + `router.refresh()` | Client + SWR 全面 | hydration cost 削減・1 fetch 集約しやすい |
| MemberDrawer の tag UI | `Link` 経由 (`/admin/tags?memberId=...`) | drawer 内 inline 編集 | 不変条件 #13 を物理的に遵守 |
| ESLint rule | `no-restricted-imports` patterns | カスタム rule plugin | 標準機能のみで十分、メンテ容易 |
| schema dry-run UI | 将来枠のみ確保 | 今回実装 | 07b workflow 未完成 |

## レビュー結果

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 価値性 | ✅ | 1 fetch dashboard + queue 集約で運用自走可能 |
| 実現性 | ✅ | 全 endpoint 稼働、UI primitives 完備 |
| 整合性 | ✅ | 不変条件 7 件すべてに設計上の防御策あり |
| 運用性 | ✅ | 07a/b/c へ resolve / aliases / attendance POST で handoff |

## ブロッカー

なし。Phase 4 (テスト戦略) へ進行可。

## 設計上の前提

- `apps/web/app/(admin)/` の route group で 5 画面を構成（既存 `layout.tsx` を更新）
- mutation はすべて `INTERNAL_API_BASE_URL` 経由ではなく、ブラウザから直接 `/api/...` プロキシまたは Cloudflare Workers 同一 Origin 経由（NextAuth セッション cookie ベース）。本タスクでは `fetch("/admin/...")` で同一 Origin に投げる前提（実際のルーティングは Cloudflare Pages routing で apps/api に渡す既存方針に従う）。
- Server Component からは `INTERNAL_API_BASE_URL + INTERNAL_AUTH_SECRET` 経由で fetch
