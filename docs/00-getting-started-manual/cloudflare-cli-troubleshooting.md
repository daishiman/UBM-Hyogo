# Cloudflare CLI Troubleshooting

## OpenNext esbuild host/binary mismatch

Symptom:

```text
Cannot start service: Host version "0.25.4" does not match binary version "0.21.5"
```

Recovery:

1. Check the OpenNext host esbuild version from `node_modules/@opennextjs/aws/node_modules/esbuild/package.json`.
2. Align root `package.json` `pnpm.overrides.esbuild` to that host version.
3. Run `mise exec -- pnpm install`.
4. Verify with `mise exec -- pnpm why esbuild`.
5. Verify the standard Cloudflare build path with `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`.

Do not bypass `scripts/cf.sh` for Cloudflare CLI operations. The wrapper remains the canonical route for Wrangler commands.

