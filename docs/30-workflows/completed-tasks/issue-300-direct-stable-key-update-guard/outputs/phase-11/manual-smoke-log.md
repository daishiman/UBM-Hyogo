[実装区分: 実装仕様書]

# Phase 11 manual smoke log

## 主証跡

- vitest 14 ケース PASS（`scripts/lint-stable-key-update.spec.ts`）
- guard script: `[stable-key-update-lint] OK (mode=error, scanned=476 files)`

## screenshot を作らない理由

NON_VISUAL（CI gate / static analysis のみ。UI なし）

## 実行記録テンプレ

| # | コマンド | 期待 | 実測 | PASS/FAIL |
| --- | --- | --- | --- | --- |
| 1 | `mise exec -- pnpm typecheck` | exit 0 | `outputs/phase-11/evidence/typecheck.log` | completed |
| 2 | `mise exec -- pnpm lint` | exit 0（lint-stable-key-update --strict 含む） | `outputs/phase-11/evidence/lint.log` | completed |
| 3 | `mise exec -- pnpm exec vitest run scripts/lint-stable-key-update.spec.ts` | 14/14 PASS | `outputs/phase-11/evidence/test.log` | completed |
| 4 | `mise exec -- pnpm build` | environment boundary recorded | `outputs/phase-11/evidence/build.log` = 1Password authorization timeout; `outputs/phase-11/evidence/build-direct.log` = wrapper-free `pnpm -r build` PASS | boundary_synced |
| 5 | `mise exec -- node scripts/lint-stable-key-update.mjs --strict` | exit 0 / `[stable-key-update-lint] OK` | `outputs/phase-11/evidence/grep-gate.log` | completed |
| 6 | `bash scripts/coverage-guard.sh --no-run` | coverage boundary recorded | `outputs/phase-11/evidence/coverage-guard.log` | boundary_synced |
| 7 | fixture violation → `--strict` 実行 | exit 1 + schema_aliases 誘導文 | `test.log` focused cases | completed |

## 実行日時 / 実行者

2026-05-15 / Codex（branch: `feat/issue-300-direct-stable-key-update-guard`）
