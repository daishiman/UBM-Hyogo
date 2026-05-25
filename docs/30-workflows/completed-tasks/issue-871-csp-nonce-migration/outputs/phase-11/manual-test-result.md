# Phase 11: 手動テスト結果（NON_VISUAL）

## 1. 検証区分

| 項目 | 値 |
|------|-----|
| visualEvidence | NON_VISUAL（CSP は HTTP response header / grep gate / focused test で検証。画面ピクセル比較は対象外） |
| 本サイクルでの evidence | local implementation evidence captured |
| canonical manifest | `outputs/phase-11/canonical-paths.json` |

## 2. 実行済み evidence

| 区分 | 取得方法 | 結果 |
|------|---------|------|
| 単体 + middleware focused test | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/security-headers.spec.ts apps/web/__tests__/middleware.spec.ts` | 2 files / 17 tests PASS |
| grep gate | `rg "'unsafe-inline'" apps/web/src apps/web/middleware.ts apps/web/__tests__/middleware.spec.ts` | 0 hit（rg exit 1） |
| Playwright HTTP smoke | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/security-headers.spec.ts --project=desktop-chromium` | 7 tests PASS |

## 3. 検証内容

focused test では、`script-src` に request ごとの nonce と `strict-dynamic` が含まれること、`style-src` / `style-src-elem` が同じ nonce を要求すること、`style-src-attr` が既存属性style互換のため明示分離されること、`script-src 'self' 'unsafe-inline'` / `style-src 'self' 'unsafe-inline'` が出ないことを確認した。middleware test では `/` への2回の疑似リクエストで nonce が異なることと、response header `x-nonce` とCSP内の nonce が一致することを確認した。

## 4. 未実行境界

staging/production response verification、19-route full-browser CSP violation-zero smoke、commit、push、PR は user-gated のまま残す。これらは Phase 13 の承認後に取得する。
