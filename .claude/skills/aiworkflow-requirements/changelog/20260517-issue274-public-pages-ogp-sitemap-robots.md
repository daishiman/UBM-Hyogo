# 2026-05-17 issue-274 public pages OGP / sitemap / robots

Registered `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/` as `implemented_local_evidence_captured / implementation / VISUAL`.

This canonical root consumes the former 06a and task-11 public SEO follow-ups, fixes executable contract drift, and implements the local app targets:
- sitemap uses paginated `/public/members?limit=100&page=N` because the current parser clamps limit to 100
- public member list items use top-level `memberId` / `fullName`
- Playwright target path is `apps/web/playwright/tests/public-metadata.spec.ts`
- package filter is `@ubm-hyogo/web`
- site URL host aligns with `apps/web/wrangler.toml` `AUTH_URL`
- Phase 11 evidence captures typecheck/lint/test/build/curl/Playwright PASS and `og-image.png`
- PR wording uses `Refs #274`

Commit, push, PR, deployed production verification, and Issue mutation remain user-gated.

Lessons captured at `references/lessons-learned-issue-274-public-pages-ogp-sitemap-robots-2026-05.md` (L-274-001..006: site URL SSOT via `SITE_URL_MAP` keyed by `ENVIRONMENT`; sitemap degraded-mode fallback on `/public/members` failure; `robots.ts` env-branch via `getPublicEnv()`; OG image route `runtime = "edge"` contract; consumed-trace policy for source unassigned 2 件; `issue-NNN` namespace を legacy-ordinal-family-register の表行追加対象外として再確認).
