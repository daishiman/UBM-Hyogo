# Phase 4 — Test Matrix

| AC | unit | contract | authz | integration | failure cover |
| --- | --- | --- | --- | --- | --- |
| AC-1 | sessionGuard 401 | GET /me 401 | 全 endpoint 401 | - | F-1, F-2 |
| AC-2 | path に :memberId 不在 (構造) | - | path 改ざん不可 (構造) | - | F-12 |
| AC-3 | resolveEditResponseUrl | GET /me/profile zod | - | seed + zod parse | F-5, F-11 |
| AC-4 | memberSelfRequestQueue.appendVisibility/Delete | POST 202 zod | 二重投入 409 | admin_member_notes 直接 SELECT | F-7, F-9, F-10 |
| AC-5 | schemas.ts type | - | - | - | - |
| AC-6 | rateLimitSelfRequest unit | - | 5 連投で 429 | - | F-6 |
| AC-7 | sessionGuard authGateState | GET /me zod | rules_declined / deleted | - | F-3, F-4 |
| AC-8 | - | GET 系 strict zod (notes 不在) | - | JSON contains check | F-13 |
