# Spec Extraction Map

Status: completed.

| Area | Current anchor | Requirement impact |
| --- | --- | --- |
| Admin response sync route | `apps/api/src/routes/admin/responses-sync.ts` | User-gated response fullSync entrypoint remains unchanged. |
| Sync job | `apps/api/src/jobs/sync-forms-responses.ts` | Adds mapping-collapse counters and alerts without changing success/failure semantics. |
| Stable key mapping | `packages/integrations/google/src/forms/mapper.ts`, `packages/integrations/google/src/forms/client.ts`, `apps/api/src/forms/build-qid-map.ts`, `apps/api/src/index.ts` | Raw form fallback plus schema-priority merge. |
| Public display | `apps/api/src/view-models/public/public-member-profile-view.ts` | No rendering-layer change; data restoration fixes output. |
| Recovery runbook | `docs/30-workflows/completed-tasks/member-profile-google-form-data-reflection/runbooks/recovery.md` | Read-only diagnosis and user-gated mutation sequence. |

