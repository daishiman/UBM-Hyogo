# Phase 2: 設計: OAuth + PKCE フロー / session Cookie / admin gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 2 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-01（要件定義） |
| 下流 | phase-03（設計レビュー） |

## 目的

Phase 1 で確定した要件を、`apps/web`（Next.js App Router via `@opennextjs/cloudflare`）上で実現する **ルート / Cookie / middleware / secret** の具体構造に落とし込む。OAuth 2.0 Authorization Code Flow + PKCE、state による CSRF 対策、session JWT、admin gate、ローカル開発手順を Phase 5 ランブックの runnable spec として準備する。`apps/api`（Hono Workers）は本タスクのログインフローを所有しない。

## 構造（Mermaid）

```mermaid
flowchart LR
  Browser[ブラウザ] -->|/login クリック| LoginRoute[apps/web /api/auth/login]
  LoginRoute -->|gen code_verifier and state| TempCookie[(HttpOnly Cookie<br/>oauth_state oauth_verifier 10min)]
  LoginRoute -->|302 with code_challenge S256| Google[Google OAuth 2.0]
  Google -->|callback code state| CallbackRoute[apps/web /api/auth/callback/google]
  CallbackRoute -->|verify state vs cookie| CallbackRoute
  CallbackRoute -->|POST token exchange code+verifier| GoogleToken[Google token endpoint]
  GoogleToken -->|id_token access_token| CallbackRoute
  CallbackRoute -->|GET userinfo| GoogleUserInfo[Google userinfo]
  GoogleUserInfo -->|email verified=true| CallbackRoute
  CallbackRoute -->|email in ALLOWLIST?| Allowlist[(ADMIN_EMAIL_ALLOWLIST<br/>Cloudflare Secret)]
  Allowlist -->|ok| IssueSession[sign JWT with SESSION_SECRET]
  Allowlist -->|ng| Forbidden[403 access denied]
  IssueSession -->|Set-Cookie session HttpOnly Secure SameSite=Lax| Browser
  IssueSession -->|302| AdminHome[/admin]

  Browser -->|/admin/*| EdgeMW[apps/web middleware.ts]
  EdgeMW -->|verify session JWT| EdgeMW
  EdgeMW -->|valid + isAdmin| AdminPages[/admin pages]
  EdgeMW -->|invalid| LoginPage[/login]

  Browser -->|/api/auth/logout| LogoutRoute[apps/web /api/auth/logout]
  LogoutRoute -->|Set-Cookie session=; Max-Age=0| Browser
  LogoutRoute -->|302| LoginPage
```

## モジュール設計

| ファイル | 役割 |
| --- | --- |
| `apps/web/src/app/api/auth/login/route.ts` | Authorization 開始: code_verifier / state 生成 → 一時 Cookie 保存 → Google 認可 URL に 302 |
| `apps/web/src/app/api/auth/callback/google/route.ts` | code 受領 → state 検証 → token 交換 → userinfo 取得 → ホワイトリスト照合 → session 発行 |
| `apps/web/src/app/api/auth/logout/route.ts` | session Cookie の即時失効 + `/login` redirect |
| `apps/web/src/lib/oauth/pkce.ts` | `generateCodeVerifier()` / `deriveCodeChallenge(verifier)`（Web Crypto API） |
| `apps/web/src/lib/oauth/state.ts` | `generateState()` / `verifyState(received, stored)` |
| `apps/web/src/lib/auth/session.ts` | `signSessionJwt(payload, secret)` / `verifySessionJwt(token, secret)`（HMAC-SHA256） |
| `apps/web/src/lib/auth/allowlist.ts` | `parseAllowlist(secretValue)` / `isAdminEmail(email, allowlist)` |
| `apps/web/src/lib/auth/cookies.ts` | session Cookie 属性、temp Cookie 属性の集中定義 |
| `apps/web/middleware.ts` | matcher `['/admin/:path*']`、JWT verify + `isAdmin === true` で gate |
| `apps/web/.dev.vars` | ローカル secret（`.gitignore` 必須） |
| `apps/web/wrangler.toml` | redirect URI 用 vars（`AUTH_REDIRECT_URI`） |

`apps/api` 側は本タスクでは新規ルート不要（admin gate は edge middleware に閉じる）。将来 `requireAdmin` を Hono に追加する余地は残すが本スコープ外。

## API contract

### `GET /api/auth/login`
- 入力: なし（任意で `?next=/admin/...`）
- 処理:
  1. `code_verifier`（32 byte 乱数 → Base64URL）、`state`（16 byte 乱数 → Base64URL）を生成
  2. 一時 Cookie 設定（`oauth_state`, `oauth_verifier`、属性: `HttpOnly; Secure; SameSite=Lax; Path=/api/auth/callback/google; Max-Age=600`）
  3. `code_challenge = BASE64URL(SHA256(code_verifier))`
  4. Google 認可 URL を組み立て: `https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=AUTH_REDIRECT_URI&response_type=code&scope=openid email&state=...&code_challenge=...&code_challenge_method=S256&access_type=online&prompt=select_account`
  5. 302 redirect

### `GET /api/auth/callback/google`
- 入力: query `code`, `state`, （error 時 `error`）
- 処理:
  1. `state` query と `oauth_state` Cookie の **完全一致** を検証 → 不一致は **400**
  2. `oauth_verifier` Cookie を取り出し、両一時 Cookie を即時失効
  3. `POST https://oauth2.googleapis.com/token` に `code`, `code_verifier`, `client_id`, `client_secret`, `redirect_uri`, `grant_type=authorization_code`
  4. `GET https://openidconnect.googleapis.com/v1/userinfo` で email / `email_verified` を取得
  5. `email_verified !== true` → 403
  6. `parseAllowlist(ADMIN_EMAIL_ALLOWLIST)` に email が含まれない → 403（拒否ページ or JSON）
  7. session JWT を `signSessionJwt({ sub, email, role: "admin", iat, exp: now+24h }, SESSION_SECRET)` で発行
  8. `Set-Cookie: admin_session=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`
  9. state に紐付けて保存した safe `next`（相対 `/admin` 配下のみ）へ 302

### `POST /api/auth/logout`（GET も許容）
- 入力: なし
- 処理: `Set-Cookie: session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax` → `/login` へ 302

### `apps/web/middleware.ts`
- matcher: `['/admin/:path*']`
- 処理:
  1. Cookie `session` 取得 → 無ければ `/login` redirect
  2. `verifySessionJwt(token, SESSION_SECRET)` 失敗 → `/login` redirect
  3. `payload.role !== "admin"` → `/login?gate=admin_required`
  4. ok → `NextResponse.next()`

## session JWT 構造

```ts
type SessionJwt = {
  sub: string;          // email hash or stable admin subject
  email: string;
  role: "admin";        // 発行時点でホワイトリスト合致が前提
  iat: number;
  exp: number;          // 24h
};
```

- アルゴリズム: HS256（`SESSION_SECRET` 256bit 以上）
- profile 本文 / picture / 個人情報を含めない
- refresh は本タスク外（exp 切れたら再ログイン）

## 統合テスト連携

| 下流 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 本 Phase の API contract を test matrix に展開 |
| Phase 5 | 本 Phase の architecture / secrets / admin gate を runbook に反映 |
| Phase 7 | AC-1〜AC-13 と T-01〜T-15 を trace |

## env / secrets

| 名前 | 用途 | 配置先 | 新規 / 既存 |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client id | Cloudflare Secrets | 既存（01c で配置済） |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Cloudflare Secrets | 既存（01c で配置済） |
| `SESSION_SECRET` | session JWT 署名鍵（256bit） | Cloudflare Secrets | **本タスクで新規** |
| `ADMIN_EMAIL_ALLOWLIST` | 管理者メールホワイトリスト（カンマ区切り） | Cloudflare Secrets | **本タスクで新規** |
| `AUTH_REDIRECT_URI` | OAuth redirect URI（環境別 URL） | wrangler vars | 本タスクで新規 |
| ローカル | `.dev.vars`（`apps/web/.dev.vars`） | リポジトリ外、`.gitignore` 必須 | - |

## redirect URI（Google Cloud Console 登録）

| 環境 | URI |
| --- | --- |
| local | `http://localhost:3000/api/auth/callback/google` または `wrangler pages dev` のポート |
| staging | `https://<staging-domain>/api/auth/callback/google` |
| production | `https://<production-domain>/api/auth/callback/google` |

> 完全一致が要件。プレビューデプロイ URL は OAuth に使わず、staging 固定 URL に統一する方針（誤一致を防ぐ）。

## Cookie 属性まとめ

| Cookie | Path | Max-Age | 属性 |
| --- | --- | --- | --- |
| `oauth_state` | `/api/auth/callback/google` | 600（10 分） | HttpOnly; Secure; SameSite=Lax |
| `oauth_verifier` | `/api/auth/callback/google` | 600 | HttpOnly; Secure; SameSite=Lax |
| `session` | `/` | 86400（24h） | HttpOnly; Secure; SameSite=Lax |

ローカル開発時のみ `Secure` を外せる仕組み（`process.env.NODE_ENV` 相当）を `cookies.ts` に集約。

## ホワイトリストパース仕様

```
input:  "alice@example.com, bob@example.com ,charlie@example.com"
output: ["alice@example.com", "bob@example.com", "charlie@example.com"]
```

- 比較は **lowercase 正規化 + 完全一致**
- 空文字 / 重複は除去
- 0 件の場合は全員 403（fail closed）

## dependency matrix

| 依存先 | 提供物 | 受け取り場所 |
| --- | --- | --- |
| 01c bootstrap | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | `wrangler secret`（既配置） |
| 02-serial monorepo | `apps/web` route handler 配置箇所、`middleware.ts` 配置箇所 | 設計上の前提 |
| UT-03 | 同一 OAuth client 利用、secret 名重複なし | secret 表で確認 |

## 4 条件再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 認証境界が確定し、後続管理機能が着手可能 |
| 実現性 | PASS | Web Crypto API で PKCE / JWT 実装可能、Next.js Middleware は Workers Edge 互換 |
| 整合性 | PASS | UT-03 と secret 共有しつつ責務分離、CLAUDE.md スタックに整合 |
| 運用性 | PASS | secrets は Cloudflare Secrets 体系、ホワイトリスト更新は Secret 1 個の差し替えで完結 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | PKCE 必須、state CSRF 検証、JWT 署名 HS256 with `SESSION_SECRET` ≥ 256bit、Cookie 属性 | - |
| privacy | JWT に email / isAdmin 以外載せない | - |
| 権限境界 | 認証成功 ≠ 認可成功、ホワイトリスト 0 件は全員拒否（fail closed） | - |
| dependency | apps/web から D1 直接アクセスなし（D1 は本タスクで使わない） | #5 |
| Edge 互換 | `crypto.subtle` / `crypto.getRandomValues` のみ使用、Node.js `crypto` 不使用 | - |
| 観測性 | callback の主要分岐（state mismatch / userinfo / allowlist deny / token issued）に構造化ログを残す | - |
| 運用性 | redirect URI 3 環境登録、`.dev.vars` の `.gitignore` 確認、新規管理者追加 runbook | #6（GAS prototype を踏襲しない） |

## サブタスク管理

- [ ] Mermaid 図を `outputs/phase-02/architecture.md` に転記
- [ ] API contract を `outputs/phase-02/api-contract.md` に転記
- [ ] admin gate middleware の責務分離図を `outputs/phase-02/admin-gate-flow.md` に作成
- [ ] env / secrets / redirect URI 表を `outputs/phase-02/secrets.md` に転記
- [ ] PKCE / state / JWT helper の関数 signature を `outputs/phase-02/main.md` に確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | scope / AC / 依存関係 |
| 必須 | phase-01.md | true issue / 4 条件 / 不変条件 |
| 参考 | docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/outputs/phase-12/implementation-guide.md | 配置済み secret 名 |
| 参考 | .claude/skills/aiworkflow-requirements/references/csrf-state-parameter.md | state 設計根拠 |
| 参考 | .claude/skills/aiworkflow-requirements/references/security-principles.md | OAuth + PKCE / session 原則 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | Phase 2 サマリ |
| 設計 | outputs/phase-02/architecture.md | Mermaid 構造図 |
| 設計 | outputs/phase-02/admin-gate-flow.md | middleware 責務分離 |
| 設計 | outputs/phase-02/api-contract.md | endpoint signature 一覧 |
| 設計 | outputs/phase-02/secrets.md | env / secrets / redirect URI 表 |

## 完了条件

- [ ] module 設計表 / API contract / Mermaid 図 / Cookie 属性表 / session JWT 構造が記載
- [ ] env / secrets / redirect URI 3 環境表が確定
- [ ] PKCE / state 実装が Web Crypto API ベースで spec 化されている
- [ ] admin gate が `apps/web/middleware.ts` 単独で完結することが明示

## タスク 100% 実行確認

- [ ] Mermaid 図に Browser → Google → callback → session 発行のフローが含まれる
- [ ] state 検証 / PKCE / ホワイトリスト照合の 3 段階すべて記載
- [ ] JWT に profile 本文 / picture / 個人情報が **載っていない** ことを spec で明示
- [ ] `apps/web` から D1 直接呼び出しが **無い** ことを設計で確認（本タスクは D1 不使用）
- [ ] redirect URI が local / staging / production の 3 件登録される spec
- [ ] Node.js `crypto` を使わず Web Crypto API のみ使う方針が明示

## 次 Phase

Phase 3（設計レビュー）で次を判定:
- alternative: Auth.js v5 等のライブラリ採用 vs 素実装
- alternative: session storage に KV / D1 採用 vs JWT Cookie のみ
- alternative: ホワイトリストを D1 テーブル化 vs Secret 文字列
- PASS / MINOR / MAJOR を確定

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する
