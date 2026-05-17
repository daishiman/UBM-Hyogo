# AC Matrix

| AC | Local verification | Runtime verification | Status |
| --- | --- | --- | --- |
| AC-1 concurrent POST | `--concurrency >= 2` validation; `runConcurrentResolve` uses `Promise.all` | staging result has total request count equal to concurrency | local ready / runtime pending |
| AC-2 exactly one success | `--analyze-only` pass/fail fixtures | `analysis.successes === 1` in `result.json` | local ready / runtime pending |
| AC-3 losers are `race_lost` | `--analyze-only` pass/fail fixtures | `analysis.raceLosts >= 1` and `others === 0` | local ready / runtime pending |
| AC-4 side effects once | `--side-effect-input` pass/fail fixtures | side-effect summary derived from `before.txt` / `after.txt` | local ready / runtime pending |
| AC-5 evidence saved | focused test verifies local evidence path creation through error-free paths | `result.json`, `before.txt`, `after.txt` exist under `outputs/phase-11/` | local ready / runtime pending |
