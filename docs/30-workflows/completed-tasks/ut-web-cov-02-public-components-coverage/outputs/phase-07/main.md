# outputs phase 07: ut-web-cov-02-public-components-coverage

- status: implemented-local
- purpose: AC マトリクス
- evidence: 仕様書 phase-07.md / Phase 11 coverage evidence

## AC × Component PASS/FAIL マトリクス

| AC \ Component | Hero | MemberCard | ProfileHero | StatCard | Timeline | FormPreviewSections | EmptyState |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 Stmts ≥85% | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-1 Lines ≥85% | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-1 Funcs ≥85% | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-1 Branches ≥80% | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-2 happy 1+ | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-2 empty/null 1+ | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-2 interaction/variant 1+ | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-3 snapshot 不使用 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AC-4 regression なし | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

## evidence path 対応表

| Component | テストファイル | coverage-summary key | Phase 11 evidence |
| --- | --- | --- | --- |
| Hero | apps/web/src/components/public/__tests__/Hero.test.tsx | apps/web/src/components/public/Hero.tsx | outputs/phase-11/evidence/coverage-summary.json |
| MemberCard | apps/web/src/components/public/__tests__/MemberCard.test.tsx | apps/web/src/components/public/MemberCard.tsx | outputs/phase-11/evidence/coverage-summary.json |
| ProfileHero | apps/web/src/components/public/__tests__/ProfileHero.test.tsx | apps/web/src/components/public/ProfileHero.tsx | outputs/phase-11/evidence/coverage-summary.json |
| StatCard | apps/web/src/components/public/__tests__/StatCard.test.tsx | apps/web/src/components/public/StatCard.tsx | outputs/phase-11/evidence/coverage-summary.json |
| Timeline | apps/web/src/components/public/__tests__/Timeline.test.tsx | apps/web/src/components/public/Timeline.tsx | outputs/phase-11/evidence/coverage-summary.json |
| FormPreviewSections | apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx | apps/web/src/components/public/FormPreviewSections.tsx | outputs/phase-11/evidence/coverage-summary.json |
| EmptyState | apps/web/src/components/feedback/__tests__/EmptyState.test.tsx | apps/web/src/components/feedback/EmptyState.tsx | outputs/phase-11/evidence/coverage-summary.json |

## PARTIAL → PASS 昇格条件

- coverage-summary.json の該当 key の `statements.pct / lines.pct / functions.pct ≥85`
- `branches.pct ≥80`
- 当該 test suite が `0 failed`
- workspace 全体 `pnpm -r test` が `0 failed`

## 計測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
mise exec -- pnpm -r test:coverage
bash scripts/coverage-guard.sh --changed
```

## 不変条件チェック

- #2 / #5 / #6 すべて Phase 4-6 で担保 (本 phase は集計)
