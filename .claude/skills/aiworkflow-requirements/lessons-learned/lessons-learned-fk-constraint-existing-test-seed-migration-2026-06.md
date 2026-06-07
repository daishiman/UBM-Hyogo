# lessons-learned: FK 制約導入時の既存テスト seed 移行 (2026-06 / issue-1105)

## Context

子テーブルへ FK 制約を新規追加するワークフロー（issue-1105: `member_status.member_id → member_identities(member_id)` を migration 0026 で導入）で、
PR #1154 の `coverage-gate-shard (api-unit)` と `coverage-gate` が CI で fail した。
他の 30+ チェックは全 pass。

## Root cause

`apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` の `seed` が
`member_status` へ 6 行 INSERT する際、親 `member_identities` 行を作っていなかった。
FK 制約導入後は孤児行となり `D1_ERROR: FOREIGN KEY constraint failed (SQLITE_CONSTRAINT_FOREIGNKEY)` で throw。
shard が exit 1 → カバレッジ未生成 → `coverage-gate` も連鎖 fail。

実態は Miniflare D1 が **FK を既定で強制**しているためで、migration 末尾の `PRAGMA foreign_keys = ON` が効いた
わけではない（元々 ON）。そして **Miniflare D1 は `PRAGMA foreign_keys = OFF` を honored しない**。

## 影響 seed の 2 カテゴリ

1. **実 member 系**（実体あり）→ 親 `member_identities` を追加。seed SQL なら **cleanup SQL に親 DELETE を
   child→parent 順で追加**（FK で親削除が阻まれる）。例: `sync-backfill-publish-state.spec.ts`、`issue-399-...seed.sql`。
2. **意図的 orphan の検出系テスト**（H2 identity 欠落診断）→ 親を足すと検出されなくなる。FK なし legacy schema を
   再構築して orphan を再現し検証後に 0026 を再適用して FK 復元する（`_setup.ts: withLegacyMemberStatus`）。
   共有 connection（`--maxWorkers=1`）汚染を防ぐため finally で必ず FK 復元する。例: `forms-pipeline.contract.spec.ts`、
   `member-diagnosis.contract.spec.ts`。

## 連鎖 fail とマスキング（round-trip 削減）

- shard 1 テストの throw → coverage 未生成 → coverage-gate も道連れ（無関係に見える gate fail は根因 throw を疑う）。
- **最初の CI は最初の throw 1 件しか見せず、直すと隠れていた 2〜3 件が表面化**する。push 前に
  `vitest run <unit shard 全体>`（さらに `_setup` を触ったなら d1 shard も）をローカル実行して **FK 起因失敗を全件列挙**し、
  CI を 1 往復で緑にする。

## Reusable rules

| ルール | 適用 |
| --- | --- |
| FK 影響 seed の全件検出 | `grep -rln "INTO <child>" apps/api --include="*.sql" --include="*.ts"` で SQL/spec 双方を列挙。spec が beforeEach で親を入れていても特定 test で orphan を作る場合あり |
| 親行を先に挿入 | 実 member 系は子行 INSERT 直前に親の最小行（NOT NULL/UNIQUE 充足）を挿入。`seedIdentity` 踏襲 |
| 検出系は legacy 再現 | orphan 検出診断は FK なし schema 再構築で再現。`PRAGMA OFF` は Miniflare で効かない |
| 全シャードで網羅検証 | `_setup` を変更したら api-unit / api-d1 両シャードをローカル実行 |
| CI を真実とみなす | FK 仕様はローカル緑だけで判断せず coverage shard（FK 強制）で検証する |

## Branch-sync / PR フローでの位置づけ

dev 取り込み（sync-merge）後に「コンフリクト 0・push 不要」でも、**既存 PR の CI が FK 等の構造変更で fail し続けている**ことがある。
sync 完了後は `gh pr checks <番号>` で赤を確認し、root を直して push するまでが完了条件。

## Evidence

- Migration: `apps/api/migrations/0026_member_status_fk_constraint.sql`
- 親 seed / legacy 再現の正本: `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts`（`seedIdentity` / `createLegacyMemberStatusTable`）
- legacy 再現ヘルパー: `apps/api/src/repository/__tests__/_setup.ts` の `withLegacyMemberStatus`
- 実 member 系修正: `sync-backfill-publish-state.spec.ts`、`issue-399-admin-queue-staging-seed.sql`（+ cleanup SQL）
- 検出系修正: `diagnostics/forms-pipeline.contract.spec.ts`、`diagnostics/member-diagnosis.contract.spec.ts`
- CI: PR #1154 `coverage-gate` / `coverage-gate-shard (api-unit)` fail → 修正後解消。ローカル全シャード緑（api-unit 550 / api-d1 964）で確認
