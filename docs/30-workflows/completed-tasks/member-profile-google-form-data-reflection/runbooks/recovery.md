# Google Form profile reflection recovery runbook

## Scope

This runbook restores profile reflection after `schema_questions` is empty or incomplete and responses were stored as `__extra__:<questionId>`.

User approval is required before any staging or production mutation. Read-only diagnostics may be run without mutation approval.

## Diagnostics

Run all D1 access through `scripts/cf.sh`; do not call `wrangler d1` directly.

```bash
bash scripts/cf.sh d1 staging execute ubm-hyogo-db-staging --command "SELECT revision_id, COUNT(*) AS question_count FROM schema_questions GROUP BY revision_id ORDER BY revision_id DESC LIMIT 5"
bash scripts/cf.sh d1 staging execute ubm-hyogo-db-staging --command "SELECT response_id, revision_id, length(answers_json) AS answers_len, answers_json FROM member_responses WHERE response_id = '<response_id>'"
bash scripts/cf.sh d1 staging execute ubm-hyogo-db-staging --command "SELECT stable_key, COUNT(*) AS n FROM response_fields WHERE response_id = '<response_id>' GROUP BY stable_key ORDER BY stable_key"
```

Expected healthy state: `schema_questions` has rows for the active revision, `answers_json` is not `{}`, and `response_fields` contains known stable keys such as `fullName`.

## Recovery

1. Execute schema sync with `POST /admin/sync/schema`.
2. Re-run the `schema_questions` diagnostic and confirm active revision rows exist.
3. Execute response sync with `POST /admin/sync/responses?fullSync=true`.
4. Re-run `member_responses` and `response_fields` diagnostics. Confirm `answers_json != '{}'` and at least one known stable key exists.
5. Open the public member detail page and capture before/after evidence when user-approved runtime access is available.

## Cleanup Decision

Old `__extra__:<questionId>` rows may remain after fullSync because known stableKey rows use different keys. They are harmless for public rendering because the public profile view reads known visible stable keys. No cleanup task is created in this cycle.

