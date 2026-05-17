# Baseline import log

```bash
$ git fetch origin chore/visual-baseline-update-25960870639:baseline-update-tmp
From https://github.com/daishiman/UBM-Hyogo
 * [new branch] chore/visual-baseline-update-25960870639 -> baseline-update-tmp

$ git cherry-pick b3fb7f4a
[task/709-visual-baseline-runtime-capture <new>] chore(visual): update baselines via workflow_dispatch
 51 files changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/full-visual-admin-audit-desktop-visual-full-chromium-desktop-linux.png
 ... (50 more PNG files)

$ ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png | wc -l
51
```

## Decision

`git merge --no-ff` ではなく `git cherry-pick` を採用した理由:

- baseline-update branch は `dev` ベースで、`dev` は本 task branch の親 `84199554` から大きく進んでいた (parallel-07/08/09/10 等)
- baseline cherry-pick のみで 51 PNG (`Bin 0 -> ...`) を取り込めば、dev の churn を持ち込まずスコープが minimal にできる
- 不変条件 #1 (task-18-fu infra を破壊しない) / #3 (baseline は CI 経由のみ) の両方を満たす
