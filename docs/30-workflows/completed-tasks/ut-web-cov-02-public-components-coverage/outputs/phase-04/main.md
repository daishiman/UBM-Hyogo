# outputs phase 04: ut-web-cov-02-public-components-coverage

- status: implemented-local
- purpose: テスト戦略
- evidence: 仕様書 phase-04.md (実測 evidence は Phase 11 で capture)

## テストフレームワーク

| 項目 | 採用 |
| --- | --- |
| ランナー | Vitest (root `vitest.config.ts`) |
| DOM | jsdom |
| Render | @testing-library/react |
| Coverage | v8 provider, `apps/web/coverage/` |

## テストケースマトリクス (CONST_005 形式)

| Component | happy | empty/null | interaction/variant |
| --- | --- | --- | --- |
| Hero | title+subtitle+両CTA render | subtitle/CTA 省略 | primary/secondary 単独 |
| MemberCard | 全 prop で詳細リンク確認 | nickname/zone/status null | density (comfy/dense/list) |
| ProfileHero | 全 badge 表示 | zone & status null | nickname="" |
| StatCard | counts + zoneBreakdown 全件 | zoneBreakdown=[] | counts=0 |
| Timeline | 順序 + dateTime 検証 | entries=[] で null 返却 | 100 件巨大データ |
| FormPreviewSections | sectionKey grouping | fields=[] | visibility 未知ラベル fallback |
| EmptyState | title+desc+reset link | description/resetHref/children 省略 | resetLabel + children slot |

## Coverage 目標

| 指標 | 閾値 |
| --- | --- |
| Stmts | ≥85% |
| Lines | ≥85% |
| Funcs | ≥85% |
| Branches | ≥80% |

## 計測コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
cat apps/web/coverage/coverage-summary.json | jq '.["apps/web/src/components/public/Hero.tsx"]'
```

## 除外境界

- `apps/web/src/components/public/index.ts` (barrel)
- `Avatar` の独立検証 (UT-WEB-COV-04 委譲、transitive のみ)

## 不変条件チェック

- #2 memberId のみを参照、responseId は fixture に入れない
- #5 public/feedback のみ対象
- #6 fetch / D1 mock 不要 (presentational)
