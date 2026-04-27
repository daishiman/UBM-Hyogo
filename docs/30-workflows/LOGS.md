# 30 Workflows Log

## Latest Updates

| Date | Task | Status | Summary |
| --- | --- | --- | --- |
| 2026-04-27 | UT-12 / Cloudflare R2 storage | spec_created | Defined the R2 storage setup package under `docs/30-workflows/ut-12-cloudflare-r2-storage/`, including prod/staging bucket names, `R2_BUCKET` binding, dedicated R2 token policy, CORS policy, NON_VISUAL Phase 11 evidence, and Phase 12 handoff documents. |

## UT-12 Details

- Bucket names: `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging`
- Workers binding: `R2_BUCKET`
- Adopted decisions: environment-separated buckets, dedicated R2 token, private bucket with presigned URL access
- Upstream references: `01b-parallel-cloudflare-base-bootstrap`, `04-serial-cicd-secrets-and-environment-sync`
- Related handoffs: UT-16 for production `AllowedOrigins`, UT-17 for R2 usage alerting, future file upload implementation for actual bucket creation and API logic
- Main artifact root: `docs/30-workflows/ut-12-cloudflare-r2-storage/`
