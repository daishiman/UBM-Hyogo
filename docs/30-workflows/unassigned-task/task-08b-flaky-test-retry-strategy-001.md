# task-08b-flaky-test-retry-strategy-001

## 概要

Playwright を desktop + mobile で 70+ test 並列実行する際の flaky test を観測・分類し、`playwright.config.ts` の `retries` / `workers` / `timeout` を実走実績に基づいてチューニングする。CI 偽 fail による merge ブロックを抑制する。

## 苦戦箇所【記入必須】

- 対象: `apps/web/playwright.config.ts` の `retries: 0` / `workers` 設定および `apps/web/playwright/global-setup.ts`
- 症状: scaffolding-only 段階では実走していないため、network 競合 / D1 seed race / Auth.js cookie expiry 起因の flaky 傾向が未観測。本番 wave 統合後に CI 偽 fail で merge が頻繁にブロックされるリスク
- 参照: `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/unassigned-task-detection.md` の U-3

## スコープ（含む/含まない）

含む:

- CI 実走 10 回以上の flaky 観測 log 集計（`playwright-report/results.json` の `status: flaky` 抽出）
- flaky 原因分類（network / seed race / timing / Auth fixture / browser specific）
- `retries` / `workers` / `expect.timeout` / `actionTimeout` の最適値決定と `playwright.config.ts` 反映
- D1 seed の serialize 戦略（global-setup の lock 取得 or test-level fixture）

含まない:

- production 環境への load test
- Playwright 本体 / browser engine のバグ修正
- visual regression 起因の false positive（U-2 で扱う）

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `retries` を上げて flaky を隠蔽し本物の bug を見逃す | retry 発生 test を CI 上で必ず report し、weekly review で原因分類 |
| `workers` 増で D1 seed が race | global-setup で `await migrate(); await seed();` を直列化、test 間の write 共有を禁止 |
| Auth.js session cookie expiry で再ログイン loop | fixture で `expires` を 1h 以上に設定し、global-setup で再生成 |
| mobile project と desktop project の cookie 共有事故 | project ごとに `storageState` を分離 |

## 検証方法

```bash
# 10 回連続実走で flaky 率を測定
for i in 1 2 3 4 5 6 7 8 9 10; do
  mise exec -- pnpm --filter @ubm-hyogo/web test:e2e --reporter=json > /tmp/run-$i.json
done
jq '[.suites[].specs[].tests[] | select(.results[].status == "flaky")] | length' /tmp/run-*.json

# config の retries / workers が ADR と一致するか
rg "retries|workers" apps/web/playwright.config.ts
```

期待: flaky 率 < 1%、retries は 1 以下、再現する flaky は cause-tagged Issue が起票済み。

## 参照

- `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-12/unassigned-task-detection.md` (U-3)
- `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md`
- 09a / 09b release runbook の品質基準セクション
