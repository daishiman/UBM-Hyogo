# Phase 7 — カバレッジ確認

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 名前 | カバレッジ確認 |
| 状態 | spec_created |
| 依存 | Phase 6 |
| 入力 | Phase 5 実装 + Phase 6 追加テスト |
| 出力 | outputs/phase-07/coverage-report.md |

## 目的

新規実装ファイルの coverage を line 100% / branch 100% で担保する。
既存ファイルへの追記分はその関数 / 行のみを局所的に評価する。

## タスク

- [ ] `mise exec -- pnpm --filter @ubm/api test -- --coverage` を実行
- [ ] `mise exec -- pnpm --filter @ubm/web test -- --coverage` を実行
- [ ] `mise exec -- pnpm --filter @ubm/web build` または同等の OpenNext bundle check を実行し、`papaparse` 追加後の build / bundle regressions を確認する
- [ ] 対象ファイルの line / branch / function coverage を表に記録
- [ ] 未到達ブランチがあれば Phase 6 に戻り追加テストを書く

## カバレッジ対象

| ファイル | 範囲 | 目標 line | 目標 branch |
| --- | --- | --- | --- |
| `apps/api/src/use-cases/admin/import-attendance-bulk.ts` | ファイル全体 | 100% | 100% |
| `apps/api/src/routes/admin/attendance.ts` | 新規 route handler 関数のみ | 100% | 100% |
| `apps/api/src/repository/attendance.ts` | `listExistingAttendanceMemberIds` のみ | 100% | 100% |
| `apps/web/src/lib/csv/parse-attendance.ts` | ファイル全体 | 100% | 100% |
| `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` | ファイル全体 | 100% | 100% |

## 成果物

- `outputs/phase-07/coverage-report.md`
  - 上記表に実測値を埋める
  - 未到達行があれば該当箇所とテスト追加方針を記録
  - vitest / c8 出力の summary を貼付
  - web build / bundle check の結果を貼付

## 完了条件

- 対象 5 ファイルすべてが line 100% / branch 100%
- 既存ファイルの coverage 後退なし

## 注意点 / リスク

- `attendance.ts` 既存 single add/remove のカバレッジは本 Phase の評価対象外
- D1 binding error 経路の branch 到達は mock で明示的にカバーする
- bundle size の絶対閾値は本タスクでは新設しない。build 成功と大幅 regressions の有無を記録し、しきい値導入が必要なら Phase 12 で未タスク化する
