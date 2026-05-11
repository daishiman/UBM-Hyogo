# Phase 4 — テスト作成 evidence

## fixture（新規）

- `scripts/__tests__/coverage-gate-e2e.fixture/pass/coverage-summary.json` (`pct: 85.0`)
- `scripts/__tests__/coverage-gate-e2e.fixture/fail-79/coverage-summary.json` (`pct: 79.99`)
- `scripts/__tests__/coverage-gate-e2e.fixture/missing/.gitkeep`（ファイル不在ケース）

## ローカル検証コマンド

```
THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/pass     bash scripts/coverage-gate-e2e.sh   # exit 0
THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/fail-79  bash scripts/coverage-gate-e2e.sh   # exit 1
THRESHOLD_FIXTURE=scripts/__tests__/coverage-gate-e2e.fixture/missing  bash scripts/coverage-gate-e2e.sh   # exit 1
```

CI 実 run 系（T-3b-8..16）は PR 後に取得。
