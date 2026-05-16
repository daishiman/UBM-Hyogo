# Phase 06: Lint / Format / Typecheck

[実装区分: 実装仕様書]

## 目的

Phase 05 で作成した `type-contracts.spec.ts` が typecheck / lint を pass することを確認する。本 phase は AC-2 の真の gate（`@ts-expect-error` の整合検査）を担う。

## 入力

- `packages/shared/src/__tests__/type-contracts.spec.ts`
- リポジトリ root `tsconfig.json` / `packages/shared/tsconfig.json`
- `eslint.config.*` / `package.json` lint script

## 手順

| # | コマンド | 期待結果 |
| --- | --- | --- |
| 1 | `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` | exit 0。`Unused @ts-expect-error directive` 0 件。 |
| 2 | `mise exec -- pnpm typecheck` | exit 0。リポジトリ全体で型エラー 0。 |
| 3 | `mise exec -- pnpm lint` | exit 0。ESLint warning / error 0。 |
| 4 | `mise exec -- pnpm format --check`（存在する場合） | exit 0。Prettier diff 0。 |

## 真の gate（AC-2 検証）

`@ts-expect-error` は対象行に「実際に型エラー」が無い場合 tsc 自身が `Unused @ts-expect-error directive` を出して fail する。本 phase の手順 #1 が AC-2 の compile-time gate そのものとなる。

## 出力

- `outputs/phase-06/typecheck.log`（手順 1, 2 の出力）
- `outputs/phase-06/lint.log`（手順 3 の出力）

## 完了条件 (DoD)

- [ ] 手順 1..3 全て exit 0。
- [ ] `Unused @ts-expect-error directive` が 0 件。
- [ ] lint warning 0。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `@ts-expect-error` 行に実際は型エラーが出ず Unused 扱い | AC-2 の不完全 literal を見直し、必須 field を追加せず欠落のままにする |
| ESLint の `@typescript-eslint/no-unused-vars` で `_vm` が引っかかる | 接頭辞 `_` で対象外、または `void _vm;` で参照を発生させる（Phase 05 骨格で対応済） |
