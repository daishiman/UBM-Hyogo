# Phase 2: 設計 — 結果

## 実行日時
2026-05-02

## 実行内容

production D1 apply の operation / evidence flow を 6 ステップに分解し、各ステップの CLI / file path / 出力先を `phase-02.md` に確定した。

## 6 ステップ Operation Flow

| Step | 内容 | コマンド / 経路 | 出力先 |
| --- | --- | --- | --- |
| (A) Pre-flight | branch / 先行 task / DDL 確認 | `git status` / `phase-12.md`（先行）/ `cat 0008_*.sql` | (record-only) |
| (B) User Approval | Phase 13 ゲート | テキスト承認 | `outputs/phase-13/user-approval.md` |
| (C) Pre-apply inventory | migration list / table list | `bash scripts/cf.sh d1 migrations list ...` / `... d1 execute ... SELECT name FROM sqlite_master ...` | `outputs/phase-13/migrations-list-before.txt`, `outputs/phase-13/tables-before.txt` |
| (D) Apply | migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` | `outputs/phase-13/migrations-apply.log` |
| (E) Post-apply evidence | PRAGMA + migration list | `... PRAGMA table_info` / `... PRAGMA index_list` / `... migrations list` | `outputs/phase-13/pragma-table-info.txt`, `pragma-index-list.txt`, `migrations-list-after.txt` |
| (F) SSOT sync | apply marker / workflow tracking | edit `database-schema.md` / `task-workflow-active.md` | (commit) |

## 環境 SSOT 確定

`apps/api/wrangler.toml` を grep し以下を SSOT として固定:

- `[env.production]` セクション存在（line 31）
- `[[env.production.d1_databases]]` の `binding = "DB"` / `database_name = "ubm-hyogo-db-prod"` / `database_id = "24963f0a-7fbb-4508-a93a-f8e502aa4585"`
- staging は `ubm-hyogo-db-staging`（database_id `990e5d6c-51eb-4826-9c13-c0ae007d5f46`）として分離

## 設計上の境界

- code deploy はフローに含めない（apps/api / apps/web の Worker bundle apply は別タスク）
- `0008_schema_alias_hardening.sql` 等は本タスクで apply しない（migration list 上で未適用として残ることを許容）
- `CREATE TABLE IF NOT EXISTS` および `CREATE [UNIQUE] INDEX IF NOT EXISTS` のみで構成され、既存 table への破壊的影響なし

## 完了判定

- [x] 6 ステップが evidence path 付きで定義済み
- [x] `wrangler` 直接実行を経路に持たない（全て `scripts/cf.sh` 経由）
- [x] code deploy がフローに含まれていない

## 次 Phase へ

Phase 3 で 5 観点の設計レビューを実施する。
