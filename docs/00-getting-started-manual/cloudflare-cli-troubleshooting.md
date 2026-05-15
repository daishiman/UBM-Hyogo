# Cloudflare CLI Troubleshooting

## OpenNext esbuild host/binary mismatch

Symptom:

```text
Cannot start service: Host version "0.25.4" does not match binary version "0.21.5"
```

Recovery:

1. Check the active Wrangler dependency with `pnpm view wrangler@<version> dependencies.esbuild`.
2. Check the OpenNext host esbuild version from `node_modules/@opennextjs/aws/node_modules/esbuild/package.json`.
3. Align root `package.json` `pnpm.overrides.esbuild` to the Wrangler exact dependency when Wrangler deploy/dry-run is the failing path. Current SSOT for `wrangler@4.85.0` is `esbuild@0.27.3`.
4. Run `mise exec -- pnpm install`.
5. Verify with `mise exec -- pnpm why esbuild` and `mise exec -- pnpm exec esbuild --version`.
6. Verify both Cloudflare paths:
   - `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`
   - `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run`

Do not bypass `scripts/cf.sh` for Cloudflare CLI operations. The wrapper remains the canonical route for Wrangler commands.
