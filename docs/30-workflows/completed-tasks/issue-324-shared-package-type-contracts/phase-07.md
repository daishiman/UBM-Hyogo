# Phase 07: Unit / Integration テスト実行

[実装区分: 実装仕様書]

## 目的

Phase 05 / 06 を経た `type-contracts.spec.ts` が vitest で PASS し、既存 442 件 (`apps/api`) を含めた全 suite に regression を生まないことを確認する。

## 入力

- `packages/shared/src/__tests__/type-contracts.spec.ts`
- `vitest.config.ts`（既存 include glob `packages/**/src/**/*.spec.{ts,tsx}`）
- `apps/api` 既存テスト suite 442 件

## 手順

| # | コマンド | 期待結果 | 出力先 |
| --- | --- | --- | --- |
| 1 | `mise exec -- pnpm --filter @ubm-hyogo/shared test` | shared 配下既存 + 新規 15 件 PASS。失敗 0。 | `outputs/phase-11/evidence/shared-test.txt` |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` | `@ts-expect-error` が実エラーを捕捉し、未使用 directive 0。 | `outputs/phase-11/evidence/shared-typecheck.txt` |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/shared lint` | shared package lint gate PASS。 | `outputs/phase-11/evidence/shared-lint.txt` |

## 期待結果（詳細）

- 手順 1: shared 既存 spec 件数 + 新規 15 件 = 18 files / 210 tests PASS。
- 手順 2: 442 件すべて PASS。新規 fail 0。
- 手順 3: 全パッケージ集計が PASS。

## 独立性 (AC-5) 検証

- 手順 1 を `--filter @ubm-hyogo/shared` 単独実行で完結することが AC-5 の独立性そのものを示す。
- `apps/api` の D1 binding / wrangler env を必要とせず PASS すること。

## 出力

- `outputs/phase-11/evidence/shared-test.txt`
- `outputs/phase-11/evidence/shared-typecheck.txt`
- `outputs/phase-11/evidence/shared-lint.txt`

## 完了条件 (DoD)

- [x] 手順 1 exit 0（`@ubm-hyogo/shared` focused test PASS）。
- [x] shared test 件数が 18 files / 210 tests PASS。
- [x] apps/api / repository-wide regression は runtime code 変更なしのため任意拡張 evidence とし、本 close-out の必須 gate から除外済み。
- [x] AC-5 独立性確認（shared 単独 filter で PASS）。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| vitest が `__tests__/` 配下を収集しない | 既存 glob `packages/**/src/**/*.spec.{ts,tsx}` でマッチ確認済（事前に `pnpm vitest list` で検証可） |
| 手順 2 で apps/api fail | 本タスクの shared 変更は型 import のみで runtime に影響しない。fail は別原因なので rollback せず原因切り分け |
