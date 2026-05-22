# Phase 13 PR Readiness Checklist: task-13-login-rebuild

## Status

PR creation is user-gated. Branch creation, commit, push, and `gh pr create` were not executed.

## Scope Check

| Check | Status |
| --- | --- |
| `apps/web/app/login/**` implementation diff present | done |
| `apps/web/src/lib/url/login-query.ts` state/error contract updated | done |
| `apps/web/playwright/tests/login-smoke.spec.ts` local smoke + screenshot capture present | done |
| Phase 11 screenshot paths documented | done |
| Phase 11 local screenshots captured | done |
| Phase 12 strict 7 outputs present | done |
| root/output `artifacts.json` parity | done |
| aiworkflow-requirements sync | done |
| local verification commands | done |

## Required Verification Before PR

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
pnpm --filter @ubm-hyogo/web verify-design-tokens
pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/url/login-query.test.ts apps/web/app/login/_components/MagicLinkForm.test.tsx apps/web/app/login/_components/__tests__/LoginCard.test.tsx apps/web/app/login/_components/__tests__/LoginPanel.test.tsx apps/web/src/lib/auth/magic-link-client.test.ts
PLAYWRIGHT_EVIDENCE_TASK=task-13-login-rebuild pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/login-smoke.spec.ts --project=desktop-chromium
```

## Screenshot References

- `outputs/phase-11/login-input.png`
- `outputs/phase-11/login-sent.png`
- `outputs/phase-11/login-unregistered.png`
- `outputs/phase-11/login-deleted.png`
- `outputs/phase-11/login-error.png`
- `outputs/phase-11/login-rules-declined.png`
- `outputs/phase-11/login-gate-admin.png`

## PR Body Skeleton

```markdown
## Summary
- Rebuild `/login` as a card UI for 5 core states plus `rules_declined`.
- Keep Auth.js and Magic Link API routes unchanged.
- Preserve URL query as the single source of login UI state.

## Verification
- pnpm --filter @ubm-hyogo/web typecheck
- pnpm --filter @ubm-hyogo/web lint
- pnpm --filter @ubm-hyogo/web verify-design-tokens
- focused Vitest for login query, MagicLinkForm, LoginCard, LoginPanel, magic-link client
- Playwright login smoke with local screenshots
```
