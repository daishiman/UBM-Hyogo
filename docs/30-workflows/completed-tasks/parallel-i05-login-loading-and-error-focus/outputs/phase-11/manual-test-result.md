# Phase 11 Manual Test Result

## Result

Local deterministic evidence is captured. Runtime browser screenshots remain `pending_user_approval`.

## Local Evidence

| Check | Result |
| --- | --- |
| `apps/web/app/login/loading.tsx` exists | completed |
| `apps/web/app/login/error.tsx` focus / aria-live / digest implementation | completed |
| Focused Vitest | completed: 2 files passed / 4 tests passed |
| Token grep (`#[0-9a-fA-F]`, `(bg|text)-[#`, `*.test.tsx`) | completed: 0 hits |
| `pnpm typecheck` | completed: exit 0 |
| `pnpm lint` | completed: exit 0 |
| `pnpm --filter @ubm-hyogo/web build` | completed: exit 0 with pre-existing Next/Sentry warnings |
| Runtime screenshots | pending_user_approval |

## Command

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/login/error.spec.tsx apps/web/app/login/loading.spec.tsx
```

Exit code: 0.
