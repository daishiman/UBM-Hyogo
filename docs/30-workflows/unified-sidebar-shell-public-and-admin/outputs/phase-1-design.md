# Phase 1: 設計目標と適用範囲

## ゴール

- 3 層（公開 / 会員 / 管理）の navigation shell を**単一の `SidebarShell` primitive** に統一する
- shell は collapsible / mobile drawer / 左下 UserMenu を内包する
- 既存の admin shell が持つ機能（schemaDiff badge、3 グループ nav、SignOut）を欠落させない

## 採用するシェル形態

```
┌──────────────────────────────────────┐
│ ┌─────┐ ┌──────────────────────┐    │
│ │     │ │                       │    │
│ │ S   │ │       main            │    │
│ │ I   │ │                       │    │
│ │ D   │ │                       │    │
│ │ E   │ │                       │    │
│ │ B   │ │                       │    │
│ │ A   │ │                       │    │
│ │ R   │ │                       │    │
│ │     │ │                       │    │
│ │ ─── │ │                       │    │
│ │ user│ │                       │    │
│ └─────┘ └──────────────────────┘    │
└──────────────────────────────────────┘
```

- 横幅: 展開 272px / 折り畳み 64px
- breakpoint:
  - `>= 1024px (lg)`: persistent sidebar（折り畳みトグルあり）
  - `768〜1023px (md)`: persistent sidebar（**初期 collapsed**）
  - `< 768px`: hidden + hamburger（topbar 16px ストリップ）→ drawer overlay

## ロール別の nav 構成

| グループ | viewer | member | admin |
|---------|--------|--------|-------|
| PUBLIC（ホーム / メンバー / 登録） | ✓ | ✓ | ✓ |
| MEMBERS（マイページ） | × | ✓ | ✓ |
| ADMIN（ダッシュボード / 出席分析 / 会員管理 / タグキュー / schema / 開催日 / 依頼キュー / Identity 重複 / 監査ログ） | × | × | ✓ |

ロール降格時（ログアウト / admin 剥奪）は **session 再取得**で nav が縮退する。
client 側でロール判定 hack（メール allowlist 等）は行わない。

## 左下 UserMenu の仕様

| 状態 | アバター | クリック動作 |
|------|---------|------------|
| viewer | guest icon | `/login` へ遷移 |
| member | initials + displayName | popover: `/profile`（参照）, `/profile/edit-request`（編集申請＝既存遷移先）, **ログアウト** |
| admin | initials + displayName + admin badge | popover: `/profile`（参照）, `/profile/edit-request`, **管理者ダッシュボード /admin**, **ログアウト** |

- collapsed 時はアバターのみ表示。popover は右側（lg 時）／上方向（モバイル drawer 時）に展開
- popover 実装は新規 primitive を生やさず、`apps/web/src/components/ui/popover.tsx` が無ければ
  CSS-only な `<details>` または既存 admin の dropdown を活用（Task B で詳述）

## 不採用案

- **Top header + Sidebar の併存**: 視覚的負債が増える。Top は hamburger だけ残す（< md）
- **Member 用と Admin 用で別 shell を維持**: 重複が温存される。今回統合する
- **Sidebar 表示状態を server cookie で永続化**: 初期実装では `localStorage` のみ。SSR フラッシュ回避のため `data-shell-collapsed` 属性を root layout で読まない

## 受け入れ条件（全タスク共通の上位 AC）

1. `/`, `/profile`, `/admin` の 3 画面で同一の sidebar primitive が描画される（同 DOM 構造）
2. lg / md / sm で expected breakpoint 挙動（persistent / collapsed / drawer）が成立
3. 左下 UserMenu の 3 ロールでそれぞれ正しい action 集合が表示される
4. admin role では public 3 + members 1 + admin 9 = 13 nav item が描画される
5. `pnpm typecheck && pnpm lint && pnpm --filter @ubm/web test` グリーン
