# Artifact Inventory: issue-1027-member-dynamic-og-worker-split

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-1027-member-dynamic-og-worker-split/` |
| state | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| issue | #1027 OPEN 維持。Issue mutation は user-gated |
| date | 2026-05-31 |

## Implementation Targets

- `apps/og/package.json`
- `apps/og/wrangler.toml`
- `apps/og/tsconfig.json`
- `apps/og/src/index.ts`
- `apps/og/src/member-source.ts`
- `apps/og/src/render.tsx`
- `apps/og/src/__tests__/{member-source,render-smoke,router}.spec.ts`
- `apps/web/src/lib/env.ts`
- `apps/web/src/lib/seo/site-metadata.ts`
- `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts`
- `apps/web/app/(public)/members/[id]/page.tsx`
- `apps/web/app/(public)/members/[id]/page.spec.tsx`
- `apps/web/playwright/tests/public-metadata.spec.ts`
- `apps/web/wrangler.toml`
- `.github/workflows/og-cd.yml`
- `pnpm-lock.yaml`

## Evidence

- `pnpm --filter @ubm-hyogo/og typecheck`: PASS.
- `pnpm --filter @ubm-hyogo/og test`: PASS, 3 files / 10 tests.
- `pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/seo/__tests__/site-metadata.spec.ts apps/web/app/(public)/members/[id]/page.spec.tsx apps/web/__tests__/opennext-config-regression.spec.ts`: PASS, 3 files / 17 tests.
- `pnpm --filter @ubm-hyogo/og build`: PASS, Wrangler dry-run total upload 2093.87KiB / gzip 718.49KiB.
- `bash scripts/check-worker-size.sh apps/og/dist`: PASS, files=3 / gzip 717KiB / limit 3072KiB.
- `pnpm --filter @ubm-hyogo/web typecheck`: PASS.
- local Wrangler + mock API PNG capture: `outputs/phase-11/screenshots/member-og-image-named.png` and `member-og-image-default.png`, both 1200×630 PNG.

## Contracts

- `apps/web` keeps `next/og` / `ImageResponse` out of the main OpenNext Worker bundle.
- `apps/og` owns dynamic member OG generation and uses existing `GET /public/members/:memberId` through `API_SERVICE` first, then `PUBLIC_API_BASE_URL`.
- `OG_IMAGE_BASE_URL` is optional and read through `apps/web/src/lib/env.ts` public env parsing.
- Unknown member / API failure returns a default PNG response instead of breaking crawler previews.
- Each Worker keeps an independent Cloudflare Workers Free 3MiB gzip budget.

## User-Gated Boundary

Cloudflare staging/production deploy, staging runtime PNG evidence, commit, push, PR creation, and Issue #1027 mutation remain user-gated.

## Lessons Learned

- `references/lessons-learned-issue-1027-member-dynamic-og-worker-split-2026-05.md` (L-I1027-001..006): user decision before architecture branch, Worker-per-bundle size budgets, OG base URL accessor discipline, service-binding-first OG data fetch, fallback PNG resilience, and same-wave skill promotion.
