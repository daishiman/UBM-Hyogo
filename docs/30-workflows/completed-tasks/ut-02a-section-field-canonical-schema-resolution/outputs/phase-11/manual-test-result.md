# Manual Test Result

実装後の自動 evidence ベース手動 smoke 結果。

| 観測軸 | 観測手段 | 結果 |
| --- | --- | --- |
| section 重複なし (AC-3) | `builder.test.ts > place each field in exactly one section` | PASS |
| consent 誤判定なし (AC-4) | `metadata.test.ts > resolves consent stable_keys to consent kind` / `does not misclassify text/select` / `builder.test.ts > resolves consent kind` | PASS |
| label 露出なし (AC-5) | `metadata.test.ts > resolves canonical labels and never returns the stable_key itself` / `builder.test.ts > does not leak stable_key as label` | PASS |
| drift 検知 (AC-6) | `metadata.test.ts > returns Result.err with unknownStableKey` / `builder.test.ts > isolates unknown stable_keys into __unknown__ section` | PASS |
| generated baseline (AC-7) | `metadata.test.ts > supports alias adapter hook` / `works without alias adapter` | PASS |

| 補助チェック | コマンド | 結果 |
| --- | --- | --- |
| 単体テスト全体 | `mise exec -- pnpm --filter @ubm-hyogo/api test` | 498 / 498 passed |
| 型整合 | `mise exec -- pnpm typecheck` | 全パッケージ Done |
| Lint | `mise exec -- pnpm lint` | 全パッケージ Done |
