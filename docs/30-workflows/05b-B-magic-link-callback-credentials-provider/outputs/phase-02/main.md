# Output Phase 2: 設計

## status

EXECUTED

## コンポーネント実装マッピング

| 領域 | 実ファイル | 責務 |
| --- | --- | --- |
| Callback route | `apps/web/app/api/auth/callback/email/route.ts` | query 検証・verify 呼び出し・signIn 呼び出し・error redirect |
| Verify helper | `apps/web/src/lib/auth/verify-magic-link.ts` | API worker `/auth/magic-link/verify` への server-to-server fetch、reason 正規化 |
| Auth.js config | `apps/web/src/lib/auth.ts` | CredentialsProvider(id="magic-link") + signIn/jwt/session callbacks |
| Auth handler export | `apps/web/app/api/auth/[...nextauth]/route.ts` | 既存（変更なし） |

## Data Flow（実装版）

1. メールリンク `/api/auth/callback/email?token=&email=` を GET。
2. route.ts: `token`/`email` の存在と形式（hex64 / RFC email shape）を検証。
3. route.ts: `verifyMagicLink({ token, email })` で API worker を呼ぶ。
4. verify success: `signIn("magic-link", { verifiedUser: JSON, redirect: true, redirectTo: "/" })` で session cookie 確立。
5. verify failure: `/login?error=<mapped>` へ 303 redirect。

## Error Mapping（実装版）

| Source reason | Redirect error | session |
| --- | --- | --- |
| query missing token | `missing_token` | not created |
| query missing email | `missing_email` | not created |
| query invalid shape | `invalid_link` | not created |
| API `not_found` | `invalid_link` | not created |
| API `expired` | `expired` | not created |
| API `already_used` | `already_used` | not created |
| API `resolve_failed` | `resolve_failed` | not created |
| network/JSON failure | `temporary_failure` | not created |

## API Boundary

- `apps/web` は API worker を `INTERNAL_API_BASE_URL` 環境変数経由で fetch する（fallback: `http://127.0.0.1:8787`）。
- D1 直接アクセスはなし。`scripts/lint-boundaries.mjs` で検査済（`outputs/phase-11/boundary-check.log` exit=0）。
