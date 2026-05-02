# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

production D1 apply の operation flow と evidence acquisition flow を確定する。実装コードは追加しない。

## 実行タスク

- apply フローを「(A) 事前確認 → (B) 承認取得 → (C) inventory 取得 → (D) apply 実行 → (E) PRAGMA evidence → (F) SSOT 同期」の 6 ステップへ分解する。
- 各ステップで使用する CLI / file path / 出力先を確定する。
- production environment 識別子の SSOT を `apps/api/wrangler.toml` に固定する。
- evidence file naming を確定する。

## 操作フロー設計

```
(A) Pre-flight
   ├─ git status clean / branch 確認
   ├─ task-issue-191-schema-aliases-implementation-001 の Phase 12 完了確認
   └─ apps/api/migrations/0008_create_schema_aliases.sql の DDL 再確認
(B) User Approval (Phase 13 gate)
   └─ ユーザー承認テキストを evidence へ記録
(C) Pre-apply inventory
   ├─ bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production
   │   → outputs/phase-13/migrations-list-before.txt
   └─ bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
       → outputs/phase-13/tables-before.txt
(D) Apply
   └─ bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production
       → outputs/phase-13/migrations-apply.log
(E) Post-apply evidence
   ├─ PRAGMA table_info(schema_aliases);
   │   → outputs/phase-13/pragma-table-info.txt
   ├─ PRAGMA index_list(schema_aliases);
   │   → outputs/phase-13/pragma-index-list.txt
   └─ bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production
       → outputs/phase-13/migrations-list-after.txt
(F) SSOT sync
   ├─ database-schema.md production apply marker 更新
   └─ task-workflow-active.md production apply 状態同期
```

## 環境 SSOT

| key | source | 期待値 |
| --- | --- | --- |
| database name | `apps/api/wrangler.toml` `[env.production]` | `ubm-hyogo-db-prod` |
| environment flag | `scripts/cf.sh d1` 引数 | `--env production` |
| migration directory | `apps/api/migrations/` | `0008_create_schema_aliases.sql` を含む |
| binding | `apps/api/wrangler.toml` | `DB` |

## 設計上の境界

- code deploy（Worker bundle apply）はこのタスクで実行しない。
- `0008_schema_alias_hardening.sql` 等の追加 migration は別 wave で扱う。ただし production migration list に未適用として残ることは許容し、本タスクでは apply 状態を確認のみ行う。
- 既存 table への影響は無いこと（`CREATE TABLE IF NOT EXISTS` のみ）を前提とする。

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 設計 | `phase-02.md` | 6 ステップ operation flow |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| migration SSOT | `apps/api/migrations/0008_create_schema_aliases.sql` | apply 対象 DDL |
| D1 binding | `apps/api/wrangler.toml` | production database / binding 確認 |
| database SSOT | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | production apply marker の更新先 |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 9 static checks | migration file / columns / indexes / wrapper policy | `outputs/phase-11/static-checks.md` |
| Phase 13 runtime verification | production apply 前後の D1 inventory / PRAGMA | `outputs/phase-13/*` |

## 完了条件

- [ ] 6 ステップが evidence path 付きで定義されている
- [ ] `wrangler` 直接実行を経路に持たない
- [ ] code deploy がフローに含まれていない
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 3: 設計レビュー
