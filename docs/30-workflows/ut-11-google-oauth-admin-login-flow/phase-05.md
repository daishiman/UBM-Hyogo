# Phase 5: 実装ランブック: OAuth client 登録 / secrets 配線 / ローカル / staging / production

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 5 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-04（テスト戦略） |
| 下流 | phase-06（異常系検証） |

## 目的

Phase 2/3 で確定した採用案 A（素実装の OAuth + PKCE / JWT Cookie session / Secret allowlist / `apps/web/middleware.ts` admin gate）を、別タスクで実装する人が手順どおり実行できる粒度の **runbook + 擬似コード placeholder + sanity check** に落とす。Google Cloud Console の操作 → `wrangler secret put` → ローカル `wrangler pages dev` → staging / production デプロイの順序を固定する。

## 実行タスク

1. Google Cloud Console での OAuth client 登録 / redirect URI 3 環境分追加
2. `wrangler secret put` による secrets 配線（`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `SESSION_SECRET` / `ADMIN_EMAIL_ALLOWLIST`）
3. `apps/web/.dev.vars` 配置と `.gitignore` 確認
4. 新規 / 修正ファイルパス一覧の確定
5. `apps/web` の OAuth ルート / middleware / helper の placeholder 記述
6. ローカル動作確認（`wrangler pages dev`）の手順
7. staging / production への secret push と Workers デプロイ手順
8. sanity check（PKCE / state / Cookie / allowlist / middleware の実機確認）
9. 新規管理者の追加 runbook（AC-13）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/api-contract.md | endpoint I/O |
| 必須 | outputs/phase-02/architecture.md | Mermaid フロー |
| 必須 | outputs/phase-02/secrets.md | secrets / redirect URI |
| 必須 | outputs/phase-04/test-matrix.md | sanity check の test ID 紐付け |
| 必須 | docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/outputs/phase-12/implementation-guide.md | 配置済み secret 名 |
| 参考 | docs/30-workflows/02-application-implementation/05a-parallel-authjs-google-oauth-provider-and-admin-gate/phase-05.md | runbook フォーマット参照 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | wrangler secret 運用 |
| 参考 | CLAUDE.md | スタック / シークレット管理方針 |

## 実行手順

### ステップ 1: Google Cloud Console で OAuth client redirect URI 3 環境分を登録

| # | 操作 | 期待 |
| --- | --- | --- |
| O-01 | Google Cloud Console → 「API とサービス」→「認証情報」→ 既存 OAuth クライアント ID（01c で作成済）を開く | client 確認 |
| O-02 | 「承認済みのリダイレクト URI」に local 用 `http://localhost:3000/api/auth/callback/google` を追加 | local URL 登録 |
| O-03 | 同様に staging URL `https://<staging-domain>/api/auth/callback/google` を追加 | staging URL 登録 |
| O-04 | 同様に production URL `https://<production-domain>/api/auth/callback/google` を追加 | production URL 登録 |
| O-05 | OAuth 同意画面の「テストユーザー」に staging 動作確認用の管理者 Google アカウントを追加（pre-prod の場合） | テスト可能 |
| O-06 | client_id / client_secret は **再取得不要**（01c で 1Password に保存済） | 既存値を再利用 |

> 注: プレビューデプロイ URL（`*.pages.dev` 等の動的 URL）は redirect URI に登録しない。staging / production は固定ドメインに統一する（R1 緩和策）。

### ステップ 2: `wrangler secret put` による secrets 配線

```bash
# apps/web 用（Cloudflare Workers / Pages binding）
# SESSION_SECRET（本タスクで新規）32 byte 乱数を生成
openssl rand -base64 32 | wrangler pages secret put SESSION_SECRET --project-name <web-project>

# ADMIN_EMAIL_ALLOWLIST（本タスクで新規）カンマ区切り
echo "alice@example.com,bob@example.com" | wrangler pages secret put ADMIN_EMAIL_ALLOWLIST --project-name <web-project>

# GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET は 01c で配置済（再投入不要）
# 確認のみ
wrangler pages secret list --project-name <web-project>

# AUTH_REDIRECT_URI は wrangler.toml の [env.staging.vars] / [env.production.vars] に記述
# vars は Secret ではなく環境変数（公開可、URL は機密ではない）
```

> staging / production の両方で同じ手順を、`--env staging` / `--env production` 切替えで実施する。

### ステップ 3: `apps/web/.dev.vars` 配置とローカル準備

```bash
# apps/web/.dev.vars （リポジトリ外、git 管理しない）
GOOGLE_CLIENT_ID=...           # 1Password から取得
GOOGLE_CLIENT_SECRET=...       # 1Password から取得
SESSION_SECRET=...             # ローカル専用に openssl rand -base64 32 で生成
ADMIN_EMAIL_ALLOWLIST=alice@example.com
AUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

```bash
# .gitignore に含まれていることを確認
grep -q "^\.dev\.vars$\|apps/web/\.dev\.vars" .gitignore
# 無ければ追加
```

### ステップ 4: 新規 / 修正ファイル一覧

| 種別 | パス | 役割 |
| --- | --- | --- |
| 新規 | `apps/web/src/app/api/auth/login/route.ts` | OAuth 開始 |
| 新規 | `apps/web/src/app/api/auth/callback/google/route.ts` | callback 処理 |
| 新規 | `apps/web/src/app/api/auth/logout/route.ts` | ログアウト |
| 新規 | `apps/web/src/lib/oauth/pkce.ts` | code_verifier / challenge 生成 |
| 新規 | `apps/web/src/lib/oauth/state.ts` | state 生成 / 検証 |
| 新規 | `apps/web/src/lib/auth/session.ts` | JWT 署名 / 検証（HS256, Web Crypto） |
| 新規 | `apps/web/src/lib/auth/allowlist.ts` | カンマ区切り parse + lowercase 比較 |
| 新規 | `apps/web/src/lib/auth/cookies.ts` | Cookie 属性集中定義 |
| 新規 | `apps/web/middleware.ts` | `/admin/:path*` admin gate |
| 新規 | `apps/web/.dev.vars`（リポジトリ外） | ローカル secrets |
| 修正 | `apps/web/wrangler.toml` | `AUTH_REDIRECT_URI` vars 追加 |
| 修正 | `.gitignore` | `apps/web/.dev.vars` エントリ確認 |
| 修正 | `apps/web/.eslintrc.cjs` | `node:crypto` / D1 直接 import 禁止 rule |

> `apps/api` 側は本タスクでは新規ルートを追加しない（不変条件 #5 の D1 直接禁止に抵触しないよう、admin gate は edge middleware に閉じる）。

### ステップ 5: placeholder（実装は別タスク）

```ts
// apps/web/src/lib/oauth/pkce.ts (placeholder)
export function generateCodeVerifier(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return base64url(buf)
}

export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return base64url(new Uint8Array(hash))
}
```

```ts
// apps/web/src/lib/auth/session.ts (placeholder, HS256)
export async function signSessionJwt(payload: SessionClaims, secret: string): Promise<string> {
  // Web Crypto API の HMAC-SHA256 で JWS を組み立てる
}

export async function verifySessionJwt(token: string, secret: string): Promise<SessionClaims | null> {
  // signature 検証 + exp チェック。alg=HS256 以外は拒否
}
```

```ts
// apps/web/src/lib/auth/allowlist.ts (placeholder)
export function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [] // fail closed の根拠
  return [...new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))]
}

export function isAdminEmail(email: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return false // fail closed
  return allowlist.includes(email.trim().toLowerCase())
}
```

```ts
// apps/web/src/app/api/auth/login/route.ts (placeholder)
export async function GET(req: Request) {
  const verifier = generateCodeVerifier()
  const state = generateState()
  const challenge = await deriveCodeChallenge(verifier)
  const url = buildGoogleAuthorizeUrl({ challenge, state, redirectUri: env.AUTH_REDIRECT_URI })
  const res = NextResponse.redirect(url, 302)
  setTempCookie(res, "oauth_state", state)
  setTempCookie(res, "oauth_verifier", verifier)
  return res
}
```

```ts
// apps/web/src/app/api/auth/callback/google/route.ts (placeholder)
export async function GET(req: Request) {
  const { code, state } = parseQuery(req)
  const cookieState = req.cookies.get("oauth_state")?.value
  const verifier = req.cookies.get("oauth_verifier")?.value
  if (!cookieState || cookieState !== state) return badRequest("oauth_state_mismatch")
  if (!verifier) return badRequest("oauth_verifier_missing")

  const tokens = await exchangeCodeForToken({ code, verifier, redirectUri: env.AUTH_REDIRECT_URI })
  const userinfo = await fetchUserInfo(tokens.access_token)
  if (!userinfo.email_verified) return forbidden("email_not_verified")

  const allowlist = parseAllowlist(env.ADMIN_EMAIL_ALLOWLIST)
  if (!isAdminEmail(userinfo.email, allowlist)) return forbidden("not_in_allowlist")

  const jwt = await signSessionJwt({
    sub: userinfo.email,
    email: userinfo.email,
    isAdmin: true,
    iat: nowSec(),
    exp: nowSec() + 86400,
  }, env.SESSION_SECRET)

  const res = NextResponse.redirect(new URL("/admin", req.url), 302)
  setSessionCookie(res, jwt)
  clearTempCookies(res)
  return res
}
```

```ts
// apps/web/middleware.ts (placeholder)
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value
  if (!token) return NextResponse.redirect(new URL("/login", req.url))
  const claims = await verifySessionJwt(token, env.SESSION_SECRET)
  if (!claims) return NextResponse.redirect(new URL("/login", req.url))
  if (claims.isAdmin !== true) {
    const url = new URL("/login", req.url)
    url.searchParams.set("gate", "admin_required")
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}
export const config = { matcher: ["/admin/:path*"] }
```

### ステップ 6: ローカル動作確認（`wrangler pages dev`）

| # | 手順 | 期待 |
| --- | --- | --- |
| L-01 | `cd apps/web && pnpm dev` または `wrangler pages dev .next` | port 3000 listen |
| L-02 | `.dev.vars` が読み込まれる | `wrangler pages dev` ログに env 反映 |
| L-03 | ブラウザで `http://localhost:3000/login` を開き「Google でログイン」 | Google 認可画面に遷移 |
| L-04 | allowlist に登録した自分の Google アカウントで承認 | `/admin` に redirect、`session` Cookie 発行 |
| L-05 | DevTools で session Cookie 属性を確認 | `HttpOnly`, `SameSite=Lax`（local は Secure off） |
| L-06 | `/api/auth/logout` に GET | session Cookie が `Max-Age=0`、`/login` redirect |
| L-07 | allowlist 外の Google アカウントで再ログイン | 403 拒否画面 |

### ステップ 7: staging / production デプロイ

| # | 手順 | 期待 |
| --- | --- | --- |
| D-01 | feature ブランチを `dev` に PR → merge | staging Workers が自動デプロイ |
| D-02 | `wrangler pages secret list --env staging` で 4 secret（GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / SESSION_SECRET / ADMIN_EMAIL_ALLOWLIST）が揃っていることを確認 | 4 件確認 |
| D-03 | staging URL で L-03〜L-07 と同じ smoke を実施 | OK |
| D-04 | `dev` を `main` に PR → merge | production Workers が自動デプロイ |
| D-05 | production の secret 確認、redirect URI 登録確認 | OK |
| D-06 | production smoke（管理者 1 名がログインできるか） | OK |

### ステップ 8: sanity check（test ID 紐付け）

| # | 手順 | 期待 | 紐付け test ID |
| --- | --- | --- | --- |
| S-01 | `/api/auth/login` を叩く | 302 で Google にリダイレクト、`oauth_state` / `oauth_verifier` Cookie 発行 | P-03, P-04, ST-02, CK-01, CK-02 |
| S-02 | callback URL に state を改ざんしてアクセス | 400 `oauth_state_mismatch` | ST-04 |
| S-03 | allowlist 外のアカウントで callback 完了 | 403 | AL-04 |
| S-04 | allowlist 内のアカウントで callback 完了 | session Cookie 発行 + `/admin` 302 | CK-03, J-01 |
| S-05 | session Cookie 無しで `/admin/dashboard` | 302 → `/login` | MW-01 |
| S-06 | 偽 JWT Cookie で `/admin/dashboard` | 302 → `/login` | MW-03 |
| S-07 | `?bypass=true` 付きで `/admin/dashboard` | 無視されて 302 | MW-08 |
| S-08 | `/api/auth/logout` | session Cookie 失効、`/login` 302 | CK-04 |
| S-09 | `ADMIN_EMAIL_ALLOWLIST` を空文字に差し替えて再試行 | 全員 403（fail closed） | AL-05 |

### ステップ 9: 新規管理者追加 runbook（AC-13）

| # | 手順 |
| --- | --- |
| N-01 | 既存管理者が候補者の Google アドレスを確認（個人 Gmail or Workspace） |
| N-02 | 候補者を Google Cloud Console の OAuth 同意画面「テストユーザー」に追加（pre-prod の場合のみ） |
| N-03 | 既存の `ADMIN_EMAIL_ALLOWLIST` 値に候補者 email をカンマ区切りで追加 |
| N-04 | `echo "...,new@x.com" \| wrangler pages secret put ADMIN_EMAIL_ALLOWLIST --env <env>` で更新 |
| N-05 | Workers / Pages を再デプロイ（secret 更新は再デプロイで反映） |
| N-06 | 新規管理者がログインできることを smoke |
| N-07 | 1Password「Environments」項目に最新 allowlist 値を反映 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | sanity check で再現したい異常系 ID を引き継ぎ |
| Phase 7 | runbook 完了条件 ↔ AC × test ID |
| Phase 9 | secret hygiene チェック、`node:crypto` lint rule |
| Phase 11 | redirect URI 3 環境 smoke（R1） |
| Phase 12 | implementation-guide.md に runbook を取り込み |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #5（apps/web → D1 禁止） | 本タスクで `apps/api` に新規ルートを追加せず、D1 へのアクセスは発生しない。allowlist は Secret 文字列で完結 | #5 |
| #6（GAS prototype 非昇格） | placeholder で Web Crypto API のみを使い、Node.js / GAS の `crypto` を踏襲しない | #6 |
| secret hygiene | `wrangler secret put` のみ、`.env` / `.dev.vars` をリポジトリにコミットしない | - |
| 運用性 | redirect URI 3 環境登録 → secrets 4 種配線 → smoke の固定順序 | - |
| 可逆性 | Secret 削除で全管理者を即座にロックアウトできる（fail closed） | - |
| 観測性 | callback の各分岐で構造化ログ（`event="oauth_callback"`, `outcome="state_mismatch"|"allowlist_deny"|"issued"`）を残す placeholder | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | OAuth client redirect URI 登録 | 5 | pending | O-01〜O-06 |
| 2 | wrangler secret put | 5 | pending | 4 secret |
| 3 | `.dev.vars` + `.gitignore` 確認 | 5 | pending | AC-10 |
| 4 | 新規 / 修正ファイル一覧 | 5 | pending | 上表 |
| 5 | placeholder 記述 | 5 | pending | pkce / state / session / allowlist / route / middleware |
| 6 | ローカル動作確認手順 | 5 | pending | L-01〜L-07 |
| 7 | staging / production デプロイ | 5 | pending | D-01〜D-06 |
| 8 | sanity check | 5 | pending | S-01〜S-09 |
| 9 | 新規管理者追加 runbook | 5 | pending | N-01〜N-07 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 サマリ |
| ドキュメント | outputs/phase-05/runbook.md | 実装手順 + placeholder + sanity check + 新規管理者追加 |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] 9 サブタスクの placeholder / 手順が runbook に記載
- [ ] sanity check S-01〜S-09 が test ID と紐付け
- [ ] 新規 / 修正ファイル一覧が完備
- [ ] secrets 4 種（`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `ADMIN_EMAIL_ALLOWLIST`）の配線手順
- [ ] redirect URI 3 環境分（local / staging / production）の登録手順
- [ ] 新規管理者追加 runbook（AC-13）が記載
- [ ] placeholder に実値（client_id / secret）が含まれていない

## タスク 100% 実行確認

- [ ] 全 9 サブタスクが completed
- [ ] outputs/phase-05/main.md と runbook.md が配置
- [ ] 不変条件 #5 / #6 を破る placeholder が無い（D1 直接アクセス無し、Node.js `crypto` 不使用）
- [ ] `.gitignore` 確認手順が含まれる（AC-10）
- [ ] 次 Phase へ sanity check の各 S-XX を異常系の入力として引継ぎ

## 次 Phase

- 次: 6（異常系検証）
- 引き継ぎ事項: sanity check の S-XX を異常系 failure case の前提として渡す
- ブロック条件: runbook が placeholder のみで埋まっていない場合は進まない
