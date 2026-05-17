# Phase 9 QA

State: `completed`

実行日: 2026-05-16
実行ブランチ: `task/709-visual-baseline-runtime-capture`

## Results

| Command | Verdict | Notes |
| --- | --- | --- |
| `mise exec -- pnpm typecheck` | PASS | 5 workspaces (shared / integrations / integrations-google / web / api) all green |
| `mise exec -- pnpm lint` | PASS | eslint + tsc strict, depcruise OK (1400 modules / 2012 dependencies), stablekey scan OK |
| `python3 -c yaml.safe_load(...)` (yq 代替) | PASS | `playwright-visual-full.yml` の `pull_request.paths` 長 = 6 / `schedule[0].cron` = `0 18 * * *` / `workflow_dispatch` = null mapping |
| baseline PNG count | PASS | 51 (= 17 routes × 3 viewports) |
| `playwright-visual-full` CI 1st run | PASS | `workflow_dispatch` run `25961476237`。PR #760 の `pull_request` は target branch dev 側 workflow がまだ MVP-PAUSE のため未発火 |
| `playwright-visual-full` CI 2nd run | PASS | `workflow_dispatch` run `25961551972`。3 viewport job 全て success |
| `playwright-visual-full.yml` baseline missing behavior | PASS | baseline 取得済み後の gate として、snapshot 欠落時は skip 成功ではなく `exit 1` に変更 |

## Commands Executed

```bash
$ mise exec -- pnpm typecheck
… apps/web typecheck: Done / apps/api typecheck: Done / packages/* all Done

$ mise exec -- pnpm lint
✔ no dependency violations found (1400 modules, 2012 dependencies cruised)
[stablekey-literal-lint] OK (mode=warning, scanned=387 files, stableKeys=31)
apps/web lint: Done / apps/api lint: Done / packages/* all Done

$ ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png | wc -l
51
```

## CI Run References

| Item | URL / id |
| --- | --- |
| baseline capture | https://github.com/daishiman/UBM-Hyogo/actions/runs/25960870639 (update-baseline: succeeded for PNG generation; PR-creation step failed due to Actions write-PR permission — recovered via direct cherry-pick of `chore/visual-baseline-update-25960870639` @ `b3fb7f4a`) |
| visual-full stability run #1 | https://github.com/daishiman/UBM-Hyogo/actions/runs/25961476237 |
| visual-full stability run #2 | https://github.com/daishiman/UBM-Hyogo/actions/runs/25961551972 |
| PR #760 | https://github.com/daishiman/UBM-Hyogo/pull/760 (`mergeStateStatus=DIRTY`) |

## Verdict

local 静的検証 (typecheck / lint / yaml syntax / PNG count) は全て PASS。
visual-full CI の 2-run stability 検証は `workflow_dispatch` 2 回で PASS。PR #760 の `pull_request` trigger は dev merge 後の次 PR から自然発火するため、post-merge verification は branch-protection follow-up の前提手順に含める。
