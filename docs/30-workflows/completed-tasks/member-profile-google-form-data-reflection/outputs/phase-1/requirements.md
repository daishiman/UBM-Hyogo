# Phase 1 Requirements Evidence

Status: completed.

P50 check confirmed this is a new implementation wave: the existing `member-data-source-precedence-and-profile-session-fix` work did not address `schema_questions` being empty and causing questionId mapping collapse.

Accepted scope:

- Lane A: derive stable keys from raw Google Form labels as fallback when `schema_questions` rows are empty or incomplete.
- Lane B: detect fail-silent mapping collapse with `qidMapSize` and `fullyUnmappedResponses`, emit warning / `SYNC_ALERTS`, and keep sync verdict non-breaking.
- Lane C: document read-only diagnosis and user-gated staging recovery.

Out of scope:

- `apps/web` rendering changes.
- D1 migration, Google Form schema change, cron interval change.
- commit, push, PR, deploy, staging mutation.

