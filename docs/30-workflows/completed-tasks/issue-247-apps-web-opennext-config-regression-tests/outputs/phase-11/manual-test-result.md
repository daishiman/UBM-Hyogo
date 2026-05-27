# Phase 11 — manual test result

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## status

PASS — OpenNext config regression guard の focused Vitest を実行し、baseline が green であることを確認した。drift inject は実ファイルを汚さない方針に変更し、構造 assertion（TOML section / package scripts / `.assetsignore` required lines）で同じ不変条件を fail-fast に固定した。

## 実施項目

| step | 期待結果 |
|------|---------|
| baseline | `apps/web/__tests__/opennext-config-regression.spec.ts` 4 tests pass |
| AC1 | `pages_build_output_dir` 不在 + `main = ".open-next/worker.js"` + `compatibility_flags = ["nodejs_compat"]` |
| AC2 | `[assets]` / `[env.staging.assets]` / `[env.production.assets]` の directory / binding / SPA fallback |
| AC3 | `apps/web/package.json` に `deploy` / `deploy:staging` / `deploy:production` script が無い |
| AC4 | `.assetsignore` に `node_modules`, `.DS_Store`, `.git`, `*.map`, `*.test.*`, `*.spec.*`, `__tests__` が揃う |

## command

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
```

Result: 1 file passed, 4 tests passed.
