# changelog fragment: Issue #295 tag queue race smoke

Issue #295 / UT-07A-03 was synchronized as `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_pending`.

Same-wave changes:

- `docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/` is the canonical workflow root.
- `scripts/smoke/tag-queue-race.mjs` adds a no-dependency concurrent resolve smoke.
- `--side-effect-input` lets before/after SQL deltas participate in the runner verdict for AC-4.
- `--concurrency < 2` is a usage error (exit 2), not a successful skip.
- `scripts/smoke/__tests__/tag-queue-race.test.sh` covers dry-run, analysis pass/fail, side-effect pass/fail, usage error, and secret redaction.
- `scripts/smoke/README.md` documents staging usage.
- UT-07A-03 unassigned task is marked consumed by this workflow.
- Phase 11 runbook SQL is aligned with current D1 schema: `queue_id`, `response_id`, `suggested_tags_json`, `target_type`, `target_id`.

Staging runtime execution, commit, push, and PR remain user-gated.
