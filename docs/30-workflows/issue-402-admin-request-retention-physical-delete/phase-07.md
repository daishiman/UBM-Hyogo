# Phase 7: テストカバレッジ確認

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-7/phase-7.md` |

## 目的
retention purge / retention policy 各ファイルの coverage が lines 80% / branch 75% を満たすかを判定し、未達時の追加テスト案を提示する。

## 実行タスク
詳細は `outputs/phase-7/phase-7.md` を正本とする。

## 統合テスト連携
未達ブランチがある場合は Phase 8 の統合テストで補完する。

## 参照資料
- `outputs/phase-7/phase-7.md`
- `outputs/phase-6/phase-6.md`

## 成果物
- `outputs/phase-7/phase-7.md`

## 完了条件
- Phase 7 正本ファイルが存在する。
- `apps/api/src/jobs/retention-purge.ts`: lines >= 80% / branch >= 75%
- `apps/api/src/services/retention-policy.ts`: lines >= 80% / branch >= 75%
- 未達の場合は追加テストケースの提案が記録されている。
