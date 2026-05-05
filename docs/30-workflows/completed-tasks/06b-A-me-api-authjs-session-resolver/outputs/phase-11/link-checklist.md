# Phase 11 Link Checklist

## status

SPEC_LINKS_REVIEWED

## workflow-local links

| Link | Purpose | Result |
| --- | --- | --- |
| `../../index.md` | workflow root | PASS |
| `../../phase-05.md` | implementation runbook | PASS |
| `../../phase-11.md` | NON_VISUAL evidence contract | PASS |
| `../../phase-12.md` | documentation close-out contract | PASS |

## code references

| Reference | Purpose | Result |
| --- | --- | --- |
| `apps/api/src/index.ts` | `/me` mount and resolver wiring | PENDING_IMPLEMENTATION |
| `apps/api/src/routes/me/index.ts` | `/me` route behavior | PENDING_IMPLEMENTATION |
| `apps/api/src/middleware/session-guard.ts` | member session guard | PENDING_IMPLEMENTATION |
| `packages/shared/src/auth.ts` | shared auth/session primitives | PENDING_IMPLEMENTATION |
| `apps/web/src/lib/fetch/authed.ts` | cookie forwarding client | PENDING_IMPLEMENTATION |
| `apps/web/app/profile/page.tsx` | profile SSR consumer | PENDING_IMPLEMENTATION |

## boundary

`PENDING_IMPLEMENTATION` means the reference is intentionally in the future implementation scope. It is not runtime evidence.
