# Phase 12 Main

## Summary

`issue-998-members-publish-state-production-rollout` is an `implemented_local_runtime_pending` implementation spec plus runtime-ops runbook that resolves Issue #998 ("form respondents do not appear on `/members`") through production. This cycle authored Phase 1-13, task specs A/B/C, and the strict 7 Phase 12 outputs, then applied the only code change: the production `MEMBERS_AUTO_PUBLISH_ON_CONSENT` flag in `apps/api/wrangler.toml` (`"false"` → `"true"`). Auto-publish policy, sync integration, backfill endpoint, diagnostics, public filter, and ops scripts are existing implementation reused unchanged (`implementation_mode: verify_existing`).

## Scope Boundary

No commit, PR, staging deploy, staging/production D1 mutation, backfill apply, or browser smoke was executed. Issue #998 is CLOSED, so PR wording is `Refs #998` only. The production flag change (Task A) is applied and Gate-B local verification passed; the staging (Task B) and production (Task C) runtime ops are user-gated (`governance_mutation_user_gate=true`). These remaining runtime items are tracked in `artifacts.json` Gate-C and Phase 13.

## Visual Evidence

`visualEvidence` is `VISUAL_ON_EXECUTION`. The `/members` browser smoke screenshots are captured at runtime execution time (user-gated). At the spec-creation stage no screenshot exists. Phase 11 records every runtime artifact as `pending (Gate-C, user-gated)`.

## Corrected Decisions

- The public visibility filter lives in `apps/api/src/repository/publicMembers.ts` (`WHERE s.public_consent = 'consented' AND s.publish_state = 'public' AND s.is_deleted = 0 AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)`), with the shared invariant documented in `apps/api/src/_shared/public-filter.ts`. The index/architecture shorthand path `routes/public/publicMembers.ts` was normalized to the verified repository path.
- `decidePublishState(input: AutoPublishInput): PublishState` takes `currentPublishState` / `publicConsent` / `hasAdminExplicitOverride` / `flagEnabled` and promotes only `member_only` + `consented` to `public`; `hidden` and admin override are preserved.
- Canonical publish state is `public | member_only | hidden`; legacy `published` / `private` are normalized by `normalizePublishState`.
- The backfill endpoint `POST /admin/sync/backfill-publish-state?dryRun=true|false` (`runBackfillPublishState`) returns `scanned` / `candidates` / `applied` / `skipped:{alreadyPublic, adminExplicit, consentNotMet, deleted}` and defaults to `dryRun=true`; apply writes `updated_by='system:backfill'` in batches.
- Enabling the flag only affects future sync writes; existing `member_only` records require the backfill apply step before `/members` recovers.
