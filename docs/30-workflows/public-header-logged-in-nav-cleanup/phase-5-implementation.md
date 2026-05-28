# Phase 5 — Implementation（オーケストレーション）

横断スコープに伴い実装仕様は `tasks/` 配下に 7 ファイル分割。本書はオーケストレーション概要のみ。

## タスク一覧

| Task | スコープ | 仕様書 | 並列可否 |
|------|---------|--------|---------|
| A | `AuthView` 基盤 + `PublicHeader` async 化 + `(public)/layout.tsx` | `tasks/task-a-public-header-session-aware.md` | 単独先行 |
| B | Root `/` (`app/page.tsx`) で async PublicHeader を mount | `tasks/task-b-root-page-public-header-async.md` | A 後・C/D/E/F と並列可 |
| C | `/privacy`, `/terms` を公開シェルに統一 | `tasks/task-c-privacy-terms-public-shell.md` | A 後・並列可 |
| D | `/login` のログイン済みリダイレクト + `safeNext()` | `tasks/task-d-login-redirect-when-authenticated.md` | A 並列可（A 非依存） |
| E | `MemberHeader` admin リンク + session 配線 | `tasks/task-e-member-header-admin-link.md` | A 後（`AuthView` 利用）・並列可 |
| F | `AdminSidebar` 「公開サイトに戻る」 | `tasks/task-f-admin-sidebar-public-return.md` | 単独実装可 |
| G | Playwright e2e (3 状態 × 7 routes) | `tasks/task-g-auth-slot-e2e.md` | A-F 完了後 |

## 全体 DoD

- 上記 7 タスク全てが各自 DoD を満たすこと
- `pnpm typecheck` / `pnpm lint` が green
- 公開系全 7 routes (`/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`, `/profile`, `/admin`) で `data-auth-state` 属性が期待値であること
- staging 環境で session cookie 保持時にトップ・各 public ページの右上が「マイページ / ログアウト」に切り替わること（PR にスクリーンショット添付）

## CONST_007 適合確認

全 7 タスクが 1 サイクル / 1 PR で完了。先送りなし。新 endpoint / D1 schema / Google Form 変更なし。
