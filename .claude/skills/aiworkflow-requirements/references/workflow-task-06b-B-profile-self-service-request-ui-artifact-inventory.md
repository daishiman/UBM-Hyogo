# Workflow Artifact Inventory: 06b-B profile self-service request UI

## Summary

| Item | Value |
| --- | --- |
| Workflow | `docs/30-workflows/06b-B-profile-self-service-request-ui/` |
| Status | implemented-local / implementation / VISUAL_ON_EXECUTION |
| Runtime evidence | blocked until 06b-A session resolver evidence |
| Visual evidence owner | `docs/30-workflows/02-application-implementation/06b-C-profile-logged-in-visual-evidence/` |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/web/app/profile/page.tsx` | Renders self-service request sections under profile body and edit CTA |
| `apps/web/app/profile/_components/VisibilityRequest.client.tsx` | Public/hidden request UI with confirm, pending, accepted, and error states |
| `apps/web/app/profile/_components/DeleteRequest.client.tsx` | Account deletion request UI with confirm, pending, accepted, and error states |
| `apps/web/src/lib/api/me-requests-client.ts` | Browser helper for `/api/me/visibility-request` and `/api/me/delete-request` |
| `apps/web/app/api/me/[...path]/route.ts` | Browser-facing proxy to backend `/me/*` routes |
| `apps/web/src/lib/api/__tests__/me-requests-client.test.ts` | Client helper status/error contract tests |
| `apps/web/app/profile/_components/__tests__/VisibilityRequest.test.tsx` | Visibility request component behavior tests |
| `apps/web/app/profile/_components/__tests__/DeleteRequest.test.tsx` | Delete request component behavior tests |
| `apps/web/app/api/me/[...path]/route.test.ts` | Proxy route contract tests |
| `apps/web/src/__tests__/static-invariants.test.ts` | No profile body edit form / D1 boundary invariants |

## Deferred Evidence

| Evidence | Path |
| --- | --- |
| Visibility request 202 smoke | `docs/30-workflows/06b-B-profile-self-service-request-ui/outputs/phase-11/profile-visibility-request-smoke.md` |
| Delete request 202 smoke | `docs/30-workflows/06b-B-profile-self-service-request-ui/outputs/phase-11/profile-delete-request-smoke.md` |
| Duplicate pending 409 smoke | `docs/30-workflows/06b-B-profile-self-service-request-ui/outputs/phase-11/profile-request-duplicate-409.md` |
| Logged-in visual screenshots | `docs/30-workflows/02-application-implementation/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/` |

## Boundary

This inventory records local implementation and tests only. It does not claim production session smoke, logged-in screenshot evidence, deploy, commit, push, or PR completion.
