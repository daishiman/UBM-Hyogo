---
実装区分: 実装仕様書
状態: spec_created
Phase: 7
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [index.md](./index.md)
前: [phase-6-test-additions.md](./phase-6-test-additions.md)
次: [phase-8-refactor.md](./phase-8-refactor.md)
---

# Phase 7: カバレッジ

## 1. 目的

Phase 5/6 で着地した spec 群について、`pnpm coverage --changed` ベースで Phase 4 §9 のカバレッジ目標を満たすことを実測する。

## 2. 実測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  apps/web/src/components/public/__tests__/Hero.spec.tsx \
  apps/web/src/components/public/__tests__/Stats.spec.tsx \
  apps/web/src/components/public/__tests__/AboutUbm.spec.tsx \
  apps/web/src/components/public/__tests__/Timeline.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/app/__tests__/page.spec.tsx
```

## 3. 目標値 (Phase 4 §9 再掲)

| 対象 | line | branch | function | statement |
| --- | --- | --- | --- | --- |
| `apps/web/src/components/public/AboutUbm.tsx` | 95% | 90% | 100% | 95% |
| `apps/web/src/components/public/Hero.tsx` (改修ブロック) | 95% | 90% | 100% | 95% |
| `apps/web/src/components/public/Stats.tsx` (改修ブロック) | 95% | 90% | 100% | 95% |
| `apps/web/src/components/public/Timeline.tsx` (改修ブロック) | 95% | 90% | 100% | 95% |
| `apps/web/app/page.tsx` (改修ブロック) | 90% | 85% | 90% | 90% |

## 4. 不足発生時の追加 TC

| 不足観点 | 追加 TC 雛形 |
| --- | --- |
| `Hero` の `variant="panel"` legacy path | TC-HERO-002 を実行 |
| `Stats` の `generatedAt=null` | mock で null を渡し "未同期" を assert |
| `Timeline` の attendees=0 | `typeof e.attendees === "number"` 真の境界 |
| `AboutUbm` の `aboutCopy` slot | TC-ABOUT-006 を実行 |

## 5. 報告

`outputs/phase-7/coverage-summary.md` (Phase 12 で `documentation-changelog.md` に転記):

```md
| file | line | branch | function | statement | target met |
| ---- | ---- | ---- | ---- | ---- | ---- |
| AboutUbm.tsx | XX% | XX% | XX% | XX% | YES/NO |
| Hero.tsx (Δ) | XX% | XX% | XX% | XX% | YES/NO |
| Stats.tsx (Δ) | XX% | XX% | XX% | XX% | YES/NO |
| Timeline.tsx (Δ) | XX% | XX% | XX% | XX% | YES/NO |
| app/page.tsx (Δ) | XX% | XX% | XX% | XX% | YES/NO |
```

## 6. DoD (Phase 7)

- [ ] 5 file 全てで目標 met
- [ ] 未達 file は §4 の追加 TC を Phase 6 へ差し戻し対応

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 7
- workflow_state: `spec_created`

## 目的

Phase 4 で定義したカバレッジ目標を Phase 6 spec で達成する。

## 完了条件

- [ ] 目標 met / 未達 の判定が file 単位で記録される
