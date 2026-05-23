[実装区分: 実装仕様書]

# Phase 9 Output: 品質検証

仕様本体: `../../phase-09.md`

## local evidence（取得済み + 境界分離）

| 種別 | コマンド | evidence path |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | `outputs/phase-11/evidence/typecheck.log` |
| lint | `mise exec -- pnpm lint` | `outputs/phase-11/evidence/lint.log` |
| test | `mise exec -- pnpm test -- scripts/lint-stable-key-update.spec.ts` | `outputs/phase-11/evidence/test.log` |
| build | `mise exec -- pnpm build` / `pnpm -r build` | `outputs/phase-11/evidence/build.log`（1Password timeout） / `outputs/phase-11/evidence/build-direct.log`（PASS） |
| grep-gate | `mise exec -- node scripts/lint-stable-key-update.mjs --strict` | `outputs/phase-11/evidence/grep-gate.log` |
| coverage boundary | `bash scripts/coverage-guard.sh --no-run` | `outputs/phase-11/evidence/coverage-guard.log` |

## 手動 violation 注入

phase-09.md の手順で `--strict` が exit 1 → restore 後 exit 0 を確認。

## 状態

`completed`
