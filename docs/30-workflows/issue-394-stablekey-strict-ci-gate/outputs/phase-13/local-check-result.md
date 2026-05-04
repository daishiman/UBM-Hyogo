# local-check-result

本サイクル時点（`blocked_by_legacy_cleanup`）での local check 結果:

| コマンド | 結果 | 備考 |
| --- | --- | --- |
| `node scripts/lint-stablekey-literal.mjs --strict` | exit 1 / 148 violations | 期待される現状 blocker。`outputs/phase-11/evidence/strict-current-blocker.txt` |
| `pnpm typecheck` | 未実行（本サイクルでは実コード変更なし） | doc のみの diff のため省略 |
| `pnpm lint` | 未実行（同上） | warning mode は CI 親 workflow で担保 |

cleanup 完了 + ci.yml step 追加後の PR 時には次を全 PASS にして本ファイルを差し替える:

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm lint:stablekey:strict
mise exec -- pnpm vitest run scripts/lint-stablekey-literal.test.ts
```
