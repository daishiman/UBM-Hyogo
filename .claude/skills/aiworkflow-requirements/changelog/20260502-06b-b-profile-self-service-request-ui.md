# 2026-05-02 06b-B profile self-service request UI

## Summary

Synchronized 06b-B from a stale `spec_created / docs-only / not_started` classification to `implemented-local / implementation / runtime-evidence-blocked`.

## Updated Canonical References

- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/task-workflow-active.md`
- `references/legacy-ordinal-family-register.md`
- `references/workflow-task-06b-B-profile-self-service-request-ui-artifact-inventory.md`

## Implementation Artifacts

- `apps/web/app/profile/page.tsx`
- `apps/web/app/profile/_components/VisibilityRequest.client.tsx`
- `apps/web/app/profile/_components/DeleteRequest.client.tsx`
- `apps/web/src/lib/api/me-requests-client.ts`
- `apps/web/app/api/me/[...path]/route.ts`
- focused UI/client/proxy/static-invariant tests

## Deferred Evidence

06b-B runtime smoke and 06b-C logged-in screenshots remain blocked until 06b-A session resolver evidence is available.
