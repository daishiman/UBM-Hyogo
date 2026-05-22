# 2026-05-16 task-709 visual baseline runtime capture

## Summary

Synchronized `docs/30-workflows/task-709-visual-baseline-runtime-capture/` as `PR_OPEN_MERGE_DIRTY / implementation / VISUAL`.

## Canonical Workflow

- `docs/30-workflows/task-709-visual-baseline-runtime-capture/`

## Canonical Contracts

- Continues task-18-fu by completing the user-gated runtime capture path for 17 routes x 3 viewport visual-full baselines.
- Keeps task-18-fu Playwright infra as upstream implementation.
- Records 51 PNG baseline capture/import, CI 2-run stability evidence (`25961476237` / `25961551972`), matrix 17/19 sync, commit, push, and PR #760 creation as completed.
- Records PR #760 `mergeStateStatus=DIRTY` as the remaining merge-readiness blocker.
- Formalizes branch protection required-check promotion as `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md`.

## Evidence Boundary

This wave creates root/output `artifacts.json`, Phase 11 runtime evidence, Phase 12 strict 7 outputs, unassigned follow-up, aiworkflow ledgers, and records PR #760. It does not resolve PR #760 merge conflicts or mutate branch protection.

## Lessons Learned

- `lessons-learned/lessons-learned-task-709-visual-baseline-runtime-capture-2026-05.md`
  - L-709-001: Actions PR-write 権限失敗 → baseline branch push 済みなら cherry-pick で scope 最小化
  - L-709-002: visual-full stability evidence は `workflow_dispatch` 2 連続 PASS を必須化
  - L-709-003: baseline は count + path + sha256 の 3 点セットを Phase 11 evidence に固定
  - L-709-004: `PR_OPEN_MERGE_DIRTY` workflow_state で merge-readiness を語彙レベルで分離
  - L-709-005: branch protection required check 昇格は独立 follow-up で formalize

## Skill Feedback

No skill source rule change is required. Existing task-specification-creator rules for strict 7 outputs, state vocabulary, artifacts parity, and user-gated runtime boundary were applied.
