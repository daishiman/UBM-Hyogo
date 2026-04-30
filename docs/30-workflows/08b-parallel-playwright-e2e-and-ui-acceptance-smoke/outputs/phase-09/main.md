# Phase 9: 品質保証

> 目的: 無料枠 / secret hygiene / 型安全 / a11y / browser×viewport matrix / flaky 対策 / artifact 規約 を最終確定する。

## 1. 無料枠 / CI 分

| 項目 | 単位 | 1 PR | 月想定 (50 PR) | 上限 (free) | 判定 |
| --- | --- | --- | --- | --- | --- |
| GitHub Actions ubuntu-latest 実行時間 | 分 | **目標 ≤ 10 分** | 500 分 | 2,000 分 | OK |
| Playwright HTML report artifact | MB | 5 | 250 MB | 500 MB | OK |
| screenshot evidence (desktop+mobile=44 枚) | MB | 4 | 200 MB | 同上 | OK |
| trace (retain-on-failure のみ) | MB | 0〜2 | 0〜100 MB | 同上 | failure 時のみ |
| **artifact 保持期間** | 日 | — | — | — | **30 日**（actions/upload-artifact `retention-days: 30`） |

CI 実行プラン（10 分目標の内訳）:

| ステージ | 想定時間 |
| --- | --- |
| checkout + pnpm install (cache hit) | 1 分 |
| build (Next.js + Workers) | 2 分 |
| Playwright browsers 取得 (cache hit) | 0.5 分 |
| local Workers + D1 seed | 0.5 分 |
| spec 実行 chromium (desktop+mobile) | 3 分 |
| spec 実行 webkit (desktop+mobile) | 2 分 |
| artifact upload | 1 分 |
| **合計** | **約 10 分** |

## 2. secret hygiene

| 項目 | 規約 | 確認方法 |
| --- | --- | --- |
| `PLAYWRIGHT_BASE_URL` | env のみ（`http://localhost:3000` 既定） | playwright.config.ts で `process.env.PLAYWRIGHT_BASE_URL` を参照 |
| auth cookie | fixture で生成（実値ハードコード**禁止**） | `apps/web/tests/fixtures/auth.ts` の `signSession(role, dummyKey)` |
| Auth.js 署名鍵 | local placeholder のみ | test fixture 内 dummy key、commit しない |
| 新規 secret | **なし** | `secrets_introduced=[]` |
| `.env` 平文 | リポジトリにコミットしない | 1Password 参照 + `scripts/cf.sh` |
| screenshot に PII | seed fixture は `tanaka@example.com` 等のダミー固定 | seed.ts でハードコード値を確認 |
| trace network header | redact | `use.trace = 'on-first-retry'`、header を含めない |
| axe-report.json | `nodes` を `target` のみに redact | runAxe wrapper で transform |

CI に必要な secrets: **なし**（local Workers + local D1 + dummy session で完結）。

## 3. a11y assertion

| 観点 | 設定 |
| --- | --- |
| ライブラリ | `@axe-core/playwright` |
| rule set | wcag2a + wcag2aa + wcag21a + wcag21aa |
| FAIL 条件 | `impact` が `critical` または `serious` の violation が **0 件** |
| color-contrast 例外 | **admin scope (`/admin/*`) では除外可**（`runAxe(page, { excludeColorContrast: true })`、UI 完成度より機能優先） |
| 公開導線 / login / profile | color-contrast を含む全 rule で 0 件必須 |
| 集約 report | `outputs/phase-11/evidence/axe-report.json`（target のみ保持、PII redact） |

## 4. browser × viewport matrix

| browser | viewport | 用途 | retries (CI) | retries (local) |
| --- | --- | --- | --- | --- |
| chromium | desktop 1280x800 | メインカバレッジ | 2 | 0 |
| chromium | mobile 390x844 (iPhone 13) | レスポンシブ | 2 | 0 |
| webkit | desktop 1280x800 | Safari 互換 | 2 | 0 |
| webkit | mobile 390x844 | iOS 互換 | 2 | 0 |
| firefox | — | scope out（無料枠優先、09b 後検討） | — | — |

## 5. flaky 対策

| 対策 | 設定 |
| --- | --- |
| retries | CI: `2` / local: `0`（playwright.config.ts で `process.env.CI ? 2 : 0`） |
| video | `'retain-on-failure'`（再試行後も失敗した場合のみ保持） |
| trace | `'on-first-retry'`（初回 retry でのみ取得し artifact 容量抑制） |
| screenshot | `'only-on-failure'`（成功時は取得しない、evidence は明示 `snap()` で取得） |
| timeout | test=30s / expect=5s / webServer=60s |
| webServer | `reuseExistingServer: !process.env.CI`（local 開発の高速化） |

## 6. Playwright report artifact 規約

| artifact | パス | 保持 |
| --- | --- | --- |
| HTML report | `playwright-report/` | 30 日 |
| evidence screenshot | `outputs/phase-11/evidence/{desktop,mobile}/` | 30 日 |
| axe report | `outputs/phase-11/evidence/axe-report.json` | 30 日 |
| trace (failure 時) | `test-results/**/trace.zip` | 30 日 |
| video (failure 時) | `test-results/**/video.webm` | 30 日 |

upload 例:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report-${{ github.run_id }}
    path: |
      apps/web/playwright-report/
      docs/30-workflows/08b-.../outputs/phase-11/evidence/
    retention-days: 30
```

## 7. 型安全 / eslint

| 観点 | 状態 |
| --- | --- |
| Playwright fixture の型 narrow | `test.extend<{ adminPage: Page }>` で型固定 |
| page-object getter return | `Locator` 型固定 |
| `snap` の name 引数 | `\`${'desktop'\|'mobile'}/${string}\`` template literal 型 |
| `runAxe` return | `axe.Result['violations']` のサブセット |
| `viewports` | `as const` |
| eslint rule（Phase 8 で配置） | `no-restricted-imports`（#5）/ `no-restricted-syntax`（#8 #9） |

## 8. 不変条件への参照

- **#4** profile 編集 form 不在 assertion を `ProfilePage.assertNoEditFormVisible()` で全 spec 担保
- **#8** localStorage を正本にしない eslint rule + `BasePage.reloadAndClearStorage()` 後の state 維持 test
- **#9** `/no-access` literal を eslint で禁止 + 404 verify を二重防御
- **#15** attendance 二重防御を a11y / fixture 両面で担保

## 9. 実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web exec playwright test
mise exec -- pnpm --filter @ubm/web exec playwright test --ui          # local debug
mise exec -- pnpm --filter @ubm/web exec playwright show-report
mise exec -- pnpm --filter @ubm/web exec playwright test --grep '@a11y'
```

## 10. 完了条件チェック

- [x] CI 10 分目標 / artifact 30 日保持の規約明記
- [x] secret hygiene（`PLAYWRIGHT_BASE_URL` のみ env、cookie は fixture 生成）
- [x] a11y rule（WCAG 2.1 AA、admin で color-contrast 除外可）
- [x] flaky 対策（retries CI=2 / local=0、video on retry）
- [x] artifact upload 規約
- [x] 不変条件 #4 / #8 / #9 / #15 を test または rule で覆う
