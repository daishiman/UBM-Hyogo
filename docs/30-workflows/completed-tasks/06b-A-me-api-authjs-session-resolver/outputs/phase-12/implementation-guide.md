# Phase 12 Implementation Guide

## Part 1: 中学生レベルの説明

学校の入退室カードを想像する。教室に入るとき、先生は「このカードは本当に本人のものか」を確認してから席に案内する。今の `/profile` 画面はカードを持っているのに、別の教室でそのカードをうまく読めない状態になっている。

このタスクでは、ログイン済みの人が持っている合図を `/me` API 側でも読めるようにする。そうすると、本人のプロフィールを安全に返せる。まだ実装や本番確認はしない。どこを直し、何を確認すればよいかを仕様としてそろえる。

### 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| Auth.js session | ログイン済みを示す合図 |
| cookie | ブラウザが持っている小さなメモ |
| JWT | 改ざんされていないか確認できる通行証 |
| `/me` API | 自分の情報を取りに行く窓口 |
| `AUTH_SECRET` | 通行証が本物か確かめる合い鍵 |

## Part 2: 技術者向け

### Intended contract

```ts
type SessionResolveResult =
  | { ok: true; memberId: string; responseId: string; email?: string }
  | { ok: false; status: 401; reason: "missing_session" | "invalid_session" }
  | { ok: false; status: 410; reason: "deleted_member" };

type ResolveMeSession = (request: Request, env: { AUTH_SECRET: string }) => Promise<SessionResolveResult>;
```

### API signature and usage

- API surface: `GET /me`, `GET /me/profile`
- Input: `Cookie` header containing `authjs.session-token` or `__Secure-authjs.session-token`
- Verification: decode/verify with the same `AUTH_SECRET` contract used by the web Auth.js runtime
- Development boundary: `x-ubm-dev-session: 1` remains development-only and must not become a production fallback

### Error and edge cases

| Case | Expected result |
| --- | --- |
| No Auth.js cookie | 401 |
| Invalid or expired token | 401 |
| Valid token but deleted member | 410 |
| Valid token and active member | 200 |
| `apps/web` profile SSR | continues to use cookie forwarding, no D1 direct access |

### Parameters and constants

| Name | Owner | Requirement |
| --- | --- | --- |
| `AUTH_SECRET` | shared web/api deployment secret | same effective value across Auth.js issuer and API verifier |
| `authjs.session-token` | Auth.js | accepted cookie name |
| `__Secure-authjs.session-token` | Auth.js secure deployment | accepted cookie name |
| `x-ubm-dev-session` | local development only | disabled unless `ENVIRONMENT === "development"` |

## Implementation summary (2026-05-02)

### Changes

- **`apps/api/src/middleware/me-session-resolver.ts`** (new): `createMeSessionResolver()` を新規追加。dev 経路（`x-ubm-dev-session: 1` + Bearer `session:<email>:<memberId>`、`ENVIRONMENT === "development"` 限定）と production/staging 経路（Auth.js cookie `authjs.session-token` / `__Secure-authjs.session-token` / Bearer JWT を `AUTH_SECRET` で HS256 verify）を 1 関数に集約。既存 `extractJwt` (require-admin.ts) と `verifySessionJwt` (`@ubm-hyogo/shared`) を再利用。
- **`apps/api/src/index.ts`**: `/me` mount で使っていた inline dev-only resolver を `createMeSessionResolver()` に差し替え。
- **`apps/api/src/middleware/me-session-resolver.test.ts`** (new): 12 ケースの contract test。dev path 4 / production JWT path 8。

### AC mapping

| AC | 検証方法 |
| --- | --- |
| production/staging で `/me` が Auth.js cookie/JWT で 200 を返す | resolver test「Authorization Bearer」「authjs.session-token cookie」「__Secure- cookie」 |
| 未ログイン / 不正 JWT / 期限切れ → 401 | resolver test (wrong secret / expired / no token / malformed / no secret) + 既存 `/me` test「未ログインは 401」 |
| 削除済み member は 410、rules 未同意は authGateState | sessionGuard 既存実装変更なし。`/me` integration test で coverage |
| apps/web は D1 直参照せず cookie forwarding のまま成立 | apps/web/src/lib/fetch/authed.ts は変更なし。resolver が cookie を直接読む |
| dev-only `x-ubm-dev-session` は production で無効 | resolver test「rejects dev header in production」 |
| dev-only `x-ubm-dev-session` は env 欠落時も無効 | resolver test「rejects dev header when ENVIRONMENT is missing」 |

### Verification

- `pnpm vitest run apps/api/src/middleware/me-session-resolver.test.ts` → 12/12 pass
- `pnpm vitest run apps/api/src/routes/me apps/api/src/middleware` → 37/37 pass
- `pnpm --filter @ubm-hyogo/api typecheck` → 0 errors
- `pnpm --filter @ubm-hyogo/api lint` → 0 errors

### Out of scope (user approval gate)

- staging/production deploy
- Cloudflare secret rotation
- 実 cookie を使った live smoke
