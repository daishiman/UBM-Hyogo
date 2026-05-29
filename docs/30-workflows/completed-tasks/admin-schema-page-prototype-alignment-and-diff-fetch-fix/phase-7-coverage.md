# Phase 7: カバレッジ

[実装区分: 実装仕様書]

## カバレッジ目標

| 対象 | line | branch | 根拠 |
|------|------|--------|------|
| `apps/web/app/(admin)/admin/schema/page.tsx` | 100% | 100% | page.spec.tsx で ok/err 両分岐 + 内部 helper 全描画パスを呼ぶ |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` (改修部分) | ≥ 既存維持 | hideInlineStats 分岐 + diff card class | SchemaDiffPanel.component.spec.tsx |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 既存維持 | label 表示 | AdminSidebar.component.spec.tsx |
| `apps/api/src/routes/admin/schema.ts` (`GET /admin/schema/diff` route handler) | 既存維持 | auth=ok / auth=fail / recommendedStableKeys | schema.contract.spec.ts |

## 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run --coverage
mise exec -- pnpm --filter @ubm-hyogo/api test --run --coverage
```

## 除外

- visual-only 変更（CSS class 追加）は line coverage 対象外。Playwright spec で UI 担保
- 既存 SchemaDiffPanel の未改修部分は本サイクル対象外

## CI gate

- `verify-design-tokens` PASS
- `verify-test-suffix` PASS（`.spec.ts/tsx` のみ）
- `verify-indexes-up-to-date` PASS
- `verify-phase12-compliance` PASS
- coverage threshold は既存 `codecov.yml` / package vitest config に従う（本タスクで threshold は変更しない）
