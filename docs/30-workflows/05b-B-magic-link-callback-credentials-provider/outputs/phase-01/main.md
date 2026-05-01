# Output Phase 1: 要件定義

## status

EXECUTED

## 実装範囲（確定）

- `apps/web/app/api/auth/callback/email/route.ts` GET handler を新設。
- `apps/web/src/lib/auth/verify-magic-link.ts` helper を新設し API worker `/auth/magic-link/verify` を呼ぶ。
- `apps/web/src/lib/auth.ts` に `CredentialsProvider(id="magic-link")` を追加し、JWT/session callback と signIn callback を Credentials 経路向けに拡張。

## AC 確認

| AC | 結果 | Evidence |
| --- | --- | --- |
| AC-1 `/api/auth/callback/email` が 404 にならない | PASS | `apps/web/app/api/auth/callback/email/route.test.ts` AC-1 |
| AC-2 正しい token/email で session cookie が確立 | PASS | route test で `signIn("magic-link", { verifiedUser, redirect: true })` 到達 |
| AC-3 不正 token/email は `/login?error=...` へ戻る | PASS | route test 7 ケース（missing/invalid/各 verify reason） |
| AC-4 apps/web は D1 を直接参照しない | PASS | `outputs/phase-11/boundary-check.log` exit=0 |
| AC-5 関連 route/auth tests が追加 | PASS | verify-magic-link.test.ts (15 cases) + route.test.ts (11 cases) |

## scope-out 確認

- Google OAuth は既存パスを維持（GoogleProvider は変更せず、signIn callback で `provider === "credentials"` の早期 return を追加）。
- Magic Link 発行 API・mail provider・D1 schema は変更なし。
- commit / push / PR は本セッションでは実行しない。
