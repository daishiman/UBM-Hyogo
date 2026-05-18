# Phase 07 Test Plan

追加検証:

- `VisibilityRequestDialog.component.spec.tsx`: `["refresh", "onSubmitted", "onClose"]`
- `DeleteRequestDialog.component.spec.tsx`: `["refresh", "onSubmitted", "onClose"]`
- `VisibilityRequestDialog.component.spec.tsx`: duplicate pending `["refresh", "onSubmitted"]`
- `DeleteRequestDialog.component.spec.tsx`: duplicate pending `["refresh", "onSubmitted"]`
- `RequestActionPanel.component.spec.tsx`: parent 側 `router.refresh` 非発火

実行済みコマンド:

```bash
pnpm --filter @ubm-hyogo/web test -- --run apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx
```

Focused result: 3 files / 25 tests passed.

Full web suite was also run earlier by the package script expansion and passed with 614 tests / 1 skipped.
