# Phase 7 — Coverage

[実装区分: 実装仕様書]

## 7.1 既存 threshold 維持

| package | 既存 threshold | 維持確認 |
|---------|----------------|----------|
| `apps/api` | lines 70% / branches 70% | 維持 |
| `apps/web` | 既存値を維持 | 維持 |
| `packages/shared` | 既存値を維持 | 維持 |

## 7.2 追加カバレッジ範囲

| ファイル | 期待 coverage |
|----------|---------------|
| `apps/api/src/routes/admin/_shared/byZone.ts` | line / branch 100% (pure fn のため達成可能) |
| `apps/api/src/routes/admin/dashboard.ts` | 既存 + `byZone` path を T-B-01 で網羅 |
| `apps/web/src/lib/admin/admin-dashboard-ui.ts` | 既存 + `parseZoneSlices` 分岐 (新 shape / 旧 shape / undefined) を T-B-03 で網羅 |
| `apps/web/src/lib/admin/server-fetch.ts` | T-B-04 で URL 組み立て分岐網羅 |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | T-B-05 で 401/404 分岐網羅 |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | T-B-06 で main / placeholder 両分岐網羅 |
| `packages/shared/src/zod/viewmodel.ts` | T-B-02 で `byZone` あり / なし双方分岐網羅 |

## 7.3 runtime 環境確認

Phase 5 着手前に下記を 1 回実行し、esbuild / arch / worktree isolation の問題を排除する:

```bash
mise exec -- pnpm verify:vitest-runtime
```

詳細復旧手順: `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`

## 7.4 計測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --coverage
```

`pnpm coverage:guard` (pre-push) は通常 push で自動実行される。本 task の変更範囲では新規ファイルが全て test 付きで追加されるため、coverage drop は発生しない想定。
