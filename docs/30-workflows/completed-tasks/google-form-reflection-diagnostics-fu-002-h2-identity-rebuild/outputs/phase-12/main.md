# Phase 12 Main

## Summary

H2 identity rebuild was implemented locally as an API-side identity auto-link and bridge-backed migration.
The original draft assumed `member_responses.member_id`; current schema does not have that column, so the design was corrected to use `tag_assignment_queue(response_id, member_id)` when an existing member bridge is available.
Bridge-less responses are handled by verified-email auto-link with an `autolink:<uuid>` member id and keep existing `member_status` gates intact.

## Local Result

Implemented files include migration 0021, `identities.ts` auto-link helpers, `session-resolve.ts` integration, focused D1/contract tests, and the auth system spec.
Local focused tests, API typecheck, and API lint pass.
Staging/prod D1 backup, migration apply, runtime diagnostics, commit, push, and PR remain user-gated.
