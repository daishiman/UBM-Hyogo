# Baseline update workflow run

- workflow: `.github/workflows/playwright-visual-baseline-update.yml`
- run id: 25960870639
- URL: https://github.com/daishiman/UBM-Hyogo/actions/runs/25960870639
- triggered by: `daishiman` (workflow_dispatch from local `gh` CLI)
- environment approval: `visual-baseline-approval` — approved by `daishiman` via GitHub UI
- ref: `task/709-visual-baseline-runtime-capture`
- input: `reason='task-709 initial baseline capture (51 PNG)'`

## Job outcome

| step | result | notes |
| --- | --- | --- |
| Install playwright browsers | PASS | chromium with deps installed |
| Build apps/web | PASS | Next.js build via webpack |
| Regenerate baselines (`--update-snapshots` × 3 viewports) | PASS | 51 PNG files created |
| Open PR with baseline diff (`peter-evans/create-pull-request@v7`) | FAILED | `GitHub Actions is not permitted to create or approve pull requests.` — repo Actions setting blocks Actions-authored PRs |

## Recovery

Branch `chore/visual-baseline-update-25960870639` was successfully pushed (commit `b3fb7f4a`) and the 51 PNG files are intact on it. The PR-creation failure is purely a permissions-on-Actions-tokens issue and does not affect baseline content.

Recovery action (in-session, user-approved):

```bash
git fetch origin chore/visual-baseline-update-25960870639:baseline-update-tmp
git cherry-pick b3fb7f4a   # 51 PNG only, no dev churn
```

51 PNG が `task/709-visual-baseline-runtime-capture` に取り込まれた (`ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png | wc -l` → 51)。

## Follow-up

GitHub Actions の Settings → "Allow GitHub Actions to create and approve pull requests" を将来有効化することで、recovery path を経由せず baseline-update PR が自動生成される。本タスクではコード変更不要だが、運用 follow-up として `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` に併記する余地あり。
