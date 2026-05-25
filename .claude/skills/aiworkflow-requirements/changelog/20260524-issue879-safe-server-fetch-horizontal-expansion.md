# 2026-05-24 issue-879 safeServerFetch member/public horizontal expansion

Issue #879 を CLOSED 維持のまま `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期。

- `apps/web/src/lib/server-fetch/safe-fetch.ts` を common thunk helper として追加。
- `apps/web/src/lib/admin/safe-server-fetch.ts` は既存 path signature を維持した adapter に縮小。
- `/profile`, `/members`, `/members/[id]` の transient fetch failure を SectionError degrade へ変更。
- auth redirect と public member 404 notFound は page-fatal framework signal として維持。
- focused Vitest 20 PASS、web typecheck PASS、design-token gate PASS、web lint PASS。
- commit / push / PR / Issue mutation は user-gated。
