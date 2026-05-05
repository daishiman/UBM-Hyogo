# Phase 1: 要件定義 — 結果

## 実行日時
2026-05-02 (worktree task-20260502-112259-wt-6)

## 実行内容

`phase-01.md` の AC-1〜AC-8 を全て確定し、production-operation タスクとしての境界（Issue #359 closed 維持 / Phase 13 承認後にのみ apply / code deploy 非含 / 0008 系以降の追加 migration 除外）を明示した。

## Acceptance Criteria 確定

| ID | 受け入れ基準 | 状態 |
| --- | --- | --- |
| AC-1 | apply 対象 = `apps/api/migrations/0008_create_schema_aliases.sql` のみ | DEFINED |
| AC-2 | target = `ubm-hyogo-db-prod` (`--env production`) | DEFINED |
| AC-3 | apply 前 inventory 取得手順あり | DEFINED |
| AC-4 | apply 後 PRAGMA で必須 column / index を検証 | DEFINED |
| AC-5 | `bash scripts/cf.sh` 経由のみ（wrangler 直叩き禁止） | DEFINED |
| AC-6 | rollback 手順を Phase 6 に定義 | DEFINED |
| AC-7 | Phase 13 承認前の apply 禁止 gate あり | DEFINED |
| AC-8 | SSOT (`database-schema.md` / `task-workflow-active.md`) 更新を Phase 12 に含む | DEFINED |

## 参照確認

- `apps/api/migrations/0008_create_schema_aliases.sql` 存在確認: PASS（913 bytes, 9 column / 3 index）
- `apps/api/wrangler.toml` 内 `[env.production]` の D1 binding（`ubm-hyogo-db-prod` / database_id `24963f0a-7fbb-4508-a93a-f8e502aa4585`）確認済み
- 先行タスク `task-issue-191-schema-aliases-implementation-001` は `docs/30-workflows/completed-tasks/` 配下に存在し、local apply 完了済み（先行 Phase 12 evidence 参照）

## スコープ境界

### 含む
- `0008_create_schema_aliases.sql` の production D1 apply 操作
- 適用前後 inventory / PRAGMA evidence 取得
- SSOT 同期更新

### 含まない（明示的除外）
- Worker bundle deploy (apps/api / apps/web)
- `task-issue-191-schema-questions-fallback-retirement-001` の fallback 廃止
- `task-issue-191-direct-stable-key-update-guard-001` の guard 実装
- 07b endpoint rename / apps/web UI 変更
- `0008_schema_alias_hardening.sql` 等 0008 系以降の追加 migration

## 完了判定

- [x] AC-1〜AC-8 が検証可能な形で定義されている
- [x] Issue #359 closed 維持方針が記録されている
- [x] production D1 apply は Phase 13 承認後のみ実行する境界が記述されている
- [x] 参照資料（migration / wrangler.toml / SSOT / cf.sh / CLAUDE.md）が phase-01.md に列挙されている

## 次 Phase へ

Phase 2 で 6 ステップ operation flow を確定する。
