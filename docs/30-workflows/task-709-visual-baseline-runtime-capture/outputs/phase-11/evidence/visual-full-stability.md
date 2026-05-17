# visual-full 2-run stability evidence

51 baseline PNG が CI 上で安定して合致することを確認するため、`playwright-visual-full` を同一 task branch 上で 2 回連続実行 (workflow_dispatch 経由)。

## Trigger note

PR #760 上の `pull_request` トリガーは発火しなかった。これは GitHub が `pull_request` workflow 定義として **target branch (dev) の workflow ファイル** を参照する仕様のため。dev 上の `playwright-visual-full.yml` はまだ MVP-PAUSE 状態 (`pull_request:` コメントアウト) であり、本 PR が merge されて初めて `pull_request` トリガーが有効化される。

したがって本 PR scope では `workflow_dispatch` を 2 回起動して stability 検証を行った。merge 後は PR ごとに `pull_request` トリガーが自動発火する。

## Results

| Run | id | viewport | conclusion | duration |
| --- | --- | --- | --- | --- |
| #1 | 25961476237 | desktop | success | 3m19s total |
| #1 | 25961476237 | tablet | success | (matrix 並列) |
| #1 | 25961476237 | mobile | success | (matrix 並列) |
| #2 | 25961551972 | desktop | success | — |
| #2 | 25961551972 | tablet | success | — |
| #2 | 25961551972 | mobile | success | — |

URLs:
- run #1: https://github.com/daishiman/UBM-Hyogo/actions/runs/25961476237
- run #2: https://github.com/daishiman/UBM-Hyogo/actions/runs/25961551972

## Verdict

51 baseline PNG に対し連続 2 回の visual diff が `maxDiffPixelRatio: 0.02` 以内で完全 PASS。flakiness なし。task-18-fu の `animations: 'disabled'` / `caret: 'hide'` / `scale: 'css'` mask 設定が有効に機能していることを確認。

`pull_request` トリガー経由の verification は merge 後の次 PR で自然に発生する。
