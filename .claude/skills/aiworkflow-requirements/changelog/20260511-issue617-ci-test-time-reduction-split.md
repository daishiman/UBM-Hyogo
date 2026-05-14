# 2026-05-11 Issue #617 CI test time reduction split

Registered `docs/30-workflows/issue-617-ci-test-time-reduction-split/` as an `implemented_local_runtime_pending / implementation / NON_VISUAL` workflow.

Key decisions:

- Preserve closed Issue #617 and use `Refs #617` only.
- Consume historical follow-up `task-issue-577-followup-003-test-grouping-by-d1-usage.md` while preserving its #618 provenance.
- Prefer `coverage-gate-shard` matrix plus aggregate `coverage-gate` to avoid branch protection mutation.
- Keep shard mode artifact-only; enforce 80% coverage only in aggregate `coverage-gate --no-run`.
- Add full root/output artifacts parity, Phase 11 NON_VISUAL evidence, and Phase 12 strict 7 outputs.

GitHub Actions runtime wall-clock evidence, commit, push, and PR remain user-gated.
