# workflow-vite-5-to-7-major-upgrade Artifact Inventory

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/vite-5-to-7-major-upgrade/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_mode=new` |
| source issue | #1201 CLOSED（reopen / mutation は user-gated） |
| purpose | Vite を 5.4.21 から 7.x へ引き上げ、Vitest toolchain と lockfile を単一 Vite 7 解決へ移行する |
| implementation | root `package.json` に `vite ^7.0.0` を直接 devDependency 追加、`pnpm-lock.yaml` を `vite@7.3.5` 単一解決へ再生成 |
| invariant | apps runtime source / public API / D1 schema / Google Form / UI unchanged。`@vitejs/plugin-react@4.7.0`、`vitest@3.2.6`、`@vitest/coverage-v8@3.2.6` は据え置き |
| evidence | `pnpm why vite` single `vite@7.3.5`; deprecation grep 0; `pnpm -r typecheck` PASS; `pnpm lint` PASS; `pnpm build` PASS; focused vitest reruns PASS after broad resource flakes |
| environment blocker | 初回 `pnpm verify:vitest-runtime` は `process.arch=x64, expected arm64` で FAIL したが、`mise exec -- pnpm install --force` により worktree-local esbuild optional binary を復旧し PASS へ転換。残る broad shard timeout は focused rerun で source-level regression ではないと分離 |
| user gate | commit, push, PR, Issue mutation |

## Artifact files

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/vite-5-to-7-major-upgrade/artifacts.json` | root gate metadata |
| `docs/30-workflows/vite-5-to-7-major-upgrade/outputs/artifacts.json` | mirror gate metadata |
| `docs/30-workflows/vite-5-to-7-major-upgrade/outputs/phase-11/manual-test-result.md` | NON_VISUAL evidence summary |
| `docs/30-workflows/vite-5-to-7-major-upgrade/outputs/phase-11/canonical-paths.json` | Phase 11 canonical evidence manifest |
| `docs/30-workflows/vite-5-to-7-major-upgrade/outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` | canonical Phase 11 command evidence |
| `docs/30-workflows/vite-5-to-7-major-upgrade/outputs/phase-11/{typecheck-local,lint-local,vitest-shard-results,deprecation-grep,version-parity}.txt` | companion Phase 11 command evidence |
| `docs/30-workflows/vite-5-to-7-major-upgrade/outputs/phase-12/phase12-task-spec-compliance-check.md` | strict 7 close-out and four-condition verdict |

## Lessons Learned

- **L-VITE7-001 (direct dependency beats override)**: direct `devDependencies.vite` is the elegant fix when no prior specifier exists. `pnpm.overrides.vite` would weaken peer validation and hide ownership.
- **L-VITE7-002 (NON_VISUAL evidence is command evidence)**: dependency-only toolchain changes should not create screenshots. Version parity, deprecation grep, typecheck/lint/build, and focused shard reruns are the evidence set.
- **L-VITE7-003 (broad shard resource flakes need focused rerun separation)**: D1 setup timeout and UI loading flakes under heavy broad runs must be recorded as environment/resource observations, not Vite regression, once focused reruns pass.
- **L-VITE7-004 (spec_created drift is invalid when implementation target is physical)**: when `package.json` / lockfile targets are explicit and locally editable, Phase 12 must promote the workflow to `implemented_local_evidence_captured` in the same wave.
