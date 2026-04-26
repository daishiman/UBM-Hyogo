# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

型安全 / lint / test / a11y (axe-core) / browser matrix (chromium + webkit) / viewport matrix (desktop + mobile) / CI 無料枠 / secret hygiene の観点で本タスク仕様の最終チェックを行う。Playwright 特有の観点として、screenshot evidence のサイズ上限、playwright HTML report の artifact 化、external nav (Google Form) を mock せず観測のみとする方針も最終確認する。

## 実行タスク

- [ ] 無料枠（GitHub Actions 分 + artifact ストレージ）
- [ ] secret hygiene（fixture / cookie / localStorage / screenshot に PII / secret 含めない）
- [ ] 型安全（Playwright fixture の型 / page object の return 型）
- [ ] eslint rule 提案（不変条件 #4 / #5 / #8 / #9 を E2E でも担保）
- [ ] axe-core / browser matrix / viewport matrix の最終確認
- [ ] CI 実行時間と artifact サイズの上限策定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 / Workers 無料枠 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | secret 管理 / CI |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | a11y |
| 必須 | CLAUDE.md | 不変条件 / secret 平文禁止 |
| 必須 | outputs/phase-05/main.md | runbook と CI yml placeholder |
| 必須 | outputs/phase-08/main.md | DRY 化後の helper / fixture 配置 |

## 無料枠見積（CI 分 + artifact）

| 項目 | 単位 | 1 PR | 想定 / 月 | 上限 (free tier) | 余裕 |
| --- | --- | --- | --- | --- | --- |
| GitHub Actions ubuntu-latest | min | 8 | 50 PR/月 × 8 = 400 | 2,000 min / 月 | 充分 |
| Playwright HTML report artifact | MB | 5 | 250 MB / 月 | 500 MB / 月 | 充分 |
| screenshot evidence (desktop+mobile=36 枚) | MB | 4 | 200 MB / 月 | 同上 | 残量管理要 |
| trace (retain-on-failure のみ) | MB | 0〜2 | 0〜100 MB | 同上 | failure 時のみ |
| Cloudflare 課金 | — | — | 0 | — | local Workers / D1 完結、staging は 09a |
| Google Form viewform 実遷移 | — | 0 | 0 | — | 観測のみで提出はしない |

## secret hygiene チェック

| 項目 | 状態 | 確認方法 |
| --- | --- | --- |
| 新規 secret | なし | secrets_introduced=[] |
| `.env` 平文 | 行わない | git status / `.gitignore` |
| Auth.js session 署名鍵 | local 専用 placeholder | `signSession` は test fixture の dummy key |
| screenshot に email / 個人名 | 含めない | seed fixture は `tanaka@example.com` 等のダミー固定 |
| screenshot に admin token | 含めない | cookie は HTTPOnly、画面表示なし |
| trace ファイルに network header | redact | `use.trace` で `screenshot: 'only-on-failure'` のみ、header は記録しない設定 |
| CI workflow yml に secret hardcode | なし | ${{ secrets.* }} 経由のみ（本タスクは secrets 不要） |
| axe-report.json に PII | redact | `node` text を最小化、URL のみ記録 |

### CI secrets

本タスクで CI に必要な secrets:
- なし（local Workers + local D1 + dummy session で完結）

## 型安全チェック

| 観点 | 確認 | 結果 |
| --- | --- | --- |
| Playwright fixture `adminPage` / `memberPage` の型 | `Page` 型に narrow | TBD |
| page object の getter return 型 | `Locator` 型 | TBD |
| `snap(page, name)` の name 引数 string literal | `'desktop/...' \| 'mobile/...'` の template literal 型化検討 | TBD |
| `runAxe(page)` return 型 | `axe.Result['violations']` のサブセット | TBD |
| `viewports.desktop` / `viewports.mobile` の const assertion | `as const` 型 | TBD |
| `@ts-expect-error` で member fixture から admin page を開く操作が compile fail | 設計上 fixture 分離 | TBD |

## eslint rule 提案

```js
// .eslintrc additions (proposal)
module.exports = {
  overrides: [
    {
      files: ['apps/web/tests/**/*.ts'],
      rules: {
        // 不変条件 #5: apps/web (E2E test 含む) から D1 直接 import 禁止
        'no-restricted-imports': ['error', {
          patterns: [
            { group: ['@cloudflare/d1', 'drizzle-orm/d1', '../../api/repository/*'],
              message: 'apps/web E2E は D1 / repository に直接アクセスせず HTTP で叩く (#5)' },
          ],
        }],
        // 不変条件 #8: localStorage を route / session / data の正本にしない
        'no-restricted-syntax': ['error',
          {
            selector: "MemberExpression[object.name='localStorage'][property.name=/^(setItem|getItem)$/]",
            message: '正本データの localStorage 利用は不変条件 #8 違反、セッションは cookie / D1 で持つ',
          },
          {
            // 不変条件 #9: `/no-access` への遷移を期待する code を禁止
            selector: "Literal[value='/no-access'][parent.type!='AwaitExpression']",
            message: '/no-access は仕様上不在、AuthGateState で出し分け (#9)',
          },
        ],
      },
    },
  ],
}
```

## a11y / browser / viewport matrix 最終確認

| 観点 | 設定 | 担保 |
| --- | --- | --- |
| browser | chromium + webkit | playwright.config の `projects` |
| viewport | desktop=1280x800 / mobile=iPhone 13 (390x844) | `projects` use.viewport |
| a11y rule | wcag2a + wcag2aa + wcag21a + wcag21aa | helpers/axe.ts |
| violation impact filter | critical + serious のみ FAIL | helpers/axe.ts |
| axe report 集約 | `outputs/phase-11/evidence/axe-report.json` | runAxe wrapper で append |
| firefox | scope out（無料枠優先） | 09b release 後に追加検討 |

## lint / test / a11y 実行ガイド

```bash
pnpm typecheck                                         # Playwright fixture / page object 型
pnpm lint                                              # apps/web/tests/** 用 eslint rule
pnpm --filter @ubm/web exec playwright test            # 全 spec 実行
pnpm --filter @ubm/web exec playwright test --ui       # local debug
pnpm --filter @ubm/web exec playwright show-report     # HTML report
pnpm --filter @ubm/web exec playwright test --reporter=line --grep '@a11y'  # a11y のみ
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 7 観点を GO/NO-GO 材料 |
| Phase 11 | local 実行 evidence + axe report + screenshot |
| Phase 12 | implementation-guide に lint / axe / browser / viewport 設定反映 |
| 上流 08a | eslint rule の overrides 部分を共有 (#5 / #11) |

## 多角的チェック観点

- 不変条件 **#4**: profile 画面に編集 form がない E2E の continued 担保
- 不変条件 **#5**: apps/web E2E test から D1 直接 import を eslint で禁止
- 不変条件 **#8**: localStorage を正本にしない eslint rule + reload 後 state 維持 test
- 不変条件 **#9**: `/no-access` literal の eslint 禁止 + 404 verify を二重防御
- 不変条件 **#15**: attendance UI の二重防御を a11y / fixture 両面で担保
- 無料枠: CI 8 min / artifact 10 MB 以内目安
- secret hygiene: screenshot / trace / axe-report に PII / token を残さない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積 | 9 | pending | CI 分 + artifact |
| 2 | secret hygiene | 9 | pending | fixture / screenshot / trace |
| 3 | 型安全 | 9 | pending | fixture / page object 型 |
| 4 | eslint rule 提案 | 9 | pending | #5 / #8 / #9 |
| 5 | a11y / browser / viewport matrix | 9 | pending | axe / chromium+webkit / 2 viewport |
| 6 | lint / test / a11y コマンド | 9 | pending | 6 コマンド |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果 |
| メタ | artifacts.json | phase 9 status |

## 完了条件

- [ ] 無料枠見積 / secret hygiene / 型安全 / eslint 提案 / a11y matrix すべて記述
- [ ] lint / test / a11y コマンド明記
- [ ] 不変条件 #4 / #5 / #8 / #9 / #15 が test または rule で覆われている

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 9 を completed

## 次 Phase

- 次: Phase 10 (最終レビュー)
- 引き継ぎ: 7 観点 PASS 状況 + eslint rule 提案 + browser/viewport 最終 matrix
- ブロック条件: いずれかの観点が NO-GO 候補なら Phase 10 で blocker
