# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-26 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

`/login`, `/profile` のページツリー、Server / Client 境界、AuthGateState ↔ UI 対応、API fetch 仕様を確定する。

## 実行タスク

1. ページツリー
2. Server / Client 境界
3. AuthGateState UI 対応表
4. data fetching 設計
5. session middleware 動作

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | URL contract |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | 5 状態 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives |
| 参考 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証 |

## 実行手順

### ステップ 1: page tree

```
apps/web/app/
├── login/
│   ├── page.tsx                     # Server: gate-state を query から決定 + UI render
│   ├── _components/
│   │   ├── LoginPanel.client.tsx    # Client: form + state 切替
│   │   └── MagicLinkForm.client.tsx # Client: email + submit + cooldown
│   └── error.tsx                    # error boundary
├── profile/
│   ├── page.tsx                     # Server: session 必須 + 04b /me + /me/profile fetch
│   ├── _components/
│   │   ├── StatusSummary.tsx        # Server: rulesConsent / publicConsent / publishState
│   │   ├── ProfileFields.tsx        # Server: stableKey 経由参照のみ
│   │   ├── EditCta.tsx              # Server: editResponseUrl button + responderUrl link
│   │   └── AttendanceList.tsx       # Server: 参加履歴
│   ├── loading.tsx                  # streaming
│   ├── error.tsx                    # error boundary
│   └── not-found.tsx                # session あるが member 未解決時
└── api/auth/
    └── callback/
        ├── email/route.ts           # 05b の magic link 検証 callback
        └── google/route.ts          # 05a の Google OAuth callback
```

### ステップ 2: Server / Client 境界

| route | Server | Client |
| --- | --- | --- |
| `/login` | gate-state 解決、UI shell | LoginPanel（state 切替）、MagicLinkForm（cooldown） |
| `/profile` | session lookup + 04b fetch | なし（profile は表示専用） |

### ステップ 3: AuthGateState ↔ UI

| state | Banner | 主 CTA | 副 CTA |
| --- | --- | --- | --- |
| `input` | なし | MagicLinkForm + Google OAuth ボタン | `/register` link |
| `sent` | success | 「メールをご確認ください」+ 60s cooldown | 別メールで再送 |
| `unregistered` | warn | `/register` ボタン | お問い合わせ |
| `rules_declined` | warn | Google Form responderUrl | `/register` 説明 |
| `deleted` | error | 管理者問い合わせ link | （ログイン不可） |

### ステップ 4: data fetching

```ts
// /login: searchParams から state を読み取り
import { z } from "zod"
const loginQuerySchema = z.object({
  state: z.enum(["input","sent","unregistered","rules_declined","deleted"]).default("input"),
  email: z.string().email().optional(),
  redirect: z.string().startsWith("/").default("/profile"),
})

// /profile: server で session + /me + /me/profile を Promise.all
const [me, profile] = await Promise.all([
  fetchAuthed<MeView>("/me"),
  fetchAuthed<MemberProfile>("/me/profile"),
])
```

| 場所 | 方法 | revalidate |
| --- | --- | --- |
| `/login` | RSC + searchParams（fetch なし） | static (no fetch) |
| `/profile` | RSC + Auth.js session cookie 転送 + 04b fetch | `0`（dynamic、session ベース） |
| `/profile` 参加履歴 | 04b の `/me` 含み | 0 |

### ステップ 5: session middleware

```ts
// apps/web/middleware.ts
export async function middleware(req) {
  const url = new URL(req.url)
  if (url.pathname.startsWith("/profile")) {
    const session = await getSession(req)
    if (!session) {
      const redirect = `/login?redirect=${encodeURIComponent(url.pathname)}`
      return NextResponse.redirect(new URL(redirect, req.url))
    }
  }
}
export const config = { matcher: ["/profile/:path*"] }
```

### ステップ 6: env

| 変数 | 種別 | 用途 |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | var | apps/api ベース URL |
| `AUTH_URL` | var | Auth.js base URL（05a/b 共有） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計代替案レビュー |
| Phase 4 | UI 状態 × test ID 行列 |
| Phase 5 | runbook |

## 多角的チェック観点

- 不変条件 #4: `/profile` の Server / Client いずれにも編集 form 配置なし
- 不変条件 #5: 全 fetch は apps/api 経由（D1 直接禁止）
- 不変条件 #6: Client にも `window.UBM` 参照なし
- 不変条件 #7: session.memberId のみ参照、responseId は API レスポンス内のみ使用
- 不変条件 #8: `/login` 状態は URL query 正本（localStorage なし）
- 不変条件 #9: `/no-access` ルート存在しない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | page tree | 2 | pending | 2 ルート |
| 2 | Server/Client 境界 | 2 | pending | minimal client |
| 3 | AuthGateState UI 表 | 2 | pending | 5 行 |
| 4 | data fetching | 2 | pending | revalidate 0 |
| 5 | session middleware | 2 | pending | matcher /profile/:path* |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 設計サマリ |
| ドキュメント | outputs/phase-02/page-tree.md | ツリー |
| ドキュメント | outputs/phase-02/auth-gate-state-ui.md | 5 状態 × UI |
| ドキュメント | outputs/phase-02/data-fetching.md | fetch + middleware |
| メタ | artifacts.json | phase 2 status |

## 完了条件

- [ ] 4 種ドキュメント生成
- [ ] 5 状態 × UI 表完成
- [ ] session middleware 設計記載
- [ ] env 変数特定

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- 4 種ドキュメント配置
- 不変条件 #4, #5, #6, #7, #8, #9 への対応が明示
- 次 Phase で代替案レビュー可能

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: AuthGateState UI 対応 5 行、middleware 設計
- ブロック条件: AuthGateState ↔ UI 対応に未確定行があれば進まない
