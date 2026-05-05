# Output Phase 11: 手動 smoke / 実測 evidence

## status

EXECUTED — vitest contract tests passed (NON_VISUAL タスクの evidence は contract test 出力で代替)

## evidence

### resolver contract tests

`apps/api/src/middleware/me-session-resolver.test.ts` で 12 ケース全て pass。

- AC-prod-200: `resolves valid JWT from Authorization Bearer in production`
- AC-prod-cookie-200: `resolves JWT from authjs.session-token cookie`
- AC-prod-secure-cookie-200: `resolves JWT from __Secure-authjs.session-token cookie`
- F-401-wrong-secret: `rejects JWT with wrong secret`
- F-401-expired: `rejects expired JWT`
- F-401-missing: `returns null with no token at all`
- F-401-malformed: `returns null for malformed Bearer token`
- F-401-no-secret: `returns null when AUTH_SECRET unset`
- DEV-200: `returns session for valid dev token`
- DEV-prod-blocked: `rejects dev header in production even with valid format`
- DEV-env-missing-blocked: `rejects dev header when ENVIRONMENT is missing`
- DEV-missing-header: `returns null when dev header missing`

### /me route integration tests

`apps/api/src/routes/me/index.test.ts` 15 ケース全て pass（resolver 差し替えで regress していないことを確認）。

### typecheck / lint

`pnpm --filter @ubm-hyogo/api typecheck` / `lint` ともに 0 errors。

## staging smoke 前提

実際の staging deploy 後 smoke は以下を user approval gate に置く:

1. apps/web に Google OAuth login し `authjs.session-token` cookie を取得する。
2. `GET <api-staging>/me` を cookie 添付で呼ぶ → 200 + SessionUser を期待。
3. cookie 無し → 401 を期待。
4. `x-ubm-dev-session: 1` を staging に投げて 401 を期待 (dev path は production/staging で無効)。

これらの実測はユーザー承認後に実行するため本タスクのスコープでは contract test 出力までを evidence とする。
