# Phase 12 Implementation Guide

## Part 1: 初学者向け説明

### なぜ必要か

管理画面は、会の大事な情報を扱う入口です。誰でも入れると、名簿や運営情報を間違って変えられてしまいます。だから、まず「本当にその人か」を Google で確認し、そのあと「管理者として入ってよい人か」を名簿で確認します。

たとえば、学校の職員室に入るとき、顔を知っている先生でも、入口で名札を見せてから入ります。この仕様の Google ログインは名札確認、管理者メール一覧は「職員室に入ってよい人の一覧」です。

### 何をするか

1. 管理者がログインボタンを押す。
2. Google の画面で本人確認する。
3. 戻ってきた情報が途中で入れ替わっていないか確認する。
4. メールアドレスが管理者一覧にあるか確認する。
5. 問題なければ管理画面に入れる印をブラウザに保存する。

### 今回作ったもの

- Google ログインを始める入口
- Google から戻った後に安全確認する入口
- 管理者だけを通す `/admin` の門番
- 新しい管理者を追加・削除する運用手順

## Part 2: Developer Contract

```ts
type AdminSessionClaims = {
  sub: string;
  email: string;
  role: "admin";
  iat: number;
  exp: number;
};

type OAuthTempState = {
  state: string;
  codeVerifier: string;
  next: `/admin${string}` | "/admin";
  expiresAt: number;
};
```

### 実装ファイル

| File | Responsibility |
| --- | --- |
| `apps/web/app/api/auth/login/route.ts` | Generate state, PKCE verifier/challenge, temp cookies, and Google authorize redirect |
| `apps/web/app/api/auth/callback/google/route.ts` | Validate state, exchange code, fetch userinfo, enforce allowlist, issue session |
| `apps/web/app/api/auth/logout/route.ts` | Expire `admin_session` and return to `/login` |
| `apps/web/middleware.ts` | Gate `/admin/*` and redirect unauthenticated users to `/login?gate=admin_required` |
| `apps/web/app/login/page.tsx` | Login UI and error/gate messages |
| `apps/web/src/lib/auth/*` | Cookie, env, allowlist, and JWT session helpers |
| `apps/web/src/lib/oauth/*` | PKCE, state, safe redirect, base64url, and Google API helpers |

### APIシグネチャ

| Route | Purpose |
| --- | --- |
| `GET /api/auth/login?next=/admin` | Start OAuth |
| `GET /api/auth/callback/google?code=...&state=...` | Complete OAuth |
| `POST /api/auth/logout` | Clear admin session |

### 使用例

```bash
curl -i "http://localhost:8788/api/auth/login?next=/admin"
curl -i -X POST "http://localhost:8788/api/auth/logout"
```

### エラーハンドリング

Google token endpoint failure is surfaced as `502`. State mismatch and missing temporary cookies are `400`. Unverified or unauthorized email returns to `/login` with an explicit error message instead of leaving browser users on a JSON-only page.

### エッジケース

| Case | Required behavior |
| --- | --- |
| invalid `next` | reject or normalize to `/admin` before state creation |
| state mismatch | `400`, clear temp cookies |
| token endpoint error | `502`, clear temp cookies |
| unverified email | `403` |
| allowlist miss | redirect to `/login?error=not_in_allowlist` |
| admin removed while session active | session remains until expiry unless `SESSION_SECRET` is rotated |

### 設定項目と定数一覧

| Name | Value |
| --- | --- |
| temp cookie TTL | 10 minutes |
| session TTL | 24 hours |
| OAuth scope | `openid email` |
| PKCE method | `S256` |
| allowed redirect target | relative `/admin` path only |
| Cookie Secure | required for production/staging; omitted only for localhost/127.0.0.1 Workers preview |

### テスト構成

| Test class | Coverage |
| --- | --- |
| unit | PKCE, safe `next`, allowlist parser, JWT verify |
| route | login, callback, logout |
| middleware | unauthenticated, expired, non-admin, admin |
| smoke | local Workers-compatible OAuth flow evidence |

### Phase 11 Screenshot Evidence

The implementation has UI routes for `/login` and `/admin`, but real Google consent and allowlist smoke screenshots require live Google Console redirect URI and Cloudflare secret access. Therefore Phase 11 records the screenshot plan and the external blockers instead of claiming nonexistent image files.

| Evidence | Status |
| --- | --- |
| `outputs/phase-11/screenshots/screenshot-login-page.png` | captured local login page evidence |
| `outputs/phase-11/screenshots/screenshot-login-allowlist-error.png` | captured local allowlist-denial message evidence |
| `outputs/phase-11/main.md` | lists captured local screenshots and remaining live-smoke evidence |
| `outputs/phase-11/manual-smoke-log.md` | records that live OAuth smoke was not executed in this local environment |
| `docs/30-workflows/unassigned-task/UT-11-GOOGLE-VERIFY-01-google-oauth-consent-verification.md` | tracks consent-screen and live redirect verification |
