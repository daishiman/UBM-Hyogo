# Phase 4: テスト戦略 — 結果

## 実行日時
2026-05-02

## 戦略確定

検証は 3 層に分離する。production write は Phase 13 承認後にのみ実行する。

### (A) 静的検査（Phase 9 で実行 / Phase 11 evidence へ保存）

| ID | 検査内容 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| S-1 | migration ファイル存在 | `ls apps/api/migrations/0008_create_schema_aliases.sql` | exit 0 |
| S-2 | 必須 column 含有 | `rg -n "id\\s+TEXT PRIMARY KEY\|stable_key\|alias_question_id\|alias_label\|source\|created_at\|resolved_by\|resolved_at" apps/api/migrations/0008_create_schema_aliases.sql` | 全 9 column hit |
| S-3 | 必須 index 含有 | `rg -n "idx_schema_aliases_stable_key\|idx_schema_aliases_revision_stablekey_unique\|idx_schema_aliases_revision_question_unique" apps/api/migrations/0008_create_schema_aliases.sql` | 3 index hit |
| S-4 | wrangler 直叩き禁止 | `rg -n "wrangler d1 migrations apply" scripts/ apps/ packages/` | 0 件 |
| S-5 | production env 固定 | `rg -n "ubm-hyogo-db-prod\|env\\.production" apps/api/wrangler.toml` | hit あり |

### (B) local re-verification（Phase 9 で実行）

| ID | 検査内容 | コマンド |
| --- | --- | --- |
| L-1 | DDL column再確認 | S-2 と同じ |
| L-2 | DDL index再確認 | S-3 と同じ |

(local DB は先行タスク `task-issue-191-schema-aliases-implementation-001` Phase 12 で apply 済み。)

### (C) production verification（Phase 13 でユーザー承認後にのみ実行）

| ID | 検査内容 | 期待結果 |
| --- | --- | --- |
| P-1 | apply 前 migration list | `0008_create_schema_aliases.sql` のみ unapplied。他 pending は NO-GO |
| P-2 | apply 前 table 不在確認 | 0 行 |
| P-3 | apply 実行 | 成功 |
| P-4 | apply 後 PRAGMA table_info | 9 column 揃う |
| P-5 | apply 後 PRAGMA index_list | 3 index 揃う |
| P-6 | apply 後 migration list | applied 反映 |

## 非対象テスト

- API contract / web E2E（code deploy しないため）
- データ書き込みテスト（apply 直後の table は空）

## 完了判定

- [x] S-1〜S-5 / L-1〜L-2 / P-1〜P-6 が網羅されている
- [x] production verification は Phase 13 承認後にのみ実行する境界が明示されている
