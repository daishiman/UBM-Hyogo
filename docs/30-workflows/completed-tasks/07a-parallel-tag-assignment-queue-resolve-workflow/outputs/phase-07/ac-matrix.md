# AC マトリクス (07a)

| AC | 仕様 | 実装 | 検証 (test) | 結果 |
| --- | --- | --- | --- | --- |
| AC-1 | confirmed → member_tags + queue.status='resolved' | tagQueueResolve.ts confirmed branch | workflow T1, route AC-1 | PASS |
| AC-2 | rejected with reason、空 reason 422 | tagQueueResolve.ts rejected branch + zod | workflow T2, route AC-2, schema "空 reason" | PASS |
| AC-3 | 同 action 同 payload は idempotent (200), 別 action は 409 | tagQueueResolve.ts idempotent path | workflow T4/T5, route AC-3 | PASS |
| AC-4 | unidirectional: confirmed↔rejected, →queued は 409 | workflow state_conflict | workflow T6/T7, route AC-4 | PASS |
| AC-5 | 全 resolve に audit_log entry | workflow guarded write に audit INSERT | workflow T1/T2, route AC-5 | PASS |
| AC-6 | unknown tag code は 422 | workflow tagDefinitions check | workflow T9, route AC-6 | PASS |
| AC-7 | 削除済み member は 422 | workflow getMemberStatus check | workflow T10, route AC-7 | PASS |
| AC-8 | candidate 自動投入: member_tags 空 + 未解決無し | tagCandidateEnqueue.ts | candidate.test 4 ケース | PASS |
| AC-9 | UI で SWR mutate により queue から消える | UI 側 (06c) で SWR 連携 | E2E (08b に handoff) | DEFERRED |
| AC-10 | session 無し=401, 非 admin=403 | requireAdmin middleware | route.test "authz 401" + 既存 admin gate test | PASS |

## サマリー

- 9/10 AC が本タスク内で test PASS
- AC-9 (SWR mutate) は UI 側 06c の責務、E2E は 08b に handoff
- 不変条件 #5, #13 は grep gate と code review で確認（Phase 9）
