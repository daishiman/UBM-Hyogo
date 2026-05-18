# Phase 7 — カバレッジ確認

`[実装区分: 実装仕様書]`

## 1. 対象範囲 (FB-BEFORE-QUIT-002 対応)

| Target | 計測コマンド | 目標 |
|--------|-------------|------|
| `scripts/measure-coverage-exclude-ratio.ts` | `pnpm vitest run --coverage scripts/__tests__/measure-coverage-exclude-ratio.spec.ts` | line 100% / branch >= 90% |
| `apps/web/app/loading.tsx` (除外解除後) | `pnpm --filter @ubm-hyogo/web test -- app/__tests__/error.component.spec.tsx` | existing component regression GREEN |
| `apps/web/app/not-found.tsx` (除外解除後) | 同上 | line >= 80% |
| 全体 80% gate (既存) | `pnpm -r test:coverage` | 既存閾値維持 (regression なし) |

## 2. exclude 比率 baseline 実測

```bash
mise exec -- pnpm tsx scripts/measure-coverage-exclude-ratio.ts \
  --out docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-7/coverage-exclude-ratio.md
```

出力先: `outputs/phase-7/coverage-exclude-ratio.{md,json}`、`outputs/phase-7/coverage-report.md` にサマリ。

## 3. DoD

- [ ] 新規スクリプトの line coverage 100%
- [ ] exclude 比率 baseline JSON が `outputs/phase-7/` に保存される
- [ ] baseline ratio が 30% 未満であれば Phase 12 implementation-guide に "OK" 記録、超過なら fallback runbook 適用記録
