# mypage-prototype-alignment Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| workflow_id | `mypage-prototype-alignment` |
| workflow root | `docs/30-workflows/mypage-prototype-alignment/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / existing-ui-alignment` |
| created_at | 2026-05-23 |
| owner | daishiman |
| prototype source | `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` (`MyProfilePage`) |
| implementation boundary | existing `/profile` UI alignment; no new API, D1 schema, Google Form schema, or primitive API |

## Current Canonical Artifacts

| Artifact | Path | Status |
| --- | --- | --- |
| workflow index | `docs/30-workflows/mypage-prototype-alignment/index.md` | present |
| root metadata | `docs/30-workflows/mypage-prototype-alignment/artifacts.json` | present |
| outputs metadata | `docs/30-workflows/mypage-prototype-alignment/outputs/artifacts.json` | present / parity with root |
| Phase 1-13 specs | `docs/30-workflows/mypage-prototype-alignment/outputs/phase-{1..13}/phase-{1..13}.md` | present |
| Phase 11 visual evidence | `docs/30-workflows/mypage-prototype-alignment/outputs/phase-11/` | present, screenshots captured |
| Phase 12 strict 7 | `docs/30-workflows/mypage-prototype-alignment/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | present |

## Implementation Targets

| Area | Implemented files |
| --- | --- |
| Profile page | `apps/web/app/profile/page.tsx` |
| Profile components | `apps/web/app/profile/_components/{ProfileHeader,StatusSummary,VisibilitySummary,ProfilePreview,ProfileFields,EditCta.client,RevalidateModal,RequestActionPanel}.tsx` |
| Profile adapters | `apps/web/app/profile/_lib/{visibility-counts,profile-summary}.ts` |
| Global member nav | `apps/web/src/components/layout/MemberHeader.tsx` |
| Tests | focused component/unit specs under `apps/web/app/profile/**` and `MemberHeader.spec.tsx` |

## Contract Summary

| Contract | Value |
| --- | --- |
| edit model | Google Form re-answer via `editResponseUrl ?? fallbackResponderUrl` |
| public profile action | individual link `/members/{memberId}` from profile page only when public |
| global public nav | generic `/members` link in `MemberHeader` |
| API surface | existing `/me`, `/me/profile`, `/me/visibility-request`, `/me/delete-request` only |
| forbidden | inline profile body edit, `PATCH /me/profile`, D1 direct access from web, HEX color literals, new primitive API |

## Evidence Boundary

Phase 11 screenshots are captured in the local Playwright fixture environment and recorded with `Status=present` in the compliance check. Commit, push, and PR remain user-gated.

## Same-Wave Sync

| Target | Status |
| --- | --- |
| `indexes/quick-reference.md` | synced |
| `indexes/resource-map.md` | synced |
| `references/task-workflow-active.md` | synced |
| `SKILL-changelog.md` | synced |
| `LOGS/_legacy.md` | synced |
