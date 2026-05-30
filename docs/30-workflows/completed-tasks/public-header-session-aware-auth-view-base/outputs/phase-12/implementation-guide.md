# Implementation Guide

## Part 1: Plain Explanation

The public header now checks whether the visitor is a guest, member, or admin before choosing the right action. Guests see login. Members see profile and sign-out. Admins also see the admin screen link.

## Part 2: Technical Notes

Implemented files:

| Area | Files |
| --- | --- |
| Auth view model | `apps/web/src/lib/auth-view/types.ts`, `resolveAuthView.ts`, `getAuthView.ts`, `index.ts` |
| Header rendering | `apps/web/src/components/public/PublicHeader.tsx` |
| Layout wiring | `apps/web/app/(public)/layout.tsx` |
| Tests | `resolveAuthView.spec.ts`, `getAuthView.spec.ts`, `PublicHeader.spec.tsx`, `(public)/layout.spec.tsx` |

Key contracts:

- `resolveAuthView()` is pure and maps missing/blank `memberId` to `guest`.
- `getAuthView()` uses `getAuth().auth()` and fail-closes to `guest`.
- `PublicHeader` sets `data-auth-state` to only `guest`, `member`, or `admin`.
- The public layout resolves `authView` once and passes it into `PublicHeader`.

## Phase 11 Visual Evidence

| State | Screenshot |
| --- | --- |
| guest | `../phase-11/screenshots/public-header-guest.png` |
| member | `../phase-11/screenshots/public-header-member.png` |
| admin | `../phase-11/screenshots/public-header-admin.png` |

Capture metadata: `../phase-11/phase11-capture-metadata.json`.
