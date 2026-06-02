# Phase 12 Main — issue-1027-member-dynamic-og-worker-split

## Summary

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`
- architecture: OG 専用 Worker 分離（Free plan 維持）

## Implemented Files

- `apps/og/**`: Hono + `workers-og` OG PNG Worker, member API fetch layer, fallback PNG path, unit tests, wrangler config.
- `apps/web/src/lib/env.ts`: `OG_IMAGE_BASE_URL` optional public env.
- `apps/web/src/lib/seo/site-metadata.ts`: `buildMemberOgImageUrl()`.
- `apps/web/app/(public)/members/[id]/page.tsx`: member detail metadata uses OG Worker URL and `summary_large_image`.
- `apps/web/wrangler.toml`: environment-specific OG Worker origins.
- `.github/workflows/og-cd.yml`: build, size gate, deploy workflow for the OG Worker.

## Evidence

- `pnpm --filter @ubm-hyogo/og typecheck`: PASS.
- `pnpm --filter @ubm-hyogo/og test`: PASS, 3 files / 10 tests.
- `pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/seo/__tests__/site-metadata.spec.ts apps/web/app/(public)/members/[id]/page.spec.tsx apps/web/__tests__/opennext-config-regression.spec.ts`: PASS, 3 files / 17 tests.
- `pnpm --filter @ubm-hyogo/og build`: PASS, Wrangler dry-run total upload 2093.87KiB / gzip 718.49KiB.
- `bash scripts/check-worker-size.sh apps/og/dist`: PASS, files=3 / gzip 717KiB / limit 3072KiB.
- `pnpm --filter @ubm-hyogo/web typecheck`: PASS.
- local Wrangler + mock API PNG capture: `outputs/phase-11/screenshots/member-og-image-named.png` and `member-og-image-default.png`, both 1200×630 PNG.

## User-Gated Boundary

Cloudflare deploy, staging runtime PNG capture, commit, push, PR creation, and Issue #1027 state mutation remain user-gated.
