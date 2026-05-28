# Phase 1 — Requirements（横断版）

## 1. 全画面調査結果

`grep -rn "PublicHeader\|MemberHeader\|<header"` および各 layout / page 確認により以下を確定。

| Route | Header source | Session-aware | 現状の問題 |
|-------|---------------|---------------|----------|
| `/` (`app/page.tsx`) | `<PublicHeader />` 直 import | NO | 常に「ログイン」 |
| `/(public)/members` | `(public)/layout.tsx` → `<PublicHeader />` | NO | 同上 |
| `/(public)/members/[id]` | 同上 | NO | 同上 |
| `/(public)/register` | 同上 | NO | 同上 |
| `/privacy` | **ヘッダなし** | — | ナビ導線消失 |
| `/terms` | **ヘッダなし** | — | ナビ導線消失 |
| `/login` | 独自 shell (`LoginShell`) | NO | ログイン済みでも `/login` に滞在可（リダイレクトなし） |
| `/(member)/profile` | `MemberHeader` | 部分（SignOut あり） | 管理者でも「管理」リンクなし |
| `/(admin)/*` | `AdminSidebar` | YES（既存） | 「公開サイトに戻る」リンクなし |

## 2. ユーザー要求の全画面適用

ユーザー要求「ログインしているのにログインボタンが表示される。マイページ / プロフィール / 編集画面に飛べるようにする。UI/UX を整える」を **全画面共通契約** として展開:

| 状態 | 公開系で表示するもの | 会員系で表示するもの | 管理系で表示するもの |
|------|---------------------|---------------------|---------------------|
| guest | 「ログイン」CTA | （/profile への直接アクセスは redirect で防ぐ。既存挙動） | 同上 |
| member | 「マイページ」+「ログアウト」 | 既存（マイページ / 公開ページ / ログアウト） | N/A |
| admin | 「マイページ」+「管理」+「ログアウト」 | 既存 + 「管理」リンク追加 | 既存 + 「公開サイトに戻る」追加 |

## 3. AC（全画面横断）

### AC-Global（全 PublicHeader 適用画面）

| ID | 入力 | 期待 |
|----|------|------|
| AC-G1 | guest | `data-auth-state="guest"`、`data-role="auth-cta"` (`/login`) |
| AC-G2 | member | `data-auth-state="member"`、`data-role="member-cta"` (`/profile`) + `SignOutButton` |
| AC-G3 | admin | `data-auth-state="admin"`、上記 + `data-role="admin-cta"` (`/admin`) |
| AC-G4 | session 取得失敗 | guest 扱い（fail-closed） |

### AC-Public-Pages（個別画面適用）

| ID | 画面 | 条件 |
|----|------|------|
| AC-P1 | `/` | `<PublicHeader />` の async 化に対応してビルド・SSR が成立 |
| AC-P2 | `/(public)/*` | layout.tsx の async 化 or `<PublicHeader />` 直書きが React 19 で成立 |
| AC-P3 | `/privacy` | `<PublicHeader />` + `<PublicFooter />` をマウントし、`/(public)` 配下と同等の shell |
| AC-P4 | `/terms` | 同上 |

### AC-Login

| ID | 入力 | 期待 |
|----|------|------|
| AC-L1 | guest が `/login` 到達 | 既存通り LoginCard 表示 |
| AC-L2 | member が `/login` 到達 | `/profile` に redirect |
| AC-L3 | admin が `/login` 到達 | `/profile` に redirect（admin への分岐は別タスク化しない） |
| AC-L4 | `searchParams.next` 指定 + ログイン済み | `next` を validate（同一オリジン path のみ）後 redirect、不正値時は `/profile` |

### AC-Member-Header

| ID | 入力 | 期待 |
|----|------|------|
| AC-M1 | session admin === true | MemberHeader 内に「管理」リンク (`href="/admin"`, `data-role="admin-cta"`) |
| AC-M2 | session admin !== true | 「管理」リンク非表示 |
| AC-M3 | session 取得失敗 | header は最小描画（brand のみ）→ middleware で `/login` 誘導される既存経路を阻害しない |

### AC-Admin-Sidebar

| ID | 入力 | 期待 |
|----|------|------|
| AC-A1 | 任意の admin session | sidebar 下部に「公開サイトに戻る」リンク (`href="/"`, `data-role="public-return"`) |

### AC-E2E（横断）

| ID | 内容 |
|----|------|
| AC-E1 | Playwright で guest storageState / member storageState / admin storageState の 3 状態 × `/`, `/members`, `/register`, `/privacy`, `/terms`, `/profile`, `/admin` で `data-auth-state` 属性を検証 |

## 4. 非機能要件

- a11y: 追加リンクには `aria-label` を明示。
- テスタビリティ: `data-auth-state` / `data-role` で Playwright / Vitest 判定。
- SSR 整合: hydration mismatch を発生させない（全 header は server-side で auth view を確定）。
- パフォーマンス: `auth()` 呼出は各画面 1 回のみ。layout で取得して props で配信する設計を許容。

## 5. スコープ外

- middleware (`apps/web/middleware.ts`) の変更
- Auth.js provider 設定変更
- `(admin)` 配下の個別ページ改修（既に sidebar 経由で動線確保済）
- 新 endpoint 追加 / D1 schema 変更
- プロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/`) 改訂
