# task-25-followup-visual-baseline-expansion

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | `task-25-followup-visual-baseline-expansion` |
| Source | `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/` |
| workflow_state | `spec_created` |
| Classification | `implementation / VISUAL` |

## 苦戦箇所

Task-25 confirmed that the current visual gate covers only 4 high-value screens while the MVP recovery matrix tracks 19 surfaces. Expanding visual baselines inside task-25 would mix documentation reconciliation with screenshot baseline approval.

## リスクと対策

| Risk | Mitigation |
| --- | --- |
| Screenshot churn from adding too many baselines at once | Define a fixed route list and review budget before implementation |
| Baseline ownership unclear | Use `apps/web/playwright/tests/visual/` as the implementation owner |

## 検証方法

- Add focused Playwright visual specs for approved surfaces.
- Run `pnpm --filter @ubm-hyogo/web playwright test --project=chromium apps/web/playwright/tests/visual`.
- Record screenshot evidence under the owning workflow outputs.

## スコープ

Included: approved non-baseline UI surfaces from `SMOKE-COVERAGE-MATRIX.md`.

Excluded: error boundary fixture design and loading-state latency fixture design.
