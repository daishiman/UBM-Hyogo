# Phase 1 Dependency Map

## Current Fact

`wrangler@4.85.0` resolves through the root `pnpm.overrides.esbuild` value. Before this cycle the override forced `esbuild@0.25.4`, which cannot parse the `supported.import-source` feature used by current wrangler bundling.

## Evidence

| Check | Result |
| --- | --- |
| root `package.json#pnpm.overrides.esbuild` | updated to `0.27.3` |
| `pnpm exec esbuild --version` | `0.27.3` |
| `pnpm why esbuild` | one resolved version: `esbuild@0.27.3` |

## 4 Conditions

| Condition | Verdict |
| --- | --- |
| 矛盾なし | PASS: root override and installed esbuild agree on `0.27.3`. |
| 漏れなし | PASS: wrangler, vite, vitest, tsx resolution paths are covered by `pnpm why esbuild`. |
| 整合性あり | PASS: `0.27.3` is the single implementation value. |
| 依存関係整合 | PASS: transitive esbuild resolution converges to one version. |
