# workflow-admin-visual-baseline-admin-routes-task-e artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/` |
| root artifacts | `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/artifacts.json` |
| Phase 11 manual placeholder | `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-11/manual-test-result.md` |
| Phase 11 regression placeholder | `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-11/regression-dry-run.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 13 PR placeholder | `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-13/pr-creation-result.md` |
| parent workflow | `docs/30-workflows/admin-ui-prototype-alignment/` |
| source task | `docs/30-workflows/admin-ui-prototype-alignment/tasks/task-E-visual-baseline-admin-routes.md` |
| implementation targets | `apps/web/playwright/tests/visual/admin-shell/*.spec.ts`, `apps/web/playwright/tests/visual/admin-shell/_helpers.ts`, `apps/web/playwright.config.ts`, `.github/workflows/playwright-smoke.yml` |

## Contract

`admin-visual-baseline-admin-routes-task-e` is registered as `implemented_local_runtime_pending / implementation / VISUAL`.

The workflow creates the contract for admin staging visual baselines: 10 required routes x 4 viewport = 40 Linux baseline PNG by default, plus 2 env-gated detail routes x 4 viewport = 48 PNG only when both seed IDs are present. A 44 PNG partial-detail baseline is forbidden. Runtime baseline capture, bot baseline push, empty retrigger commit, branch protection PUT, commit, push, and PR are user-gated.

## Lessons Learned

苦戦箇所の体系化は `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-admin-visual-baseline-admin-routes-task-e-2026-05.md`（L-AVBE-001..006）に格納。要点は次の通り。

- L-AVBE-001: 詳細ルート both-or-none を単一 `DETAIL_SEEDS_READY` フラグで強制し 44 PNG 中間状態を仕様で禁止帯にする。
- L-AVBE-002: admin-shell 系の `EVIDENCE_DIR` は spec パス由来で自動分岐し、workflow root と evidence path を 1:1 に保つ。
- L-AVBE-003: 新 project 追加と同 wave で既存 `visual-chromium` に `testIgnore` を入れ、local と staging の baseline 衝突を防ぐ。
- L-AVBE-004: N project × 1 spec set 構成は `snapshotPathTemplate` に `{projectName}` を必ず含め baseline 食い合いを防ぐ。
- L-AVBE-005: storageState は既存 setup-minted パスを再利用し、Phase 5 draft の新規パスを rehydrate しない。
- L-AVBE-006: spec 統合は rename ではなく `delete + add` を 1 commit で行い旧 baseline PNG ごと物理削除する。
