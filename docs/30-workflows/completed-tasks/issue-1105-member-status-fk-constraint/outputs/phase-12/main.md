# Phase 12 Main — issue-1105 member_status FK 制約導入

## Summary

`member_status.member_id` に `member_identities(member_id)` への FK を導入する local 実装を追加した。変更は `apps/api/migrations/` の SQL 1 本、D1 contract test 1 本、FK 前提へ追従する既存 D1 test fixtures で、`apps/web` は変更しない。

## Local Implementation

| 対象 | 状態 |
| --- | --- |
| `apps/api/migrations/0026_member_status_fk_constraint.sql` | 追加済み |
| `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` | 追加済み |
| 既存 D1 test fixtures | `member_status` seed / upsert を FK 前提へ追従済み |
| `notification_opt_out` | 0020 由来の現行カラムとして保持 |
| orphan fail-fast | FK ON のコピーで違反を温存しない |
| `idx_member_status_public` | DROP/RENAME 後に同一定義で再作成 |

## Gates

| Gate | 状態 |
| --- | --- |
| local code diff | present |
| D1 contract test | PASS: `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` 6 tests |
| full apps/api D1 regression | PASS: 109 files / 937 tests (`--no-file-parallelism --maxWorkers=1`) |
| API typecheck | PASS: `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| sequence guard | PASS: `mise exec -- pnpm verify:d1-migrations` |
| apps/web diff 0 | PASS: `git diff --name-only dev...HEAD \| rg '^apps/web/' \|\| true` produced 0 lines |
| remote D1 apply | user-gated |
| commit / push / PR | user-gated |

## Struggle Notes

| 症状 | 原因 | 対応 | 再発防止 |
| --- | --- | --- | --- |
| 仕様が9カラム前提だった | `0020_notification_channel_and_opt_out.sql` の後続 ALTER を inventory に含めていなかった | migration/test/spec を現行10カラムへ補正 | 再構築 migration は `PRAGMA table_info` と後続 ALTER を必ず確認する |
| orphan が残っても migration が通る設計だった | `PRAGMA foreign_keys = OFF` のままコピーしていた | コピー時は FK ON、DROP/RENAME のみ OFF に変更 | FK 後付け仕様では fail-fast test を必須化する |
| Phase 12 strict 7 が6件だった | `main.md` を Phase 11 evidence で代替していた | `outputs/phase-12/main.md` を追加 | strict 7 は Phase 12 配下の7ファイルとして数える |
