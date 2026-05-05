# outputs phase 11: ut-web-cov-02-public-components-coverage

- status: completed
- purpose: 手動 smoke / 実測 evidence (coverage report capture)

## evidence 取得手順

```bash
mkdir -p docs/30-workflows/ut-web-cov-02-public-components-coverage/outputs/phase-11/evidence
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage \
  | tee docs/30-workflows/ut-web-cov-02-public-components-coverage/outputs/phase-11/evidence/coverage-report.txt
cp apps/web/coverage/coverage-summary.json \
  docs/30-workflows/ut-web-cov-02-public-components-coverage/outputs/phase-11/evidence/coverage-summary.json
```

## 実行結果

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @ubm-hyogo/web test -- apps/web/src/components/public/__tests__ apps/web/src/components/feedback/__tests__` | PASS | 40 files / 288 tests passed. The script ran the web Vitest suite because the package script already scopes `apps/web`. |
| `pnpm --filter @ubm-hyogo/web test:coverage` | PASS | 40 files / 288 tests passed. Node engine warning: repo wants Node 24.x, local runtime was Node v22.21.1. |

## coverage delta 表

| Component | Baseline (Lines) | After (Lines) | Stmts | Funcs | Branches | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| FormPreviewSections | 0% | 100% | 100% | 100% | 100% | PASS |
| Hero | 0% | 100% | 100% | 100% | 100% | PASS |
| MemberCard | 0% | 100% | 100% | 100% | 100% | PASS |
| ProfileHero | 0% | 100% | 100% | 100% | 100% | PASS |
| StatCard | 0% | 100% | 100% | 100% | 100% | PASS |
| Timeline | 0% | 100% | 100% | 100% | 100% | PASS |
| EmptyState | 0% | 100% | 100% | 100% | 100% | PASS |

## user approval gate 発火条件

- 7 component 全てが threshold 達成
- regression なし
- snapshot 新規作成なし

Status: PASS.

## evidence

- outputs/phase-11/evidence/coverage-report.txt
- outputs/phase-11/evidence/coverage-summary.json
