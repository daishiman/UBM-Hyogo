# Phase 7 — AC Matrix

| AC | 要件 | 検証 (Phase 4) | 実装 step (Phase 5) | failure cover (Phase 6) | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 未ログイン 401 + memberId 露出ゼロ | index.test.ts AC-1 | Step 3 sessionGuard | F-1, F-2 | #11 |
| AC-2 | 自分の memberId 以外取得不可 | createMeRoute 構造 (path に :memberId 不在) | Step 6 router | F-12 | #11 |
| AC-3 | editResponseUrl + null fallback | index.test.ts AC-3 / F-5 | Step 5 services + Step 6 handler | F-5, F-11 | #1, #4 |
| AC-4 | visibility/delete request → admin_member_notes | index.test.ts AC-4 / F-7 / F-9 | Step 2 + Step 5 + Step 6 | F-7, F-9, F-10 | #4, #12 |
| AC-5 | response zod が view model と一致、responseId と memberId 別 | schemas.ts strict | Step 5 | - | #7 |
| AC-6 | session 単位 5 req/min + 二重申請判定 | index.test.ts F-6, F-7 | Step 4 + Step 2 | F-6 | #11 |
| AC-7 | authGateState (active / rules_declined / deleted) | index.test.ts AC-7 / F-3 | Step 3 | F-3, F-4 | #9 |
| AC-8 | notes leak ゼロ | index.test.ts JSON regex + strict zod | Step 5 schemas | F-13 | #12 |
