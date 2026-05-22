# Phase 8: Refactor check

No application refactor was needed.

Rejected refactors:

- adding fallback logic to `apps/web/src/lib/env.ts`
- catching zod errors in SEO metadata code
- parsing `wrangler.toml` dynamically in workflow shell

The smallest correct change is step-scoped CI env injection plus a regression test.

