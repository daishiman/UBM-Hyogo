# Phase 5 Main

Status: `COMPLETED`

`mise exec -- pnpm --filter @ubm-hyogo/{web,api,shared,integrations} test:coverage` を 4 並列で実行し全件 PASS。各ワークスペースの `coverage/coverage-summary.json` を本 phase 配下にコピーした。

## 実行結果

| package | tests | line% | branch% | function% | statements% |
| --- | --- | --- | --- | --- | --- |
| @ubm-hyogo/web | PASS | 86.88 | 90.17 | 88.01 | 86.88 |
| @ubm-hyogo/api | PASS | 88.76 | 83.01 | 88.88 | 88.76 |
| @ubm-hyogo/shared | PASS | 95.51 | 86.00 | 95.45 | 95.51 |
| @ubm-hyogo/integrations | PASS (58 tests) | 100.00 | 100.00 | 100.00 | 100.00 |

> integrations は `index.ts` 5 行のみ集計対象（テスト群は forms/* 配下に分散）。

## 産出物

- `coverage-summary-web.json` (apps/web/coverage からコピー)
- `coverage-summary-api.json` (apps/api/coverage からコピー)
- `coverage-summary-packages.json` (shared / integrations の total を統合)

## 注意点

- coverage 計測は完全 PASS。テスト失敗による partial summary はなし。
- 計測時の Node は `mise exec --` 経由で 24.15.0 を保証。
