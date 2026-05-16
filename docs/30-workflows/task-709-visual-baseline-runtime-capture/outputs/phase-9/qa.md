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
| `playwright-visual-full` CI 1st run | PENDING | `pull_request` トリガーは PR 作成時に発火する設計のため、PR 作成後の run を確認する（後段の Phase 11 evidence に追記） |
| `playwright-visual-full` CI 2nd run | PENDING | empty commit 1 件で再走させ stability 確認 |

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
| visual-full PR run #1 / #2 | PR 作成後に追記 |

## Verdict

local 静的検証 (typecheck / lint / yaml syntax / PNG count) は全て PASS。
visual-full CI の 2-run stability 検証は PR 作成後の trigger 経由で実施し、Phase 11 main.md に追記する。
