# Implementation Guide - issue-623

## Part 1: Middle School Level

Imagine a school where every real test paper must use the same red label. Some papers still have an old blue label, and the teacher has to check both labels every time. This task writes the plan for replacing the old labels with the red label and adding a door check so nobody brings the old label back.

The important point is order. First, rename the old files. Next, make Vitest look only for the new name. Then add a local check and a GitHub check. If the order changes, tests can disappear from the runner without anyone noticing.

| Technical word | Plain wording |
| --- | --- |
| Vitest | The test checker |
| suffix | The ending label on a file name |
| CI gate | A door check before changes are accepted |
| lefthook | A local door check before commit |
| workflow | A GitHub-side automatic check |

## Part 2: Technical Guide

### State Contract

Current close-out state (updated 2026-05-12):

- `metadata.workflow_state`: `implementation_completed`（ローカル実装完了 / commit・push・PR 未実施）
- `metadata.implementation_status`: `IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- Phase status vocabulary: `implemented_local_runtime_pending`
- Visual evidence: `NON_VISUAL`; screenshot evidence is not required. See `outputs/phase-11/visual-verification-skip.md`.

Implementation summary (2026-05-12):

- 159 件の `*.test.{ts,tsx}` を `git mv` で `*.spec.{ts,tsx}` に rename（履歴保持）
- `vitest.config.ts` `test.include` を `*.spec.{ts,tsx}` 単一に収斂、`coverage.exclude` から `**/*.test.{ts,tsx}` 削除
- `scripts/hooks/block-test-suffix.sh` 新規追加（chmod +x 済）、`lefthook.yml` `pre-commit.commands.block-test-suffix` 追加
- `.github/workflows/verify-test-suffix.yml` 新規追加（push: main/dev, pull_request: main/dev）
- ADR `test-file-suffix-adr.md` に「二段階対応終了 2026-05-12」追記、CLAUDE.md §重要な不変条件 に新規 spec-only ルール追記
- skill changelogs（`task-specification-creator` / `aiworkflow-requirements`）に `v2026.05.12-issue623-implementation-completed` 追加

Measured evidence:

- `pnpm typecheck`: 全 5 workspace project Done
- Sample vitest run（`packages/shared/src/auth.spec.ts`）: 8 tests passed
- フル `pnpm test --run` の `numTotalTests` parity 測定は実装機 disk full（ENOSPC）のため未取得。CI 側で gate 取得想定。

Outstanding (Phase 13 user-gated):

- commit / push / PR 作成（user 明示指示後）
- フル `pnpm test --run` JSON evidence の CI 取得
- `completed-tasks/task-issue-325-followup-003-vitest-spec-suffix-convergence.md` は source unassigned consumed record

### Target Interfaces

| Component | Interface | Expected behavior |
| --- | --- | --- |
| `scripts/migration/rename-test-to-spec.sh` | `rename-test-to-spec.sh <path> [--dry-run]` | Rename `*.test.ts(x)` to `*.spec.ts(x)` using `git mv` |
| `scripts/hooks/block-test-suffix.sh` | no args | Reject staged `*.test.ts(x)` with exit 1 |
| `.github/workflows/verify-test-suffix.yml` | GitHub Actions workflow | Fail PR / main / dev push when `*.test.ts(x)` exists |
| `vitest.config.ts` | `test.include` / `coverage.exclude` | Use `*.spec.{ts,tsx}` only |

### Required Order

1. Capture before evidence.
2. Rename all `*.test.ts(x)` files with `git mv`.
3. Fix any import path drift.
4. Collapse `vitest.config.ts` to `*.spec.{ts,tsx}` only.
5. Add `block-test-suffix` and wire `lefthook.yml`.
6. Add `verify-test-suffix.yml`.
7. Update CLAUDE.md / ADR / skill changelogs.
8. Collect Phase 11 evidence and only then promote from `spec_created`.

### Edge Cases

- Do not edit test assertions during the rename wave.
- Do not move `__tests__` directories in this task.
- Do not mark Phase 11 or Phase 12 as runtime PASS before actual logs exist.
- Do not move the source unassigned task to `completed-tasks/` until implementation evidence exists.
