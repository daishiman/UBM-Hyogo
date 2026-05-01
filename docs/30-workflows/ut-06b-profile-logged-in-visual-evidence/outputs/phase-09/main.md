# Phase 9 Output: 品質保証

| gate | 合格基準 | 実行タイミング |
| --- | --- | --- |
| free-tier | staging login / capture は必要最小回数 | Phase 11 |
| secret hygiene | grep 0 hit | Phase 11 後 / Phase 13 |
| a11y observation | read-only 表記と外部 edit CTA を note 化 | Phase 11 |
| portability | runbook と snippet だけで再取得可能 | Phase 10 |

実 evidence 取得前のため、本 Phase では gate 設計を completed 条件とし、実測は Phase 11/13 で再実行する。
