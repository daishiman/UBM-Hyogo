# Link Checklist: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装 / NON_VISUAL evidence]

| Link target | Status |
| --- | --- |
| docs/00-getting-started-manual/specs/02-auth.md | exists |
| docs/00-getting-started-manual/specs/13-mvp-auth.md | exists |
| docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/index.md | exists |
| docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/phase-01.md - phase-13.md | exists |
| outputs/phase-09/main.md - outputs/phase-13/main.md | exists |
| outputs/phase-11/manual-smoke-log.md | exists |
| outputs/phase-12 strict 7 files | exists |
| apps/web/src/lib/auth.test.ts | exists |
| apps/web/src/lib/fetch/public.test.ts | exists |
| apps/web/src/test-utils/fetch-mock.test.ts | exists |

## 確認手段

- `find docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage -maxdepth 4 -type f`
- `pnpm --filter @ubm-hyogo/web test:coverage`
