# require-auth-public-access-gate artifact inventory

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / runtime_screenshot_pending_user_gate` |
| purpose | `/login` を除く公開 UI と `/public/*` API を認証必須化し、未認証ユーザーには案内画面、API には 401 を返す |
| implementation targets | `apps/web/src/components/auth/LoginRequiredNotice.tsx`, `apps/web/app/(public)/layout.tsx`, `apps/web/src/lib/fetch/public.ts`, `apps/web/src/lib/env.ts`, `apps/web/app/sitemap.ts`, `apps/api/src/middleware/require-public-access.ts`, `apps/api/src/routes/public/index.ts`, `apps/api/src/middleware/require-admin.ts`, `apps/og/src/member-source.ts` |
| tests | `apps/web/src/components/auth/LoginRequiredNotice.spec.tsx`, `apps/web/app/(public)/layout.spec.tsx`, `apps/web/app/__tests__/sitemap.spec.ts`, `apps/web/src/lib/fetch/public.spec.ts`, `apps/api/src/middleware/require-public-access.authz.spec.ts`, `apps/api/src/routes/public/index.contract.spec.ts`, `apps/og/src/__tests__/member-source.spec.ts` |
| system specs | `docs/00-getting-started-manual/specs/{00-overview,01-api-schema,02-auth,05-pages,06-member-auth,09e-screen-blueprints-public,13-mvp-auth}.md`, `references/{api-endpoints,security-api,environment-variables}.md` |
| evidence | focused web/api/og specs, web/api/og typecheck and lint recorded in `outputs/phase-11/manual-test-result.md`; Phase 12 strict docs present |
| invariant | `/login` remains unauthenticated; `/profile` and `/admin/*` existing gates unchanged; D1 schema, Google Form schema, endpoint response fields, and public visibility filters unchanged |
| user gate | staging deploy, authenticated runtime screenshots, Cloudflare `INTERNAL_AUTH_SECRET` secret placement, commit, push, PR |

## Lessons Learned

- **L-RAPAG-001**: UI gate alone is insufficient when `/public/*` can be called directly. Close browser UI and API direct access in the same wave, then add explicit internal-service bypass only for server-owned consumers such as sitemap and OG workers.
- **L-RAPAG-002**: If implementation diff exists, workflow state must be promoted out of `spec_created`; otherwise Phase 12 evidence, artifacts.json, and system ledgers contradict the codebase.
- **L-RAPAG-003**: Public/member visibility labels describe field audience after authentication. They must not be read as unauthenticated public access once route/API authentication has been added.
