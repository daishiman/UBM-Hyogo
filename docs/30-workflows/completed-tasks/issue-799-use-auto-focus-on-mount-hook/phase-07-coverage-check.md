# Phase 07 — テスト方針 / カバレッジ

## カバレッジ目標

| 対象 | 目標 |
| --- | --- |
| `useAutoFocusOnMount.ts` (hook) | line 100% / branch 100%（ref null 分岐含む） |
| 各 `error.tsx` | 既存閾値維持。focus assertion 追加で line coverage 微増 |

## 観点ごとのテスト

| 観点 | テスト場所 |
| --- | --- |
| mount 時 focus 呼出回数 = 1 | hook spec C-1 |
| `{ preventScroll: true }` 引数 | hook spec C-1 + 4 boundary spec |
| ref null 時 noop | hook spec C-2 |
| 再 render で focus 再呼出なし | hook spec C-3 |
| boundary 描画後の AT 認識 (role=alert + aria-live) | 各 boundary spec（既存 assertion 維持） |

## 非対象

- jsdom が再現できない実 focus stack（実機 visual confirm は Phase 11 で manual evidence として補完）
- E2E (playwright) — error boundary は意図的な throw が必要で E2E では誘発困難。component spec で代替

## 既存 spec への影響

- `apps/web/app/__tests__/error.component.spec.tsx` の `focus({ preventScroll: true })` assertion は hook 経由でも同様に発火するため AC 不変
- coverage guard (`scripts/coverage-guard.sh`) で `--changed` モード時の差分 coverage が threshold を下回らないことを確認

## 検証コマンド

```bash
mise exec -- pnpm --filter @ubm/web vitest run --coverage \
  src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx
```
