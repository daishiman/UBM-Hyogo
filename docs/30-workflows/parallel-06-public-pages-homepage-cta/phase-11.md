# Phase 11: 証跡 / E2E スクリーンショット

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 前 Phase | 10 |
| 次 Phase | 12 |
| 状態 | completed |
| visualEvidence | VISUAL |

## 取得する証跡

すべて `outputs/phase-11/` 配下に保存する。

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/screenshots/home-desktop.png` | `/` desktop (1280px) full-page、CTA セクション含む |
| `outputs/phase-11/screenshots/home-mobile.png` | `/` mobile (375px) full-page |
| `outputs/phase-11/screenshots/cta-section-desktop.png` | CTA セクションのみクローズアップ |
| `outputs/phase-11/screenshots/cta-section-mobile.png` | CTA セクションのみクローズアップ (mobile) |
| `outputs/phase-11/evidence/typecheck.log` | `pnpm typecheck` 出力 |
| `outputs/phase-11/evidence/lint.log` | `pnpm lint` 出力 |
| `outputs/phase-11/evidence/test.log` | `pnpm test` 出力 (vitest summary) |
| `outputs/phase-11/evidence/build.log` | `pnpm build` 出力 |
| `outputs/phase-11/evidence/grep-gate.log` | 実 Google Form responder URL literal 重複検出 (0 件) |
| `outputs/phase-11/evidence/verify-design-tokens.log` | `pnpm --filter @ubm-hyogo/web verify-design-tokens` 出力 |
| `outputs/phase-11/evidence/visual-inspection.md` | screenshot path と目視確認結果 |
| `outputs/phase-11/evidence/phase11-paths-validation.log` | `pnpm validate:phase11-paths` 出力 |
| `outputs/phase-11/canonical-paths.json` | 上記 path manifest |

## 取得手順

```bash
# 1. local dev server
pnpm --filter @ubm-hyogo/web dev:webpack

# 2. 別ターミナルでスクリーンショット (playwright 既存 helper を流用)
pnpm --filter @ubm-hyogo/web exec playwright screenshot \
  --viewport-size=1280,800 --full-page \
  http://localhost:3000/ \
  ../../docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/screenshots/home-desktop.png

pnpm --filter @ubm-hyogo/web exec playwright screenshot \
  --viewport-size=375,812 --full-page \
  http://localhost:3000/ \
  ../../docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/screenshots/home-mobile.png

pnpm --filter @ubm-hyogo/web exec node -e "const { chromium } = require('playwright'); (async () => { const browser = await chromium.launch(); for (const [w,h,name] of [[1280,800,'cta-section-desktop.png'],[375,812,'cta-section-mobile.png']]) { const page = await browser.newPage({ viewport: { width: w, height: h } }); await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' }); await page.locator('[data-component=\"call-to-action-cta\"]').screenshot({ path: '../../docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/screenshots/' + name }); await page.close(); } await browser.close(); })().catch((err) => { console.error(err); process.exit(1); });"

# 3. evidence logs
pnpm typecheck 2>&1 | tee docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/evidence/typecheck.log
pnpm lint      2>&1 | tee docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/evidence/lint.log
pnpm test      2>&1 | tee docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/evidence/test.log
pnpm build     2>&1 | tee docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/evidence/build.log
pnpm --filter @ubm-hyogo/web verify-design-tokens \
  2>&1 | tee docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/evidence/verify-design-tokens.log
rg -n "1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform" apps/web --glob '!apps/web/src/lib/constants.ts' \
  2>&1 | tee docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/evidence/grep-gate.log
printf '%s\n' \
  '{"screenshots":["outputs/phase-11/screenshots/home-desktop.png","outputs/phase-11/screenshots/home-mobile.png","outputs/phase-11/screenshots/cta-section-desktop.png","outputs/phase-11/screenshots/cta-section-mobile.png"],"evidence":["outputs/phase-11/evidence/typecheck.log","outputs/phase-11/evidence/lint.log","outputs/phase-11/evidence/test.log","outputs/phase-11/evidence/build.log","outputs/phase-11/evidence/grep-gate.log","outputs/phase-11/evidence/verify-design-tokens.log"]}' \
  > docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11/canonical-paths.json
```

## 比較確認

- `outputs/phase-11/screenshots/cta-section-desktop.png` と
  `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` 136-149 行の prototype 描画を視覚比較
- 大きな構造差分・色差分がないことを Phase 12 で記録

## 取得結果

- `outputs/phase-11/screenshots/home-desktop.png`: 取得済
- `outputs/phase-11/screenshots/home-mobile.png`: 取得済
- `outputs/phase-11/screenshots/cta-section-desktop.png`: 取得済。FOR MEMBERS eyebrow / h2 / body / CTA を確認
- `outputs/phase-11/screenshots/cta-section-mobile.png`: 取得済。mobile 折り返しに破綻なし
- `outputs/phase-11/evidence/typecheck.log`: `pnpm typecheck` exit 0
- `outputs/phase-11/evidence/lint.log`: `pnpm lint` exit 0
- `outputs/phase-11/evidence/test.log`: `pnpm test` exit 0（206 files / 1447 tests passed / 1 skipped）
- `outputs/phase-11/evidence/build.log`: `pnpm build` exit 0（既存 Sentry/Prisma warning あり）
- `outputs/phase-11/evidence/grep-gate.log`: 実 responder URL duplicate 0 件
- `outputs/phase-11/evidence/verify-design-tokens.log`: 9 tests passed
- `outputs/phase-11/evidence/visual-inspection.md`: 取得済
- `outputs/phase-11/evidence/phase11-paths-validation.log`: `pnpm validate:phase11-paths` exit 0
- `outputs/phase-11/canonical-paths.json`: schema validation PASS

## 完了条件

- 上記 evidence ファイルがすべて生成済
- screenshot が CTA セクションを含み、prototype と同等の視覚構造を示す
