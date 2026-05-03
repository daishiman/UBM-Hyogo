# Phase 2 Output: Design Boundary

Status: SPEC_CREATED_BOUNDARY

UI owner is `apps/web/app/(admin)/admin/schema/page.tsx`. API owner is `apps/api/src/routes/admin/schema.ts` plus existing sync schema route for `POST /admin/sync/schema`. The design keeps schema resolution centralized in `/admin/schema` and does not introduce a second alias table or direct `schema_questions.stable_key` write path.
