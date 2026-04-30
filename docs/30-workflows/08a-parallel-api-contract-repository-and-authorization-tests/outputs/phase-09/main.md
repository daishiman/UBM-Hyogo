# Phase 9 成果物 — 品質保証 (08a)

## 1. 目的

無料枠 (CI 分) / secret hygiene / 型安全 / lint rule / a11y / coverage の 6 観点で本タスク仕様の最終チェックを行う。a11y は本 task UI なしのため 08b 担当（記述のみ）。

## 2. 無料枠見積 (CI 分)

| 項目 | 単位 | 1 PR | 想定 / 月 (50 PR) | 上限 (free GitHub Actions) | 余裕 |
| --- | --- | --- | --- | --- | --- |
| GitHub Actions ubuntu-latest | min | 5 (vitest + coverage) | 250 min | 2,000 min / 月 | 充分 |
| coverage upload artifact | MB | 2 | 100 MB | 500 MB | 充分 |
| Cloudflare 利用 | — | 0 | 0 | — | テストは local sqlite + msw、Cloudflare 課金なし |
| 外部 API call | — | 0 | 0 | — | msw が intercept、外部呼び出しなし |
| concurrency cancel-in-progress | — | — | — | — | 並列 PR で重複実行を回避（runbook Step 7） |

→ 無料枠超過リスク **無し**。

## 3. secret hygiene チェック

| 項目 | 状態 | 確認方法 |
| --- | --- | --- |
| 新規 secret 導入 | なし | artifacts.json `secrets_introduced=[]` |
| `.env` 平文 | 行わない | git status / .gitignore |
| msw handler に secret | 含めない | `grep -rE "(token\|secret\|key)" apps/api/test/mocks/` 0 件 |
| fixture に admin password / API key | 含めない | adminUsers fixture は id のみ、認証は `signSession` で生成 |
| CI workflow yml に secret hardcode | なし | `${{ secrets.* }}` 経由のみ。本 workflow は secret 不要 |
| coverage report の個人情報 | redact 必須 | jq で個人情報フィールドを除外して upload（Step 7 参考） |
| `TEST_AUTH_SECRET` | test 専用 dummy（32 byte hex） | vitest setup で固定値、本番 secret と無関係 |

### CI で必要な secrets

本タスクで CI に必要な secrets: **なし**（in-memory sqlite + msw 内蔵 fixture で完結）。

## 4. 型安全チェック

| 観点 | 確認方法 | 結果 |
| --- | --- | --- |
| brand 型 factory `MemberId('m-1')` | runtime + tsc | 想定 PASS |
| `@ts-expect-error` で `ResponseId` → `MemberId` 代入が compile fail | `pnpm --filter @ubm-hyogo/shared test`（vitest typecheck or test 内型） | 想定 PASS（削除すると tsc が pass して test fail） |
| `@ts-expect-error` で `responseEmail` を fields enum に含める試みが fail | 同上 | 想定 PASS |
| zod schema parse の return 型が view model 型と一致 | `z.infer<typeof Schema>` を view model 型と `expectTypeOf` で比較 | 想定 PASS |
| msw handler の response 型が contract test の expected と一致 | TypeScript 経路で連結 | 想定 PASS |

## 5. eslint rule 提案

```js
// .eslintrc additions（Phase 12 implementation-guide で配置）
module.exports = {
  rules: {
    // 不変条件 #6: apps/web から D1 / repository 直 import 禁止
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@cloudflare/d1', 'drizzle-orm/d1', '**/api/src/repository/*'],
          message: 'apps/web は D1 / repository に直接アクセスしない (#6)' },
      ],
    }],
    // 不変条件 #11: profile 編集 endpoint 命名禁止
    'no-restricted-syntax': ['error', {
      selector: "Literal[value=/^\\/(me|admin\\/members\\/[^/]+)\\/profile$/][value!=/profile-edit-not-found/]",
      message: 'profile 編集 endpoint は不変条件 #11 で禁止',
    }],
    // 不変条件 #2: form fields enum に responseEmail を含めない
    // → 型レベルで `@ts-expect-error` を test に置く方針なので eslint 重複ガード不要
    'vitest/expect-expect': 'error', // it() に必ず assertion
  },
}
```

## 6. a11y / UI

- 本タスクは API test 中心、UI なし
- a11y は **08b の責務**（Playwright + axe-core で snapshot）
- 本 Phase では a11y test は実装しない（記述のみ）

## 7. lint / test / coverage 実行ガイド

```bash
mise exec -- pnpm typecheck                          # repo 全体型チェック
mise exec -- pnpm lint                               # eslint（apps/web→D1 禁止 / profile 編集禁止）
mise exec -- pnpm --filter @ubm-hyogo/api test       # vitest 全 suite
mise exec -- pnpm --filter @ubm-hyogo/api test --coverage   # coverage ≥ 85% / 80%
mise exec -- pnpm --filter @ubm-hyogo/shared test    # type test (brand)
```

## 8. 不変条件 × 品質保証 観点

| 不変条件 | 観点 | 二重防御 |
| --- | --- | --- |
| #1 | msw handler が `extraFields` 含む応答を持つ | contract test + msw fixture |
| #2 | brand 型 / zod enum で `responseEmail` を fields に入れない | type test + zod schema |
| #5 | authz spec 9 マトリクスを coverage に必ず含める | authz suite + coverage threshold |
| #6 | lint test + eslint rule | 二重防御 |
| #7 | deleted_members 関連 test を必ず実行 | contract + repo unit |
| #11 | profile 編集禁止を eslint で恒久固定 | contract 404 + eslint rule |

## 9. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 6 観点を GO/NO-GO 材料 |
| Phase 11 | local 実行 evidence + coverage report |
| Phase 12 | implementation-guide に lint / coverage 設定反映 |

## 10. 多角的チェック観点

- 不変条件 6 件すべてに二重防御を構築（§8）
- secret 新規導入なし → CI / staging / production 全環境で再現可能
- 無料枠 25% 未満の使用率（CI 5 min / 月 250 min ÷ 2,000 min = 12.5%）
- a11y は 08b へ明示移譲

## 11. 完了条件チェック

- [x] 無料枠見積（§2）
- [x] secret hygiene（§3）
- [x] 型安全（§4）
- [x] eslint rule 提案（§5）
- [x] lint / test / coverage コマンド明記（§7）

## 12. 次 Phase への引き継ぎ

- 6 観点 PASS 想定で Phase 10 GO 判定材料に
- secret 新規なしのため Cloudflare / GitHub secrets への追加は不要
