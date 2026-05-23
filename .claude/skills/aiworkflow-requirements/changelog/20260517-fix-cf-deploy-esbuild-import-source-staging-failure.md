# 2026-05-17 fix-cf-deploy-esbuild-import-source-staging-failure

`docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` を
`implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
として同期した。

- `package.json` の `pnpm.overrides.esbuild` を `0.25.4` から `0.27.3` へ更新。
- `mise exec -- pnpm install --force` で `pnpm-lock.yaml` を再生成し、`pnpm why esbuild` で単一 `esbuild@0.27.3` を確認。
- `scripts/cf.sh` のコメントを wrangler + OpenNext 双方の esbuild convergence へ更新。
- Phase 1-13 outputs、Phase 12 strict 7、`outputs/artifacts.json` mirror を追加。
- stale な `completed-tasks/fix-wrangler-esbuild-import-source-error/` 参照を、実在する今回 root へ retarget。
- commit / push / PR / GitHub Actions deploy-staging evidence は user-gated のため未実行。
