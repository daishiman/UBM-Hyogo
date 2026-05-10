# Implementation Guide

## Part 1: 中学生レベル

テストファイルは、学校のプリントに「数学の小テスト」「英語の宿題」と名前を書くのに似ています。名前がただの「テスト」だけだと、何を確かめる紙なのか探す人が迷います。そこで、画面部品の確認、ページの確認、サーバー入口の確認などが名前から分かるようにしました。

今回したことは、中身を書き換えることではありません。70 個のファイルの名前を、何の確認か分かる名前にそろえました。あわせて、古い名前を直接見ていた設定も新しい名前に直しました。

| 用語 | やさしい言い換え |
| --- | --- |
| rename | 名前の付け替え |
| suffix | 名前の最後につける目印 |
| component | 画面の部品 |
| route | 入口の係 |
| runtime | 動く場所の確認 |
| lint | 書き方の点検 |

## Part 2: 技術者レベル

`outputs/phase-11/rename-mapping.csv` を SSOT とし、70 files を `git mv` で suffix-classified names に移行した。

Classification:

| class | count | suffix |
| --- | ---: | --- |
| component | 36 | `*.component.spec.tsx` |
| route | 4 | `*.route.spec.ts` |
| page | 1 | `*.page.spec.ts` |
| runtime | 5 | `*.runtime.spec.ts` |
| lib-unit | 24 | `*.spec.ts` |

Synchronized direct references:

- `apps/web/package.json`: `verify-design-tokens` now targets `apps/web/src/__tests__/tokens.runtime.spec.ts`
- `.github/workflows/ci.yml`: build label now references `build-output.runtime.spec.ts`
- `apps/web/src/__tests__/static-invariants.runtime.spec.ts`: self-test exclusion updated
- `scripts/lint-boundaries.mjs` / `scripts/lint-stablekey-literal.mjs`: test exclusions accept `.spec`

Validation:

- `mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose`
- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm --filter @ubm-hyogo/web run verify-design-tokens`

Visual evidence: NON_VISUAL のためスクリーンショットは不要。
