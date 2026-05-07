# Phase 7: AC マトリクス — 実行結果

| AC | 検証手段 | 状態 |
|----|---------|------|
| `pnpm verify:static-manifest` 健全時 PASS / drift 時 FAIL | `verify-static-manifest.log` evidence | PASS |
| `pnpm regenerate:static-manifest` 決定論性 | `regenerate-determinism.log` evidence | PASS |
| `sourceSpecHash` / `sourceSpecVersion` 追加 | manifest 確認 | PASS |
| diagnostics 構造化ログ | `builder.diagnostics.test.ts` (DT-08〜DT-10/DT-18) | PASS |
| alias-queue contract test 3+ ケース | DT-11〜DT-14 (4 ケース) | PASS |
| metadata.test.ts hash drift | DT-15 | PASS |
| CI gate 追加 | `.github/workflows/ci.yml` 確認 | PASS |
| retirement 条件正本反映 | `01-api-schema.md` 確認 | PASS |
| typecheck / lint / api test all PASS | local 実行 | PASS |
| 不変条件 #1 / #5 違反なし | コード review | PASS |
