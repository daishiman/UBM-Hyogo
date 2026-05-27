# Phase 11 — Manual / Runtime Test

## 1. 目的

`/members` の visual evidence を current workflow root に保存する。対象は comfy / dense / list / mobile / empty / focus の 6 シナリオ。

## 2. Evidence Inventory

| evidence | path | status |
| --- | --- | --- |
| manual result | `outputs/phase-11/manual-test-result.md` | present |
| capture metadata | `outputs/phase-11/phase11-capture-metadata.json` | present |
| screenshot coverage | `outputs/phase-11/screenshot-coverage.md` | present |
| Playwright report / trace | `outputs/phase-11/playwright-report/`, `outputs/phase-11/test-results/` | present |
| screenshots | `outputs/phase-11/screenshots/EV-*.png` | pending_runtime |

## 3. 実行コマンド

```bash
PLAYWRIGHT_EVIDENCE_TASK=members-list-prototype-alignment pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/members-prototype-alignment.spec.ts --project=desktop-chromium
```

## 4. 判定

Local typecheck と component tests は PASS。Playwright visual は current workflow root へ出力される設定だが、最新実行では local webServer readiness timeout で停止したため screenshot は pending。pending は本 workflow 内に残し、別 backlog へ逃がさない。

## 5. DoD

- [x] Playwright spec path が `members-list-prototype-alignment` を指す
- [x] list density assertion が `MemberTable` ではなく `MemberGrid[data-density="list"]` を見る
- [x] screenshot 未取得は `pending_runtime` として Phase 12 inventory に明示する
