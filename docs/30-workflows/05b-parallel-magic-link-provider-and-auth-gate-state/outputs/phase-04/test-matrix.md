# Test Matrix — Magic Link & AuthGateState

| AC | test ID | layer | tool | endpoint | 入力 | 期待 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 | R1-POST | contract | vitest+miniflare | POST /auth/magic-link | `{email:"unknown@x"}` | 200 `{state:"unregistered"}`、INSERT 0、mail 0 |
| AC-1 | R1-GET | contract | vitest+miniflare | GET /auth/gate-state | `?email=unknown@x` | 200 `{state:"unregistered"}` |
| AC-2 | R2-POST | contract | vitest+miniflare | POST /auth/magic-link | `{email:"declined@x"}`（rules_consent="unknown"） | 200 `{state:"rules_declined"}`、INSERT 0 |
| AC-2 | R2-GET | contract | vitest+miniflare | GET /auth/gate-state | 同上 | 200 `{state:"rules_declined"}` |
| AC-3 | R3-POST | contract | vitest+miniflare | POST /auth/magic-link | `{email:"deleted@x"}`（is_deleted=1） | 200 `{state:"deleted"}`、INSERT 0 |
| AC-3 | R3-GET | contract | vitest+miniflare | GET /auth/gate-state | 同上 | 200 `{state:"deleted"}` |
| AC-3 | R3-PRIO | contract | vitest+miniflare | POST | deleted=1 AND rules_consent="unknown" の双方該当 | `state:"deleted"`（優先順位） |
| AC-4 | R4-POST | contract | vitest+miniflare | POST /auth/magic-link | `{email:"user1@x"}`（valid） | 200 `{state:"sent"}`、INSERT 1、mail 1 |
| AC-4 | R4-GET | contract | vitest+miniflare | GET /auth/gate-state | 同上 | 200 `{state:"ok"}`（副作用なし、INSERT 0） |
| AC-5 | T-02 | unit+contract | vitest | POST /auth/magic-link/verify | 期限切れ token | `{ok:false, reason:"expired"}` |
| AC-6 | T-03 | unit+contract | vitest | POST /auth/magic-link/verify | 既消費 token | `{ok:false, reason:"already_used"}` |
| AC-9 | T-01 | unit+contract | vitest | verify | 有効 token | `{ok:true, user:{memberId,...}}`、used=1 |
| AC-9 | T-04 | unit+contract | vitest | verify | 存在しない token | `{ok:false, reason:"not_found"}` |
| AC-9 | T-05 | unit+contract | vitest | verify | token は valid だが email mismatch | `{ok:false, reason:"resolve_failed"}` |
| AC-10 | RS-01 | contract | vitest | POST /auth/resolve-session | unregistered email | `{ok:false, reason:"unregistered"}` |
| AC-10 | RS-02 | contract | vitest | POST /auth/resolve-session | rules_declined | `{ok:false, reason:"rules_declined"}` |
| AC-10 | RS-03 | contract | vitest | POST /auth/resolve-session | deleted | `{ok:false, reason:"deleted"}` |
| AC-10 | RS-04 | contract | vitest | POST /auth/resolve-session | valid | `{ok:true, user:{memberId, responseId, isAdmin, authGateState:"active"}}` |
| AC-10 | RS-05 | contract | vitest | POST /auth/resolve-session | valid + admin email | `{ok:true, user:{...isAdmin:true}}` |
| - | F-01 | contract | vitest | POST /auth/magic-link | body 欠落 | 400 INVALID_REQUEST |
| - | F-02 | contract | vitest | POST /auth/magic-link | malformed email | 400 INVALID_REQUEST |
| - | R-01 | security | vitest+fake clock | POST | 同 email × 6 回 / 1h | 6 回目 429 |
| - | R-02 | security | vitest+fake clock | POST | 異 email × 6 回 | 全 200 |
| - | R-03 | security | vitest+fake clock | GET gate-state | 同 IP × 61 回 | 61 回目 429 |
| - | Z-01 | authz | grep+lint | apps/web | D1 直接 import 試行 | 検出 0 件 |
| - | Z-02 | authz | snapshot | gate-state response | memberId leakage | 含まれない |
| - | Z-03 | authz | unit | resolve-session | 未解決時 | user フィールド不在（discriminated union） |
| AC-7 | FS-01 | smoke | bash | apps/web | `find apps/web/app -path '*no-access*'` | 0 件 |

## 実装ファイル割付

| layer | ファイル |
| --- | --- |
| use-case unit | `apps/api/src/use-cases/auth/__tests__/resolve-gate-state.test.ts` |
| use-case unit | `apps/api/src/use-cases/auth/__tests__/issue-magic-link.test.ts` |
| use-case unit | `apps/api/src/use-cases/auth/__tests__/verify-magic-link.test.ts` |
| use-case unit | `apps/api/src/use-cases/auth/__tests__/resolve-session.test.ts` |
| route contract | `apps/api/src/routes/auth/__tests__/magic-link.test.ts` |
| route contract | `apps/api/src/routes/auth/__tests__/gate-state.test.ts` |
| route contract | `apps/api/src/routes/auth/__tests__/verify.test.ts` |
| route contract | `apps/api/src/routes/auth/__tests__/resolve-session.test.ts` |
| middleware | `apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts` |
| smoke | `apps/api/scripts/no-access-fs-check.sh` |
