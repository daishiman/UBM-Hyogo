# 実装ガイド: require-auth-public-access-gate

「ログインしないと情報が見られない」状態を実現する。`/login` を除く全ルートを認証必須にし、
未認証アクセスには「ログインが必要です」案内画面を表示する。UI ゲートだけでは公開 API を直接叩けば
情報が取得できてしまうため、API 側のアクセスゲート（会員セッション or 内部サービス認証）も同一サイクルで実装した。

---

## Part 1: 中学生にもわかる説明（例え話「鍵のかかった部屋」）

- これまで公開ページは「**誰でも入れる部屋**」だった。これからは「**会員証（ログイン）を見せないと入れない部屋**」にする。
- 会員証が無い人にはドアの前で「**ログインが必要です**」という張り紙（案内画面）を見せ、
  「ログインする」ボタンで受付（`/login`）へ案内する。会員証を見せた人だけ部屋の中身（会員情報・統計・登録フォーム）を見られる。
- ただし**裏口**（ブラウザを使わず API を直接叩く経路）も同じ鍵で閉めないと意味がない。だから API 側にも鍵をかけ、
  鍵を持たない人には「401（権限がありません）」を返す。
- 一方で、館内の**スタッフ**（サイトマップ生成・OG 画像ワーカーという裏方プログラム）は人間の会員証を持たない。
  彼らには「**職員パス（内部認証 `X-Internal-Auth`）**」を渡し、これまでどおり仕事ができるようにした。

これで「ログインしないと、画面からも API からも情報が一切見えない」状態になった。

---

## Part 2: 技術者向け詳細

### 変更ファイル一覧

| # | ファイル | 種別 | concern | 責務 |
|---|---------|------|---------|------|
| C1-1 | `apps/web/src/components/auth/LoginRequiredNotice.tsx` | 新規 | C1 | 「ログインが必要です」案内画面（Server Component） |
| C1-2 | `apps/web/app/(public)/layout.tsx` | 修正 | C1 | `getSession()` ゲート・未認証時 notice 返却・children 非 render |
| C2-1 | `apps/api/src/middleware/require-public-access.ts` | 新規 | C2 | 「会員セッション OR 内部認証」ガード middleware |
| C2-2 | `apps/api/src/routes/public/index.ts` | 修正 | C2 | `createPublicRouter()` 冒頭に `requirePublicAccess` 適用 |
| C2-3 | `apps/web/src/lib/fetch/public.ts` | 修正 | C2 | RSC 実行時に session cookie を API へ転送 |
| C2-4 | `apps/web/app/sitemap.ts` | 修正 | C2 | `/public/members` fetch に `X-Internal-Auth` 付与 |
| C2-5 | `apps/og/src/member-source.ts` | 修正 | C2 | service binding / HTTP fetch に `X-Internal-Auth` 付与・`OgEnv` 型拡張 |
| env | `apps/web/src/lib/env.ts` | 修正 | C2 | `PublicFetchEnv` に `INTERNAL_AUTH_SECRET` 追加 |
| specs | `00-overview.md` / `02-auth.md` / `06-member-auth.md` / `01-api-schema.md` | 修正 | AC-11 | アクセス制御記述を「全ルート認証必須」へ是正 |

### 型・API

```ts
// LoginRequiredNotice
export interface LoginRequiredNoticeProps { readonly redirectTo?: string; }
// CTA: /login?redirect=${encodeURIComponent(redirectTo ?? "/")}

// require-public-access
export interface RequirePublicAccessEnv {
  readonly AUTH_SECRET?: string;          // 会員セッション JWT 検証
  readonly INTERNAL_AUTH_SECRET?: string; // サーバー間内部認証
}
export const requirePublicAccess: MiddlewareHandler;
//  1. Authorization: Bearer / Cookie(authjs.session-token) を verifySessionJwt → 成功なら next()
//  2. X-Internal-Auth を INTERNAL_AUTH_SECRET と timing-safe 比較 → 一致なら next()
//  3. いずれも無し → c.json({ error: "unauthorized" }, 401)
```

### 認証経路マトリクス

| 入口 | 認証手段 | 結果 |
|------|---------|------|
| ブラウザ（認証済み会員） | Cookie session（web RSC が転送） | 200 / コンテンツ表示 |
| sitemap 生成（web server） | `X-Internal-Auth` | 200 |
| OG 画像ワーカー（apps/og） | `X-Internal-Auth`（service binding） | 200 |
| 外部の未認証アクセス | なし | **401 / 案内画面** |

### fail-closed 設計

- `(public)/layout.tsx`: `getSession()` が throw しても `catch` で `session=null` に倒し notice を返す。未認証時は `SidebarShellServer` も描画しない（nav 経由の情報漏れ防止）。children を返さないため page の RSC データ取得が走らない（事前 fetch も遮断）。
- `require-public-access.ts`: JWT 検証失敗・`AUTH_SECRET` 未設定・`INTERNAL_AUTH_SECRET` 未設定（内部経路のみ）は全て 401（公開しない）。`timingSafeEqual` は長さ差・先頭一致で early-return しない。

### テスト（全 GREEN）

| spec | 件数 | 内容 |
|------|------|------|
| `LoginRequiredNotice.spec.tsx`（新規） | 6 | notice 描画 / 見出し / CTA href encode / 既定値 / axe |
| `(public)/layout.spec.tsx`（追記） | 12 | 未認証→notice / 認証済み→shell+children / throw fail-closed / RSC 非 fetch |
| `require-public-access.authz.spec.ts`（新規） | — | 401 / Bearer 200 / Cookie 200 / 壊れ jwt 401 / 内部認証 200 / 誤 secret 401 / secret 未設定 401 |
| `index.contract.spec.ts`（追記） | — | 4 endpoint の無認証 401 / 内部認証 200 / session 200 |
| `member-source.spec.ts`（追記） | — | service binding / HTTP に `X-Internal-Auth` 付与 |
| `sitemap.spec.ts`（新規） | 3 | fetch に `X-Internal-Auth` 付与 / 未設定で空文字 / env アクセサ経由 |
| `public.spec.ts`（追記） | — | session cookie 転送 |

### ローカル検証結果

- typecheck: `@ubm-hyogo/web` / `@ubm-hyogo/api` / `@ubm-hyogo/og` 全て tsc エラー 0
- lint: web / api / og 全て pass（HEX 直書き 0）
- 対象 spec targeted run: web 41 / og 23 / api 対象 spec 全 GREEN

### 視覚証跡（VISUAL）

`outputs/phase-11/screenshots/` の visual evidence:
- `members-unauth-login-required-local.png`（captured: local `http://localhost:3001/members`、未認証 → 案内画面）
- `public-members-authenticated.png`（認証済み → 本来コンテンツ）

認証済み staging screenshot は staging deploy / 認証操作が必要なため user-gated。ローカルのコンポーネント/レイアウトテストで描画分岐は機械的に検証済み。
