# System Spec Update Summary

## Step 1-A: Current Canonical Sync

`docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md` を workflow-local SSOT として追加した。aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory を同 wave で更新し、09a / 09h の stale `apps/web/src/app` path も `apps/web/app` へ補正した。

## Step 1-B: Index / Artifact Sync

- root `artifacts.json`: added
- `outputs/artifacts.json`: added
- Phase 12 strict 7 files: added under `outputs/phase-12/`
- root `index.md`: `prototype_coverage` metadata and SSOT section added
- `apps/web/app/layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx`: parallel-04 root chrome contract implemented in same cycle
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`: workflow entry added
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`: workflow current canonical set added
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`: active workflow entry added
- `.claude/skills/aiworkflow-requirements/references/workflow-ui-prototype-design-system-foundation-artifact-inventory.md`: artifact inventory added
- `docs/00-getting-started-manual/specs/09a-prototype-map.md` and `09h-shell-and-fixtures.md`: stale app path corrected

## Step 1-C: Stale Contract Withdrawal

旧 `src/app` 系 path と route-group inferred path を実装対象とする記述を撤回し、現行 `apps/web/app/**` path へ補正した。`/profile` は `apps/web/app/profile/**` を current path として維持する。

## Step 2: Domain Sync

新規 API endpoint / D1 schema / Google Form 仕様の変更はない。UI prototype reflection の範囲内で、既存正本 09a-09h を参照する。
