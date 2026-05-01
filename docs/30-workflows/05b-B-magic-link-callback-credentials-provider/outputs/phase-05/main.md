# Output Phase 5: 実装ランブック

## status

EXECUTED

## 実装手順（実行版）

1. ✅ Repo layout を `rg --files apps/web` で確認。`[...nextauth]/route.ts` は既存、`callback/email/` は未存在 → 新設。
2. ✅ next-auth v5 (`5.0.0-beta.25`) と既存 `buildAuthConfig` を確認。
3. ✅ `apps/web/src/lib/auth.ts` に `CredentialsProvider(id="magic-link")` を追加。authorize() は `verifiedUser` JSON を検証して user を返す。
4. ✅ `apps/web/src/lib/auth/verify-magic-link.ts` を新設。API worker `/auth/magic-link/verify` を server-to-server で呼ぶ。
5. ✅ `apps/web/app/api/auth/callback/email/route.ts` GET handler を新設。query 検証 → verify → 結果に応じて signIn or `/login?error=...` redirect。
6. ✅ `[...nextauth]/route.ts` は既存 export を維持。
7. ✅ error mapping と safe redirect (`new URL("/login", req.url)`) を実装。
8. ✅ unit / route test を追加（26 ケース）。boundary は既存 `lint-boundaries.mjs` を流用。
9. ✅ Phase 11 evidence を `outputs/phase-11/{typecheck,test,boundary-check}.log` に保存。

## 実装境界の遵守

| やる | 実態 |
| --- | --- |
| Auth.js callback と session 接続 | CredentialsProvider 追加・signIn callback 拡張 |
| API worker verify 契約の利用 | verify-magic-link.ts helper |
| 既存 signIn/jwt/session callback の再利用 | google 経路の挙動は不変、credentials 経路を追加 |
| error mapping 明示 | mapVerifyReasonToLoginError + route 内 query 検証 |

| やらない | 実態 |
| --- | --- |
| Magic Link 発行 API の再実装 | 触らず |
| apps/web から D1 直接参照 | 行わず（boundary check exit=0） |
| 重複 session union 型の新設 | local helper 型のみ、shared への昇格は将来 |
| 失敗 reason 握り潰し | すべて mapping 済み（temporary_failure 含む） |

## Approval Gate

- 本セッションでは commit / push / PR は実行しない。
