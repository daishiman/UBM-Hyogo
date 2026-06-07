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

ローカルでは `_setup` が FK を強制しない経路で通り、CI（FK 強制）でのみ顕在化した。

## Reusable rules

| ルール | 適用 |
| --- | --- |
| FK 影響 seed の全件検出 | FK 追加時は `grep -rln "INSERT INTO <child>" apps/api/src --include="*.spec.ts"` で親未 seed の spec を列挙し、同一変更単位で修正 |
| 親行を先に挿入 | 子行 INSERT 直前に親テーブルの最小行（NOT NULL/UNIQUE 充足）を挿入。既存 `seedIdentity` 等のヘルパーを踏襲 |
| CI を真実とみなす | FK 仕様はローカル緑だけで判断せず coverage shard（FK 強制）で検証する |
| 連鎖 fail の読み解き | shard 1 テストの throw が coverage 未生成→coverage-gate 道連れを招く。無関係に見える gate fail は根因テストの throw を疑う |

## Branch-sync / PR フローでの位置づけ

dev 取り込み（sync-merge）後に「コンフリクト 0・push 不要」でも、**既存 PR の CI が FK 等の構造変更で fail し続けている**ことがある。
sync 完了後は `gh pr checks <番号>` で赤を確認し、root を直して push するまでが完了条件。

## Evidence

- Migration: `apps/api/migrations/0026_member_status_fk_constraint.sql`
- 親 seed 正本パターン: `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` (`seedIdentity`)
- 修正対象: `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts`
- CI: PR #1154 `coverage-gate` / `coverage-gate-shard (api-unit)` fail → 親行 seed 追加で解消
