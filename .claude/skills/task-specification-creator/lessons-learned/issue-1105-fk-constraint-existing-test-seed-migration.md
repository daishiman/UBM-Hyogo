# issue-1105 FK 制約導入時の既存テスト seed 移行

## Summary

子テーブルへ FK 制約を新規追加する仕様（例: `member_status.member_id → member_identities(member_id)` を 0026 で導入）は、
そのテーブルに INSERT している**既存テスト seed のうち親行を作らないもの全件**を同じ PR で更新しないと、
ローカルでは PRAGMA 無効で通っても **CI の coverage shard では `FOREIGN KEY constraint failed` で fail** する。

実例: PR #1154 で `coverage-gate-shard (api-unit)` と `coverage-gate` が fail。
原因は `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` の `seed` が
`member_status` へ 6 行 INSERT する際に親 `member_identities` 行を作っていなかったこと。
shard が exit 1 → coverage 未生成 → coverage-gate も連鎖 fail（**1 つのテスト throw で 2 gate が落ちる**）。

## 影響 seed の 2 カテゴリ（修正方針が異なる）

FK 追加で落ちる既存 seed は **意味で 2 分類**し、別々に直す:

1. **実 member を表す seed**（実体のあるデータ）→ 親 identity 行を追加する。
   - 例: `sync-backfill-publish-state.spec.ts` の seed、`issue-399-admin-queue-staging-seed.sql`。
   - seed SQL の場合は対応する **cleanup SQL にも親の DELETE を child→parent 順で追加**（FK で親削除が child に阻まれる）。
2. **意図的に orphan を作る検出系テスト**（H2「identity 欠落」診断など）→ 親を足すと検出されなくなり本末転倒。
   FK を回避して legacy orphan 状態を再現する。

## Miniflare D1 の FK 挙動（重要な落とし穴）

- Miniflare D1 は **FK を既定で強制**し、ランタイムの `PRAGMA foreign_keys = OFF` を **honored しない**。
  migration 末尾の `PRAGMA foreign_keys = ON` が効いたのではなく、元々 ON。
- よって「orphan を作るテスト」は PRAGMA OFF では直らない。**member_status を FK なしの legacy schema に
  作り替え→orphan 挿入→検証→0026 を再適用して FK 復元**するヘルパー（`_setup.ts: withLegacyMemberStatus`）を使う。
  共有 Miniflare connection（`--maxWorkers=1`）なので **finally で必ず FK schema を復元**しないと後続テストを汚染する。

## Reusable rules

| Rule | Application |
| --- | --- |
| FK 影響 seed の全件洗い出し | `grep -rln "INTO <child>" apps/api --include="*.sql" --include="*.ts"` で SQL/spec 双方を列挙し、各ファイルが親を seed しているか確認する（spec が beforeEach で親を入れていても、特定 test で orphan を作る場合がある点に注意） |
| 親行を先に seed | 実 member 系は子行 INSERT 直前に親（NOT NULL/UNIQUE 充足の最小行）を挿入。`seedIdentity` パターン踏襲 |
| 検出系は legacy 再現 | orphan 検出診断のテストは FK なし schema 再構築で legacy 状態を作る。`PRAGMA OFF` は Miniflare で効かない |
| seed SQL は cleanup も対 | seed に親を足したら cleanup SQL に親の DELETE を child→parent 順で追加。idempotency テストも確認 |
| 連鎖 fail / マスキング | shard 1 throw が coverage 未生成→coverage-gate 連鎖 fail。さらに **最初の CI は 1 件しか見せず、直すと隠れていた 2〜3 件が表面化**する。push 前に `vitest run <unit shard 全体>` をローカル実行して全件列挙し round-trip を避ける |
| ローカル緑 ≠ CI 緑 | FK 仕様は coverage shard（FK 強制）を真実とみなす |

## Phase への織り込み

- **Phase 1（仕様抽出）**: FK 追加対象テーブルへ INSERT する既存テスト/seed SQL を「移行対象」として明示列挙する。
- **Phase 7-9（実装/テスト）**: 親行 seed の追加を migration 本体と同一変更単位に含める（後追い PR にしない）。
- **Phase 12（compliance）**: `coverage-gate-shard` を CI gate チェックリストに含め、FK 仕様では shard ログの `FOREIGN KEY constraint failed` を回帰観点とする。

## Evidence

- Migration: `apps/api/migrations/0026_member_status_fk_constraint.sql`（FK は `member_identities(member_id)` 参照）
- 親 seed / legacy 再現の正本: `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts`（`seedIdentity` と `createLegacyMemberStatusTable`）
- legacy 再現ヘルパー: `apps/api/src/repository/__tests__/_setup.ts` の `withLegacyMemberStatus`
- 実 member 系修正: `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts`、`apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql`（+ cleanup SQL に親 DELETE）
- 検出系修正: `apps/api/src/diagnostics/forms-pipeline.contract.spec.ts`、`apps/api/src/diagnostics/member-diagnosis.contract.spec.ts`
- CI: PR #1154 `coverage-gate` / `coverage-gate-shard (api-unit)` の fail → 修正後解消。ローカル全シャード（api-unit 550 / api-d1 964）緑で確認
