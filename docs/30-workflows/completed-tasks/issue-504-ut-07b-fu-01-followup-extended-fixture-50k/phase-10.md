# Phase 10: 単体テスト実装（vitest / bats / shellcheck）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-10/phase-10.md` |
| 変更対象 | `scripts/schema-alias-backfill/__tests__/generate-50k-fixture.test.ts`（新規）, `scripts/schema-alias-backfill/__tests__/seed-staging-50k.bats`（新規）, `scripts/schema-alias-backfill/__tests__/run-stress-trial.bats`（新規） |

## 目的
Phase 4 で設計したテストケース TC-GEN-01〜04 / TC-SEED-01〜04 を実装し、CI gate で検証可能にする。

## 実行タスク
1. vitest テスト実装（`generate-50k-fixture.test.ts`）:
   ```ts
   import { generateRow, generateAll } from "../generate-50k-fixture";
   describe("generateRow", () => {
     it("TC-GEN-01: deterministic", () => {
       expect(generateRow(0)).toEqual(generateRow(0));
     });
     it("TC-GEN-02: dedupe_key uniqueness over 50000 rows", () => {
       const rows = generateAll(50000);
       const keys = new Set(rows.map(r => r.dedupe_key));
       expect(keys.size).toBe(50000);
       expect(rows.every(r => r.dedupe_key.startsWith("ubm-test-fixture-50k-"))).toBe(true);
     });
     it("TC-GEN-03: synthetic data only", () => {
       const rows = generateAll(50000);
       const text = JSON.stringify(rows);
       expect(text).not.toMatch(/@gmail|@senpai-lab|token|secret/i);
     });
     it("TC-GEN-04: SQL chunk size", () => {
       const chunks = toSqlInsertChunks(generateAll(1500), 500);
       expect(chunks.length).toBe(3);
     });
   });
   ```
2. bats テスト実装（production abort, dry-run など）。
3. CI gate コマンド SSOT 化:
   ```bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm -w exec vitest run scripts/schema-alias-backfill
   shellcheck scripts/schema-alias-backfill/*.sh
   bats scripts/schema-alias-backfill/__tests__/*.bats
   ```

## ローカル実行・検証コマンド
上記 CI gate コマンドをすべて手動実行し PASS することを確認。

## 統合テスト連携
Phase 11 runtime evidence 取得の前提条件。本 Phase が PASS しないと Phase 11 に進まない。

## 参照資料
- `outputs/phase-4/test-cases.md`

## 成果物
- `scripts/schema-alias-backfill/__tests__/generate-50k-fixture.test.ts`
- `scripts/schema-alias-backfill/__tests__/seed-staging-50k.bats`
- `scripts/schema-alias-backfill/__tests__/run-stress-trial.bats`
- `outputs/phase-10/phase-10.md`

## 完了条件 (DoD)
- vitest / bats / shellcheck がすべて PASS
- fixture dedupe_key prefix test が PASS し、count / cleanup selector と矛盾しない
- `pnpm typecheck` / `pnpm lint` clean
- bats が利用不能な環境では `run-all.sh` fallback で PASS（issue-348 の前例に準拠）
