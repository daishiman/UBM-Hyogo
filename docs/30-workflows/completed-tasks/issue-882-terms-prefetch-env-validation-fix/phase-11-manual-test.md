# Phase 11 — 手動テスト / runtime evidence

| 項目 | 値 |
| --- | --- |
| 状態 | completed |
| 判定 | NON_VISUAL runtime smoke（UI 差分なし） |
| 実施日 | 2026-05-25 |

## 手順

1. `mise exec -- pnpm --filter @ubm-hyogo/web build` で OpenNext Workers build を作成。
2. `bash scripts/cf.sh dev --config apps/web/wrangler.toml` で local Workers ランタイム起動（または `pnpm --filter @ubm-hyogo/web dev` で next dev）。
3. Browser DevTools を JavaScript 有効状態で開き、`http://localhost:3000/` にアクセス。
4. Console / Network を観察:
   - Console: `/terms` env validation 由来の error 0 件。
   - Network: `/terms?_rsc=...` prefetch が 200。
5. `/` 上で `<Link href="/terms">` を hover し、prefetch が成功することを再確認。
6. SPA navigation で `/terms` に遷移し、hydration が成功することを確認。

## 取得 evidence

| 種別 | path |
| --- | --- |
| manual test result | `outputs/phase-11/manual-test-result.md` |
| Playwright results | `outputs/phase-11/evidence/playwright-report/results.json` |
| Monocart report | `outputs/phase-11/evidence/monocart/index.html` |

## 完了条件

- manual-test-result.md が `outputs/phase-11/` に配置。
- Console / Network エラー 0 件を manual-test-result.md に記録。
- `PLAYWRIGHT_BASE_URL=http://localhost:3100 ... terms-prefetch.spec.ts --project=desktop-chromium` が PASS。
