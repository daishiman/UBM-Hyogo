# Phase 7: カバレッジ確認

[実装区分: 実装仕様書]

> 目的: 変更行の line / branch coverage を実測し、concern と dependency edge を可視化する。FB-BEFORE-QUIT-002 / FB-Feedback-5 に従い「対象範囲を変更ファイルに限定」して測定する。

---

## 1. 対象範囲（局所検証）

| 対象 | パス |
|------|------|
| _dashboard component 群 | `apps/web/src/features/admin/components/_dashboard/**` |
| _members component 群 | `apps/web/src/features/admin/components/_members/**` |
| _layout component | `apps/web/src/features/admin/components/_layout/**` |
| API client / mapper | `apps/web/src/lib/admin/api.ts`, `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/src/lib/admin/types.ts`, `apps/web/src/lib/admin/admin-dashboard-ui.ts` |

**対象外**: page.tsx (SSR は Phase 11 Playwright で確認) / `(admin)/layout.tsx`（同上）/ `apps/web/src/components/ui/*`（task-10 で測定済み）

---

## 2. カバレッジ目標

| 指標 | 目標 |
|------|------|
| Line coverage（対象範囲） | ≥ 90% |
| Branch coverage（対象範囲） | ≥ 85% |
| Statement coverage | ≥ 90% |
| Function coverage | ≥ 95%（exported function は全て呼び出される） |

---

## 3. 実行コマンド

```bash
mise exec -- pnpm -F @ubm-hyogo/web exec vitest run \
  --coverage \
  --coverage.include='src/features/admin/components/_dashboard/**' \
  --coverage.include='src/features/admin/components/_members/**' \
  --coverage.include='src/features/admin/components/_layout/**' \
  --coverage.include='src/lib/admin/api.ts' \
  --coverage.include='src/lib/admin/server-fetch.ts' \
  --coverage.include='src/lib/admin/types.ts' \
  --coverage.include='src/lib/admin/admin-dashboard-ui.ts' \
  src/features/admin
```

---

## 4. 期待される未カバー領域と判断

| 領域 | カバレッジ低下要因 | 判定 |
|------|------------------|------|
| `MemberDrawer` の error branch | API 失敗 path はテストでカバー | カバー済み |
| `BulkActionBar` の `finally` 経路 | reject ケースを TC-FAIL-01 で捕捉 | カバー済み |
| `ZoneDistribution` の placeholder branch | TC-EDGE-05 で捕捉 | カバー済み |
| `RecentActionsTable` の `targetId === undefined` 分岐 | edge test 追加 | TC を追加して 100% に近づける |
| `KpiCard` の `sub === undefined` 分岐 | KpiGrid からは常に sub 渡す | 必要なら直接 KpiCard test 追加 |

未カバー branch が ≥ 5% 残る場合、Phase 7 内で追加 test を作成（Phase 8 へ持ち込まない）。

---

## 5. 変更行の line/branch 実測（FB-Feedback-5）

`outputs/phase-07/coverage-summary.md` に以下を記載:

```
File                                | Lines  | Branches | Funcs | Statements
_dashboard/KpiGrid.tsx              | 100%   | 100%     | 100%  | 100%
_dashboard/KpiCard.tsx              | XX%    | XX%      | ...
_dashboard/ZoneDistribution.tsx     | ...
...
lib/admin/api.ts                    | ...
TOTAL (in scope)                    | ≥90%   | ≥85%     | ≥95%  | ≥90%
```

---

## 6. 完了条件（DoD）

- [ ] §3 コマンド実行で coverage report 生成
- [ ] §2 目標値を全行・全分岐で達成
- [ ] §5 実測値を `outputs/phase-07/coverage-summary.md` に記録
- [ ] 未達領域が残る場合は補完 test を Phase 7 内で追加

## 成果物

- `outputs/phase-07/coverage-summary.md`
- `coverage/` ディレクトリ（HTML report、git ignore 推奨）
- 実行後に `artifacts.json` の `phase07.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
