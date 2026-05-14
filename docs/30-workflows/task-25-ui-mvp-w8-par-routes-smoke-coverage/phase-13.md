# Phase 13: PR 作成（ユーザー明示承認後のみ）

## 1. 状態

`blocked` — user の明示承認まで実施しない。

## 2. PR 構成

| 項目 | 値 |
|------|----|
| base ブランチ | `dev` |
| ブランチ | `feat/ui-mvp-task-25-routes-smoke-coverage` |
| タイトル候補 | `docs(ui-mvp): add 19 routes Playwright smoke coverage matrix (task-25)` |
| 主要差分 | `docs/30-workflows/task-25-.../` 一式 + `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## 3. PR 本文骨子

```
## Summary
- task-18 で実装した CI gate（playwright-smoke / verify-design-tokens）が「何を守るか」を 19 routes × 5 軸の matrix で文書化
- 既存 4 visual baseline との関係を明示し、残り 15 routes を future task として整理
- docs-only / NON_VISUAL / verify_existing（apps/ への code 変更ゼロ）

## Coverage
- 19 routes × {status / DOM / token / a11y / interaction}
- 4 visual baseline: login / public-top / admin-dashboard / profile
- CI gate refs: playwright-smoke / smoke (chromium), playwright-smoke / visual (chromium, 4 screens), verify-design-tokens / verify-design-tokens

## Test plan
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] matrix の 19 行が full-smoke.spec.ts の ROUTES[] と 1:1 一致を目視確認
- [ ] visual baseline 4 件と matrix の `✓` セルが一致

## Out of scope
- 残り 15 routes の visual baseline 採取（U1 として未タスク化）
- error / loading observability standardize（U2 / U3 として未タスク化）
```

## 4. 事前チェック

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` の出力が docs-only に閉じる
- [ ] Phase 12 6 成果物すべて存在
- [ ] Phase 11 manual-test-result.md が NON_VISUAL 宣言を含む

## 5. 承認待ち

user が「PR 作成」「PR 出して」「diff-to-pr」を明示するまで `gh pr create` を実行しない。
