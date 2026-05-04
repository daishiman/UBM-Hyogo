# Phase 4 — テスト戦略

## 追加テスト
`scripts/lint-stablekey-literal.test.ts` に以下を追加:

```ts
it("strict mode reports 0 violations after legacy literal cleanup (issue-393)", () => {
  const { code, report } = runLint(["--strict"]);
  expect(report.violations).toHaveLength(0);
  expect(code).toBe(0);
});
```

これにより、将来 application code に stableKey 文字列が再混入した場合、本テストが赤くなり regression を検知できる。

## focused test 一覧（既存維持・PASS 確認）
| family | 対象テスト |
|---|---|
| A | apps/api/src/jobs/mappers/*.test.ts, sync-sheets-to-d1.test.ts |
| B | apps/api/src/repository/_shared/*.test.ts, publicMembers.test.ts |
| C | apps/api/src/routes/admin/members.test.ts, requests.test.ts |
| D | apps/api/src/use-cases/public/*.test.ts, view-models/public/__tests__/*.test.ts |
| E,F | apps/web の component test（該当時） |
| G | packages/shared/src/utils/consent.test.ts（既存） |

## DoD
- 上記テスト群が PASS
- 新 issue-393 テストが PASS（strict 0 violation）
- stableKeyCount=31 が維持される既存テストが PASS
