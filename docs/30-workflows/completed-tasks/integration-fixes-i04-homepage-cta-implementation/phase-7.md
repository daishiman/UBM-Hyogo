# Phase 7: カバレッジ確認

## カバレッジ対象範囲（限定）

| Path | 目標 | 理由 |
|------|------|------|
| `apps/web/src/components/public/CallToActionCTA.tsx` | line 100% / branch 100% | 単一 component。default props 含めて全 branch を component spec で網羅 |
| `apps/web/src/lib/constants/form.ts` | line 100% | 単一 export の定数。`form.spec.ts` で網羅 |

> 他ファイル（HomePage, legacy-public.css 等）は本タスクのカバレッジ対象外（FB BEFORE-QUIT-002 に従い局所指定）。

## 実行コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run \
  --coverage \
  --coverage.include='src/components/public/CallToActionCTA.tsx' \
  --coverage.include='src/lib/constants/form.ts' \
  apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  apps/web/src/lib/constants/__tests__/form.spec.ts
```

## 完了条件

- [ ] `CallToActionCTA.tsx`: line 100% / branch 100%
- [ ] `form.ts`: line 100%
- [x] targeted component / constants tests で対象分岐を確認し、結果を `outputs/phase-7/coverage-check.md` に記録

## 成果物

`outputs/phase-7/coverage-check.md`
