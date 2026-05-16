# Google API 認証とアプリ認証の分離

## 採用方針

認証は 2 系統に分ける。

1. Google Forms API 読み取り
   - サービスアカウント
   - schema sync / response sync 専用
2. 会員ログイン
   - Auth.js
   - Google OAuth を主導線、Magic Link を補助導線

この 2 つは同じ Google 系でも責務が違うため、鍵と権限を分離する。
実装先は `apps/web` のログイン UI と `apps/api` の認証確認・照合処理に分ける。

---

## Google Forms API 側

### 用途

- `forms.get`
- `forms.responses.list`
- 必要に応じた Drive 上のフォーム参照

### 必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` |
| `GOOGLE_PRIVATE_KEY` | `private_key` |
| `GOOGLE_FORM_ID` | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |

### 推奨スコープ

```text
https://www.googleapis.com/auth/forms.body.readonly
https://www.googleapis.com/auth/forms.responses.readonly
https://www.googleapis.com/auth/drive.readonly
```

更新系スコープは使わない。

---

## 会員ログイン側

### 認証基準

- 一致判定は `responseEmail`
- `responseEmail` は Google が自動収集した verified email
- フォーム項目の email 入力欄は前提にしない

### ログイン判定

1. `member_identities.response_email` を検索
2. `current_response_id` を取得
3. `member_status.rules_consent` を確認
4. `member_status.is_deleted` を確認
5. 条件を満たしたらセッションを作成

---

## `/login` の状態設計

`/no-access` 専用画面には依存しない。`/login` 自体が状態を持つ。

| 状態 | 条件 | 表示内容 |
|------|------|---------|
| `input` | 初期状態 | Google ログインとメールリンク入力 |
| `sent` | Magic Link 送信済み | メール確認案内 |
| `unregistered` | `responseEmail` 不一致 | Google Form 登録 CTA |
| `rules_declined` | `rulesConsent != consented` | 規約同意付き再回答 CTA |
| `deleted` | `isDeleted = true` | 管理者問い合わせ案内 |

登録・未同意・削除済みを別画面へ飛ばさず、ログイン導線の中で吸収する。

---

## サービスアカウントのセットアップ

1. Google Cloud Console で Forms API / Drive API を有効化
2. サービスアカウントを作成し、JSON キーをダウンロード
3. 対象フォームを Viewer 共有（サービスアカウントのメールアドレスを追加）
4. 秘密情報を以下のルールで設定する

| 変数名 | 本番/staging の設定先 | ローカルの設定先 | CI/CDの設定先 |
|--------|---------------------|----------------|--------------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Cloudflare Secrets | 1Password Environments | - |
| `GOOGLE_PRIVATE_KEY` | Cloudflare Secrets | 1Password Environments | - |
| `GOOGLE_FORM_ID` | Cloudflare Secrets | 1Password Environments | - |

**ルール**:
- 秘密鍵 JSON はリポジトリに含めない
- ローカル開発では `op run` コマンドで 1Password から取得する
- 平文 `.env` ファイルをコミットしない（`.env*` は operational artifact only）

---

## GAS prototype の扱い

`docs/00-getting-started-manual/gas-prototype/` は UI の叩き台であり、認証・API・DB 接続は未実装。
本番の認証仕様はこのファイルと `06-member-auth.md`, `13-mvp-auth.md` を正本とする。

---

## 内部 endpoint: `GET /auth/session-resolve`（apps/web → apps/api）

不変条件 #5（`apps/web` から D1 直接アクセス禁止）のため、
Auth.js v5 の `signIn` / `jwt` callback は `apps/web` で完結せず、
`apps/api` の internal endpoint を経由して member identity / admin 判定を解決する。

| 観点 | 値 |
|------|----|
| メソッド | `GET` |
| パス | `/auth/session-resolve?email=<email>` |
| 認証ヘッダ | `X-Internal-Auth: <INTERNAL_AUTH_SECRET>`（必須） |
| 入力 | `email` を lowercase normalize |
| 出力 | `{ memberId, isAdmin, gateReason }` |
| `gateReason` 列挙値 | `"unregistered" | "deleted" | "rules_declined" | null` |

レスポンス契約:

```ts
type GateReason = "unregistered" | "deleted" | "rules_declined";
type SessionResolveResponse = {
  memberId: string | null;
  isAdmin: boolean;
  gateReason: GateReason | null;
};
```

実装:

- 入口: `apps/api/src/routes/auth/session-resolve.ts`
- 認可 middleware: `apps/api/src/middleware/internal-auth.ts`（`INTERNAL_AUTH_SECRET` 比較のみ。D1 を触らない）
- 呼び出し元: `apps/web/src/lib/auth.ts`（Auth.js `signIn` / `jwt` callback から fetch）
- 共有型: `packages/shared/src/auth.ts`（`GateReason` / `SessionResolveResponse`）

### apps/web route handler 実装ガイドライン（Plan A lazy factory）

Next.js 16 + React 19 の prerender 経路で `next-auth` の静的 import が `useContext` null を誘発する再発を防ぐため、`apps/web/src/lib/auth.ts` は `getAuth()` lazy factory を正本入口とする。route handler / session helper は top-level で `auth` / `signIn` / `handlers` を import せず、実行時に `const { auth } = await getAuth()` / `const { handlers } = await getAuth()` / `const { signIn } = await getAuth()` で取得する。client 側 `oauth-client.ts` の Google OAuth 開始は `await import("next-auth/react")` 経由に限定する。

禁止:

- `apps/web/src/lib/auth.ts` で `next-auth` / `next-auth/providers/*` / `next-auth/jwt` を静的 import すること（`import type` / `typeof import(...)` も禁止。runtime `await import(...)` のみ可）
- `apps/web/app/api/**/route.ts` で `next-auth` を直接 import すること
- `apps/web/src/lib/auth/oauth-client.ts` で `next-auth/react` を top-level import すること

この規約は Issue #385 の Plan A 実装で導入したもので、Auth.js の意味論（Google OAuth / Magic Link / JWT session / session-resolve）は変更しない。さらに `.mise.toml` が local dev 用に `NODE_ENV=development` を注入するため、`apps/web/package.json` の `build` / `build:cloudflare` は `NODE_ENV=production` を明示し、production build の React dispatcher を安定化する。

### 必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `INTERNAL_AUTH_SECRET` | apps/web → apps/api の Worker-to-Worker 共有秘密。両 Worker の Cloudflare Secrets に同値で登録 |
| `AUTH_SECRET` | Auth.js cookie session JWT (HS256) と API 側 `verifySessionJwt` の共有秘密 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth Provider 用（apps/web のみ）。新規投入の推奨名 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth Provider 用 legacy alias。実装は互換のため読むが、新規投入では推奨しない |

### LHCI 用 test session JWT

Issue #630 successor `docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/` は、Lighthouse CI が authenticated `/profile` を計測するための test session JWT contract を固定する。

| 項目 | 正本 |
| --- | --- |
| 生成 script | `apps/web/scripts/lhci-auth-storage.ts` |
| 署名 API | `signSessionJwt(AUTH_SECRET, { memberId, email, isAdmin: false, name, ttlSeconds: 3600 })` |
| cookie | `authjs.session-token` / domain `localhost` / path `/` / httpOnly / sameSite `Lax` |
| 出力 | `apps/web/.lhci/storage-state.json`（commit 禁止） |
| 注入 script | `apps/web/lhci/lhci-auth.cjs` |
| mock API | `apps/web/scripts/lhci-profile-mock-api.ts` (`/health`, `/me`, `/me/profile`, `/me/attendance`) |
| 対象 | `http://localhost:3000/profile` のみ |
| refsPolicy | Issue #630 は CLOSED 済みのため後続 PR は `Refs #630` |

実 member / admin session の流用は禁止する。JWT には `memberId` / `email` / `isAdmin` 以外のプロフィール本文や回答本文を含めない。LHCI の Next Server Component fetch は `INTERNAL_API_BASE_URL=http://127.0.0.1:8787` に向け、test 専用 mock API で deterministic response を返す。

### Google OAuth staging / production completion runbook

05a で実装済みの Auth.js Google OAuth / admin gate は、実 Google Cloud Console 設定と Cloudflare Secrets 投入を伴う可視 smoke を後続タスク `ut-05a-followup-google-oauth-completion` に集約する。

| 正本 | パス |
| --- | --- |
| OAuth redirect URI matrix | `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/oauth-redirect-uri-matrix.md` |
| Secrets 配置 matrix | `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/secrets-placement-matrix.md` |
| Consent screen specification | `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/consent-screen-spec.md` |
| Manual smoke runbook | `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/manual-runbook.md` |

運用ルール:

- OAuth / Auth.js secret の実値はドキュメント、スクリーンショット、ログに残さない。
- Cloudflare Secrets は `bash scripts/cf.sh secret put ... --env <staging|production>` 経由で投入する。
- `wrangler login` によるローカル OAuth token 保持は禁止し、1Password `op://` 参照を正本にする。
- Google OAuth secret 名は `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を推奨名とし、`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` は既存互換 alias とする。

### Client 401 / 403 ハンドリング

parallel-10-auth-session-handling で確定した client 側 session 切れ / 権限不足の挙動を以下に固定する。

- 401 を client が受け取ったときは、`apps/web/src/features/admin/hooks/useAdminMutation.ts` 経由で `toLoginRedirect(currentPath)` を生成し `/login?redirect=<encoded>` へ navigation する。redirect path は `apps/web/src/lib/url/safe-redirect.ts` の `normalizeRedirectPath` を通し、`//`・`http(s)://`・backslash 含みは `/profile` fallback する（open redirect 防止）。
- 403 を受け取ったときは、`useAdminMutation` が `"権限がありません"` toast を `alert` variant（`role="alert"` / `aria-live="assertive"`）で表示し、`error` state にエラーを格納してフォーム状態を保持する。
- silent refresh は **MVP 不採用**。Auth.js の JWT は 24h TTL で、その範囲内の expiry は 401 catch → redirect で吸収する。Workers Paid + refresh token 取得が可能になった時点で再検討する。
