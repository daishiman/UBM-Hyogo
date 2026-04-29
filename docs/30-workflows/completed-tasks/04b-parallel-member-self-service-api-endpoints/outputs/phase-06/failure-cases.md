# Phase 6 — Failure Cases

| # | シナリオ | 期待挙動 | 検出手段 |
| --- | --- | --- | --- |
| F-1 | session 不在で /me/* | 401 + `{ code: "UNAUTHENTICATED" }`、memberId を含まない | index.test.ts (AC-1) |
| F-2 | session cookie 改ざん | resolveSession が null → 401 | sessionGuard 単体 (resolver の DI で検証) |
| F-3 | is_deleted=1 | 410 + `{ code: "DELETED", authGateState: "deleted" }` | index.test.ts (F-3) |
| F-4 | rules_consent=declined で POST | 403 RULES_NOT_ACCEPTED | index.test.ts (F-4) |
| F-5 | edit_response_url が NULL | 200 + `editResponseUrl: null`, `fallbackResponderUrl` 必ず存在 | index.test.ts (F-5) |
| F-6 | session 単位 5 req/min 超過 | 429 + `Retry-After` ヘッダ | index.test.ts (F-6) |
| F-7 | 二重申請 (same type, same memberId) | 409 DUPLICATE_PENDING_REQUEST | index.test.ts (F-7) |
| F-8 | body の zod 失敗 | 422 INVALID_REQUEST + issues | index.test.ts (F-8) |
| F-9 | delete-request 直後の GET /me/profile | profile 内容は不変、queue は pending | response_fields COUNT 不変を assert (AC-4) |
| F-10 | admin_member_notes insert で D1 一意制約違反 | 500 ではなく throw 経由で error-handler が ApiError 化 | error-handler 既存挙動 |
| F-11 | 03b helper が throw | resolveEditResponseUrl が catch して null を返す | services.ts try/catch |
| F-12 | path に :memberId が偶発混入 | createMeRoute は path 引数なしで構造保証 (lint 不要) | createMeRoute 構造 |
| F-13 | GET /me/profile に notes キー混入 | strict zod parse が fail | index.test.ts AC-3/AC-8 + JSON regex |
| F-14 | reason > 500 文字 | 422 | rate-limit テスト内の 501 文字 reason で 422 を確認 |
| F-15 | resolveSession が throw | sessionGuard が throw 伝播 → error-handler が 500/502 化（既存 onError） | error-handler 既存挙動 |

## MVP の rate limit 注記 (KV 未提供)

Cloudflare KV を本タスクでは導入しないため、`rateLimitSelfRequest` は **同 isolate ローカルメモリ** での簡易実装。複数 isolate 跨ぎでは厳密な 5/60s を保証しない。AC-6 の主目的「二重申請判定」は `adminNotes.hasPendingRequest` (永続) で担保している。将来 KV/D1 移行で cross-isolate 厳密化を行う。
