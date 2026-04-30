# tag_queue resolve test strategy (5 layer × 13 test)

## verify suite

| layer | tool | scope | 担当 wave |
| --- | --- | --- | --- |
| unit | vitest + miniflare D1 | workflow 関数の state machine 全遷移 | 07a 実装 |
| schema | vitest + zod | TagQueueResolveBody discriminated union | 07a 実装 |
| route | vitest + Hono test client | endpoint response shape | 07a 実装 |
| state | vitest | unidirectional 遷移違反の 409 検出 | 07a 実装 |
| authz | vitest + Hono test client | 401 / 403 boundary | 07a 実装 |
| audit | vitest + repo fixture | audit_log entry 確認 | 07a 実装 |
| E2E | Playwright | admin login → /admin/tags resolve → /admin/members 反映 | 08b に handoff |

## test 計画 (13 件)

| # | test name | layer | AC | 期待 |
| --- | --- | --- | --- | --- |
| T1 | `resolve.confirmed_creates_member_tags` | unit | AC-1 | 200 + member_tags 行数 +N + queue.status='resolved' |
| T2 | `resolve.rejected_records_reason` | unit | AC-2 | 200 + queue.status='rejected' + queue.reason=body |
| T3 | `resolve.rejected_empty_reason_422` | schema | AC-2 | 422 + queue 状態不変 |
| T4 | `resolve.idempotent_confirmed_same_tags` | unit | AC-3 | 200 + audit_log 件数不変 |
| T5 | `resolve.idempotent_rejected_same_reason` | unit | AC-3 | 200 + audit_log 件数不変 |
| T6 | `resolve.confirmed_to_rejected_409` | state | AC-4 | 409 + queue 状態不変 |
| T7 | `resolve.rejected_to_confirmed_409` | state | AC-4 | 409 + queue 状態不変 |
| T8 | `resolve.audit_log_entry_present` | audit | AC-5 | resolve 後 audit_log +1 |
| T9 | `resolve.unknown_tag_code_422` | unit | AC-6 | 422 + queue 状態不変 |
| T10 | `resolve.deleted_member_422` | unit | AC-7 | 422 + queue 状態不変 |
| T11 | `enqueueTagCandidate.skips_when_has_tags` | unit | AC-8 | enqueued=false, reason=has_tags |
| T12 | `enqueueTagCandidate.skips_when_pending_exists` | unit | AC-8 | enqueued=false, reason=has_pending_candidate |
| T13 | `resolve.unauthorized_401_or_403` | authz | AC-10 | session なし=401 / 非 admin=403 |

## AC × test トレース

| AC | tests |
| --- | --- |
| AC-1 confirmed → member_tags | T1 |
| AC-2 rejected with reason / 空 reason 422 | T2, T3 |
| AC-3 idempotent | T4, T5 |
| AC-4 unidirectional | T6, T7 |
| AC-5 audit log | T8（+T1, T2 で audit count 確認） |
| AC-6 unknown tag code | T9 |
| AC-7 deleted member | T10 |
| AC-8 candidate 自動投入 skip | T11, T12 |
| AC-9 SWR mutate | E2E (08b) |
| AC-10 401/403 | T13 |

## 不変条件 test

- **#5**: ESLint boundary plugin（apps/web から `apps/api/src` import 禁止）+ grep `from "@/workflows"` 検索を CI で
- **#13**: grep `INSERT INTO member_tags` を `apps/api/src/workflows/tagQueueResolve.ts` 以外から検索し 0 件であることを確認

## ファイル配置

| test file | layer |
| --- | --- |
| `apps/api/src/workflows/tagQueueResolve.test.ts` | unit, state, audit |
| `apps/api/src/workflows/tagCandidateEnqueue.test.ts` | unit |
| `apps/api/src/schemas/tagQueueResolve.test.ts` | schema |
| `apps/api/src/routes/admin/tags-queue.test.ts`（既存差し替え） | route, authz |
