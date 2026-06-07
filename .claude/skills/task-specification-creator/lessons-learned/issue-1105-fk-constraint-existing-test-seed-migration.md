# issue-1105 FK 制約導入時の既存テスト seed 移行

## Summary

子テーブルへ FK 制約を新規追加する仕様（例: `member_status.member_id → member_identities(member_id)` を 0026 で導入）は、
そのテーブルに INSERT している**既存テスト seed のうち親行を作らないもの全件**を同じ PR で更新しないと、
ローカルでは PRAGMA 無効で通っても **CI の coverage shard では `FOREIGN KEY constraint failed` で fail** する。

実例: PR #1154 で `coverage-gate-shard (api-unit)` と `coverage-gate` が fail。
原因は `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` の `seed` が
`member_status` へ 6 行 INSERT する際に親 `member_identities` 行を作っていなかったこと。
shard が exit 1 → coverage 未生成 → coverage-gate も連鎖 fail（**1 つのテスト throw で 2 gate が落ちる**）。

## Reusable rules

| Rule | Application |
| --- | --- |
| FK 影響 seed の全件洗い出し | FK 追加仕様の Phase で `grep -rln "INSERT INTO <child>" <specdir>` し、親テーブルを seed していない spec を列挙して必須改修対象に含める |
| 親行を先に seed | 子行 INSERT の直前に親テーブル（必須 NOT NULL/UNIQUE 列を満たす最小行）を挿入する。確立済み `seedIdentity` 等のヘルパーパターンを踏襲する |
| ローカル緑 ≠ CI 緑 | `_setup` が `PRAGMA foreign_keys` を ON にしない経路だとローカルだけ通る。FK 仕様は CI coverage shard（FK 強制）を真実とみなす |
| 1 throw = 連鎖 fail | shard 内 1 テストの throw は coverage 未生成を招き coverage-gate も道連れにする。"無関係な gate fail" を見たら根因テストの throw を疑う |

## Phase への織り込み

- **Phase 1（仕様抽出）**: FK 追加対象テーブルへ INSERT する既存テスト/seed SQL を「移行対象」として明示列挙する。
- **Phase 7-9（実装/テスト）**: 親行 seed の追加を migration 本体と同一変更単位に含める（後追い PR にしない）。
- **Phase 12（compliance）**: `coverage-gate-shard` を CI gate チェックリストに含め、FK 仕様では shard ログの `FOREIGN KEY constraint failed` を回帰観点とする。

## Evidence

- Migration: `apps/api/migrations/0026_member_status_fk_constraint.sql`（FK は `member_identities(member_id)` 参照）
- 親 seed パターン正本: `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` の `seedIdentity`
- 修正 seed: `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts`（`member_identities` を子行前に挿入）
- CI: PR #1154 `coverage-gate` / `coverage-gate-shard (api-unit)` の fail → 修正後解消
