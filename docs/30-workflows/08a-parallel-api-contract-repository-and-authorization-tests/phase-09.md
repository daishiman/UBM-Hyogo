# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

型安全 / lint / test / coverage / 無料枠 (CI 分) / secret hygiene の観点で本タスク仕様の最終チェックを行う。a11y は本タスク UI なしのため 08b 担当。

## 実行タスク

- [ ] 無料枠（GitHub Actions 分、Cloudflare 連携なし）
- [ ] secret hygiene（msw / fixture に secret 含めない）
- [ ] 型安全（brand 型 factory / @ts-expect-error）
- [ ] lint rule の eslint config 提案

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 無料枠 |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | secret 管理 |
| 必須 | CLAUDE.md | 不変条件 / secret 平文禁止 |

## 無料枠見積（CI 分）

| 項目 | 単位 | 1 PR | 想定 / 月 | 上限 (free tier GitHub Actions) | 余裕 |
| --- | --- | --- | --- | --- | --- |
| GitHub Actions ubuntu-latest | min | 5 | 50 PR/月 × 5 = 250 | 2,000 min / 月 | 充分 |
| coverage upload artifact | MB | 2 | 100 MB/月 | 500 MB | 充分 |
| Cloudflare 課金 | — | — | 0 | — | テストは local sqlite |
| msw / 外部 API call | — | 0 | 0 | — | 外部 API 呼ばない |

## secret hygiene チェック

| 項目 | 状態 | 確認方法 |
| --- | --- | --- |
| 新規 secret | なし | secrets_introduced=[] |
| `.env` 平文 | 行わない | git status |
| msw handler に secret | 含めない | grep `(token\|secret\|key)` mocks/ → 0 件 |
| fixture に admin password / secret | 含めない | fixtures/admin-users.ts は id のみ |
| CI workflow yml に secret hardcode | なし | ${{ secrets.* }} 経由のみ |
| coverage report に user data | redact | jq で個人情報フィールドを除外して upload |

### CI secrets

本タスクで CI に必要な secrets:
- なし（in-memory sqlite、msw 内蔵 fixture で完結）

## 型安全チェック

| 観点 | 確認 | 結果 |
| --- | --- | --- |
| brand 型 factory `MemberId('m-1')` | 正常 | TBD |
| `@ts-expect-error` で responseId → memberId 代入が compile fail | 正常 | TBD |
| `@ts-expect-error` で `responseEmail` を fields enum に含める試みが fail | 正常 | TBD |
| zod schema parse の return 型が view model 型と一致 | tsd で確認 | TBD |
| msw handler の response 型が contract test の expected と一致 | TBD |

## eslint rule 提案

```js
// .eslintrc additions (proposal)
module.exports = {
  rules: {
    // 不変条件 #6: apps/web から D1 直接 import 禁止
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@cloudflare/d1', 'drizzle-orm/d1', '../api/repository/*'],
          message: 'apps/web は D1 / repository に直接アクセスしない (#6)' },
      ],
    }],
    // 不変条件 #11: profile 編集 endpoint 命名禁止
    'no-restricted-syntax': ['error', {
      selector: 'Literal[value=/^\\/admin\\/members\\/.*\\/profile/]',
      message: 'profile 編集 endpoint は不変条件 #11 で禁止',
    }],
  },
}
```

## a11y / UI

- 本タスクは API test 中心で UI なし
- a11y は 08b の Playwright snapshot で担保

## lint / test / coverage 実行ガイド

```bash
pnpm typecheck                                   # brand 型違反検知
pnpm lint                                        # apps/web → D1 禁止、profile 編集禁止
pnpm --filter @ubm-hyogo/api test                      # vitest 全 suite
pnpm --filter @ubm-hyogo/api test -- --coverage        # coverage ≥ 85% / 80%
pnpm --filter @ubm/shared test                   # type test
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 6 観点を GO/NO-GO 材料 |
| Phase 11 | local 実行 evidence + coverage report |
| Phase 12 | implementation-guide に lint / coverage 設定反映 |

## 多角的チェック観点

- 不変条件 **#1**: msw handler が `extraFields` を含む応答を持つ
- 不変条件 **#2**: brand 型 / zod enum で `responseEmail` を fields に入れない
- 不変条件 **#5**: authz matrix を coverage に必ず含める
- 不変条件 **#6**: lint test + eslint rule 二重防御
- 不変条件 **#7**: deleted_members 関連 test を必ず実行
- 不変条件 **#11**: profile 編集禁止を eslint で恒久固定

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積 | 9 | pending | CI 分 |
| 2 | secret hygiene | 9 | pending | msw / fixture |
| 3 | 型安全 | 9 | pending | brand / @ts-expect-error |
| 4 | eslint rule 提案 | 9 | pending | #6 / #11 |
| 5 | lint / test / coverage コマンド | 9 | pending | 5 コマンド |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果 |
| メタ | artifacts.json | phase 9 status |

## 完了条件

- [ ] 無料枠見積 / secret hygiene / 型安全 / eslint 提案すべて記述
- [ ] lint / test / coverage コマンド明記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 9 を completed

## 次 Phase

- 次: Phase 10 (最終レビュー)
- 引き継ぎ: 6 観点 PASS 状況
- ブロック条件: いずれかの観点が NO-GO 候補なら Phase 10 で blocker
