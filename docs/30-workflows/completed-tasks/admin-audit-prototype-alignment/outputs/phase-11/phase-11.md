# Phase 11: 手動テスト / Evidence

> workflow: admin-audit-prototype-alignment

## Evidence 境界

| Evidence | 状態 |
|----------|------|
| local component / contract tests | 取得済み |
| staging `/admin/audit?limit=50` 200 | user-gated |
| authenticated local admin audit visual | 取得済み（desktop 1280） |
| authenticated admin-staging-visual desktop/tablet/mobile | user-gated |
| curl / wrangler tail root-cause evidence | redacted status / path / worker arrival / deploy timestamp のみ保存 |

secret、cookie、response body、個人情報、token hash は保存しない。

## Local Visual Evidence

| 状態 | スクリーンショット |
|------|------------------|
| default table | `screenshots/admin-audit-default.png` |
| filtered table | `screenshots/admin-audit-filtered.png` |
| empty state | `screenshots/admin-audit-empty.png` |

実行コマンド:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 \
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-audit-prototype-alignment/outputs/phase-11 \
PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 \
mise exec -- pnpm --filter web exec playwright test \
  apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts \
  -g "audit states" --project=desktop-chromium
```

結果: 1 test passed。既存 capture helper の固定出力先から、本 workflow の `outputs/phase-11/screenshots/` へ同一実行で生成された audit 画像を配置した。
