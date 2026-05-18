# Test Output Summary

Command:

```bash
pnpm --filter @ubm-hyogo/web test -- --run apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx
```

Result:

```text
Test Files  3 passed (3)
Tests       25 passed (25)
Exit code   0
```

Additional evidence: an earlier package-script run expanded to the full web Vitest suite and also passed with 614 tests / 1 skipped.

Regression coverage added in review:

- `VisibilityRequestDialog` duplicate pending: `["refresh", "onSubmitted"]`
- `DeleteRequestDialog` duplicate pending: `["refresh", "onSubmitted"]`
