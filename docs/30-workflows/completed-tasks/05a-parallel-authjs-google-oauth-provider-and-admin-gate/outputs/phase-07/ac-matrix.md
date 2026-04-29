# Phase 7 — AC マトリクス

| AC | 内容 | 実装 / test | 状態 |
| --- | --- | --- | --- |
| AC-1 | `session.user.memberId === member_identities.member_id` | session-resolve R-04/R-05 + jwt callback で `token.memberId` 設定 | ✅ |
| AC-2 | 未登録 email → /login?gate=unregistered | session-resolve R-01 + signIn callback の URL string 返却 | ✅ |
| AC-3 | admin_users 登録 user → isAdmin=true | session-resolve R-05 + requireAdmin G-06 | ✅ |
| AC-4 | 未許可 user の `/admin/*` → /login redirect | apps/web/middleware.ts (E2E は 08b に委譲) | ✅ (UI 実装は 06 で結合) |
| AC-5 | `/admin/*` API → 401/403 | requireAdmin G-04 (401) / G-05 (403) / G-06 (200) | ✅ |
| AC-6 | 平文 secrets がリポジトリに無い | secrets.md / scripts/cf.sh / 1Password ref のみ | ✅ |
| AC-7 | secrets が wrangler / GitHub / 1Password 配置 | secrets.md 表 | ✅ |
| AC-8 | JWT 改ざん → 401 | auth.test.ts (S-06) + require-admin.test.ts (G-08) | ✅ |
| AC-9 | OAuth / Magic Link 同一 email → 同一 memberId | session-resolve は provider 不変、05b と endpoint 共有 | ✅ (05b 統合 test は 08a) |
| AC-10 | middleware が edge 互換 | Web Crypto + getToken (D1 access 無し) | ✅ |
