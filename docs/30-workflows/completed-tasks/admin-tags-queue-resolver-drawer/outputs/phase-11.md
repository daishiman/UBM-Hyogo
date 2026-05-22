# Phase 11 — Evidence 収集（VISUAL）

VISUAL task のため screenshot 必須。`outputs/phase-11/` を canonical 置き場とする。

## evidence canonical paths

### screenshots（5 枚必須）

| file | 画面状態 |
| --- | --- |
| `outputs/phase-11/screenshots/admin-tags-drawer-closed.png` | `/admin/tags` 初期表示（list のみ、drawer 非表示） |
| `outputs/phase-11/screenshots/admin-tags-drawer-confirmed-open.png` | list 行「Resolve」押下 → drawer open（action=confirmed, tagCodes 全選択） |
| `outputs/phase-11/screenshots/admin-tags-drawer-rejected-open.png` | drawer 内で rejected radio 選択 → reason textarea 表示 |
| `outputs/phase-11/screenshots/admin-tags-drawer-validation-error.png` | confirmed で tagCodes 全 uncheck → submit → inline error 表示 |
| `outputs/phase-11/screenshots/admin-tags-drawer-terminal-disabled.png` | `status="dlq"` item を選択 → drawer open / submit disabled |

### log canonical paths

| file | 内容 |
| --- | --- |
| `outputs/phase-11/logs/typecheck.log` | V-1 出力 |
| `outputs/phase-11/logs/lint.log` | V-2 出力 |
| `outputs/phase-11/logs/test-drawer.log` | V-3 出力 |
| `outputs/phase-11/logs/test-panel.log` | V-4 出力 |
| `outputs/phase-11/logs/test-api.log` | V-5 出力 |
| `outputs/phase-11/logs/design-tokens.log` | V-6 出力 |
| `outputs/phase-11/logs/playwright-smoke.log` | V-7 出力 |
| `outputs/phase-11/logs/axe.json` | V-9 axe-core violations（0 を確認） |
| `outputs/phase-11/logs/grep-inv13.log` | V-10 不変条件 #13 gate |
| `outputs/phase-11/logs/grep-tag-queue.txt` | Phase 1 で取得した topology 再現用 grep |

### metadata

| file | 内容 |
| --- | --- |
| `outputs/phase-11/phase11-capture-metadata.json` | `{ taskId, capturedAt, viewport, screenshots: [{ name, tc, status }] }` |
| `outputs/phase-11/manual-test-result.md` | 手動確認サマリー（5 シナリオ x PASS/FAIL）と環境情報 |
| `outputs/phase-11/screenshot-plan.json` | `{ mode: "VISUAL", screens: [...] }` |

## 取得手順

1. `PLAYWRIGHT_TASK18_SMOKE=1 pnpm --filter @ubm-hyogo/web dev:webpack` で起動
2. local fixture: `apps/web/src/lib/admin/server-fetch.ts#task18TagQueueFixture` が queued / dlq row を返す
3. `PLAYWRIGHT_TASK18_SMOKE=1 PLAYWRIGHT_SCREENSHOT_DIR=../../docs/30-workflows/completed-tasks/admin-tags-queue-resolver-drawer/outputs/phase-11/screenshots pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-tags-resolve-drawer.spec.ts --project=desktop-chromium` で 5 シナリオを順に screenshot（viewport `1280x800`）
4. `axe-core` を各シナリオで `checkA11y` 実行
5. 全 log を canonical path に出力

## VISUAL 判定の固定フレーズ

`screenshot-plan.json` の `mode: "VISUAL"` を Phase 11 着手前に確認する（`jq '.mode' outputs/phase-11/screenshot-plan.json` で `"VISUAL"`）。
