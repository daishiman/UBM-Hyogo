# Phase 11: 統合検証 / 手動 smoke

[実装区分: 実装仕様書]

## 目的

Phase 06..10 の結果を統合し、CI gate と等価な手動コマンド列を実行して全項目 PASS を確認する。

## 入力

- Phase 06 typecheck / lint 結果
- Phase 07 test 結果
- Phase 09 perf delta
- Phase 10 docs 更新

## 統合 smoke コマンド列

| # | コマンド | 期待 |
| --- | --- | --- |
| 1 | `mise exec -- pnpm install` | exit 0 |
| 2 | `mise exec -- pnpm typecheck` | exit 0 / `Unused @ts-expect-error directive` 0 |
| 3 | `mise exec -- pnpm lint` | exit 0 |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/shared test` | exit 0 / 新規 15 件 PASS |
| 5 | `mise exec -- pnpm test` | exit 0 / 全パッケージ regression 0 |
| 6 | `git status --porcelain packages/shared/src/branded packages/shared/src/zod packages/shared/src/schemas` | 空（runtime 無改変確認） |
| 7 | `ls packages/shared/src/__tests__/type-contracts.spec.ts` | exists |
| 8 | `grep -c '^describe' packages/shared/src/__tests__/type-contracts.spec.ts` | 5 |
| 9 | `grep -c '^\s*it(' packages/shared/src/__tests__/type-contracts.spec.ts` | 15 |
| 10 | `grep -c '@ts-expect-error' packages/shared/src/__tests__/type-contracts.spec.ts` | 2 |

## 出力

- `outputs/phase-11/main.md`（focused 実行サマリ）
- `outputs/phase-11/evidence/shared-typecheck.txt`
- `outputs/phase-11/evidence/shared-lint.txt`
- `outputs/phase-11/evidence/shared-test.txt`

## 完了条件 (DoD)

- [x] focused typecheck / test が期待値一致。
- [x] `@ubm-hyogo/shared` typecheck / test が手動でも PASS。
- [x] `__tests__/type-contracts.spec.ts` の構造（describe 5 / it 14 / @ts-expect-error 2）が grep で確認済。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| ローカル環境差異（Node version） | `mise exec --` で Node 24 を強制 |
| `__tests__` 配下が `tsconfig` の include から外れる | shared の `tsconfig.json` の include を Phase 03 で確認済（`src/**/*` で含まれる） |
