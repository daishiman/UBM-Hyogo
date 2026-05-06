# Phase 6: テスト拡充

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-6/phase-6.md` |

## 目的
retention purge job / retention policy のユニットテストカバレッジを vitest --coverage で取得する。

## 実行タスク
詳細は `outputs/phase-6/phase-6.md` を正本とする。

## 統合テスト連携
カバレッジ実測値を Phase 7 の閾値判定に渡し、Phase 8 の統合テストでギャップを補う。

## 参照資料
- `outputs/phase-6/phase-6.md`
- `apps/api/vitest.config.ts`

## 成果物
- `outputs/phase-6/phase-6.md`
- `apps/api/coverage/coverage-summary.json` (実行成果物)

## 完了条件
- Phase 6 正本ファイルが存在する。
- `pnpm --filter @ubm-hyogo/api test --coverage` が PASS する。
- `apps/api/src/jobs/retention-purge.ts` および `apps/api/src/services/retention-policy.ts` の coverage 値が取得されている。
