# Phase 5: fixture 生成スクリプト実装（`generate-50k-fixture.ts`）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-5/phase-5.md` |
| 変更対象 | `scripts/schema-alias-backfill/generate-50k-fixture.ts`（新規） |

## 目的
Phase 2-3 で確定した型 / I/F に従い、純関数 `generateRow(index)` と CLI entry point を TypeScript で実装する。

## 実行タスク
1. ファイル新規作成: `scripts/schema-alias-backfill/generate-50k-fixture.ts`
2. 関数シグネチャ:
   - `export function generateRow(index: number): Fixture50kRow`
   - `export function generateAll(count: number): Fixture50kRow[]`
   - `export function toSqlInsertChunks(rows: Fixture50kRow[], chunkSize: number): string[]`
3. CLI entry point: `if (import.meta.main)` または `process.argv[1]` 検出で引数 parse、`--count` / `--output` / `--format` を実装。
4. dedupe_key は `crypto.subtle` ではなく Node 標準 `node:crypto` の `createHash('sha256')` を使用（Workers ではなく Node script）。
5. 出力先 file write は `node:fs/promises` の `writeFile`。stdout 出力時は `process.stdout.write`。

## ローカル実行・検証コマンド
```bash
mise exec -- pnpm tsx scripts/schema-alias-backfill/generate-50k-fixture.ts --count 100 --format sql
mise exec -- pnpm tsx scripts/schema-alias-backfill/generate-50k-fixture.ts --count 50000 --format sql --output /tmp/fixture-50k.sql
wc -l /tmp/fixture-50k.sql  # chunk 単位の INSERT 行数を確認
```

## 統合テスト連携
Phase 4 で設計した TC-GEN-01〜04 を満たす。

## 参照資料
- `outputs/phase-2/fixture-row-schema.md`
- `outputs/phase-3/cli-spec.md`

## 成果物
- `scripts/schema-alias-backfill/generate-50k-fixture.ts`
- `outputs/phase-5/phase-5.md`

## 完了条件 (DoD)
- `pnpm typecheck` clean
- `pnpm tsx scripts/schema-alias-backfill/generate-50k-fixture.ts --count 50000 --format sql` が deterministic に同一 SHA256 ハッシュの output を生成（再実行で diff ゼロ）
- TC-GEN-01〜04 が PASS（Phase 10 で確認）
- `node:fs` / `node:crypto` 以外の外部依存追加なし
