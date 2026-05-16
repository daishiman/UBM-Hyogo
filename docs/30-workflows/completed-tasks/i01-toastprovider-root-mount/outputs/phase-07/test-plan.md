# Test Plan

## Verdict

completed

| Gate | Command |
| --- | --- |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Focused unit | `pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation` |
| Build / RSC boundary | `pnpm -F "@ubm-hyogo/web" build` |
| Visual/runtime | Admin route manual smoke after user-run login session |

The focused unit path keeps the existing optional toaster DI and validates the hook behavior without adding a brittle RootLayout server component test.

