# Phase 7: AC Matrix

| AC | Requirement | Evidence |
| --- | --- | --- |
| AC-1 | web client uses discriminated union body | `apps/web/src/lib/admin/api.ts` imports `TagQueueResolveBody` from shared |
| AC-2 | confirmed success | `apps/api/src/routes/admin/tags-queue.test.ts` confirmed route test |
| AC-3 | rejected success | `apps/api/src/routes/admin/tags-queue.test.ts` rejected route test |
| AC-4 | validation failures | shared schema tests + route 400 assertions |
| AC-5 | idempotent replay | confirmed and rejected replay tests |
| AC-6 | spec / implementation guide body shape aligned | no code drift found; docs update captured in Phase 12 |
| AC-7 | old empty body calls removed | `rg resolveTagQueue` live code shows all calls include body |
| AC-8 | 409 / 422 / auth cases | route tests |

判定: PASS。

