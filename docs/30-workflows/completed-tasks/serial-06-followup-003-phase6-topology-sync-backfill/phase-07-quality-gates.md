# Phase 7 — Quality Gates

| Gate | 実行 | 期待結果 | スキップ条件 |
|------|------|---------|------------|
| `mise exec -- pnpm typecheck` | docs-only PR でも必須 | exit 0 | なし |
| `mise exec -- pnpm lint` | docs-only PR でも必須 | exit 0 | なし |
| `bash scripts/verify-pr-ready.sh` | docs-only PR でも必須 | exit 0（`gate-metadata:validate` + `verify:phase12-compliance` + `indexes:rebuild` drift 0 を一括） | なし |
| `mise exec -- pnpm verify:phase12-compliance` | Phase 12 compliance check ファイル必須生成 | canonical 9 headings drift 0 | なし |
| `mise exec -- pnpm gate-metadata:validate` | artifacts.json zod schema 検証 | 違反 0 | なし |
| `mise exec -- pnpm indexes:rebuild` | skill indexes drift 検出 | rebuild 後 `git diff --exit-code` で drift 0 | なし |
| pre-push hook (lefthook) | push 前に自動実行 | block 0 | なし |

## 不変条件

- coverage gate は `apps/` / `packages/` 配下のコード差分が 0 のため発火しない（pre-push `coverage-guard` の `--changed` モード）
- visual gate / Playwright smoke は本 PR では発火しない
- design tokens gate は本 PR では発火しない

## 実行前提

ローカル検証は repo 標準の `mise exec -- pnpm ...` 形式に統一する。`bash scripts/verify-pr-ready.sh` は内部で必要な pnpm scripts を呼び出すため例外としてそのまま実行する。
