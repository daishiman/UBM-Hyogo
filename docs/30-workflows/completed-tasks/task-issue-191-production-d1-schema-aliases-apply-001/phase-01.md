# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| 作成日 | 2026-05-02 |
| タスク種別 | implementation (production-operation) |
| visualEvidence | NON_VISUAL |
| Refs | #359 |
| scope | production D1 への `0008_create_schema_aliases.sql` apply / already-applied verification |

## 目的

Cloudflare D1 production database `ubm-hyogo-db-prod` で `apps/api/migrations/0008_create_schema_aliases.sql` が適用済みかを確認し、未適用ならユーザー承認後に apply する。既適用なら duplicate apply を避け、ledger と PRAGMA shape verification で完了判定する。

## Acceptance Criteria

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | apply 対象 migration が `apps/api/migrations/0008_create_schema_aliases.sql` のみである |
| AC-2 | 対象 production database が `ubm-hyogo-db-prod` (`--env production`) である |
| AC-3 | apply 前 inventory（migration list / table list）が evidence として保存される |
| AC-4 | `schema_aliases` 既存時は duplicate apply を実行せず already-applied verification path に分岐する |
| AC-5 | `d1_migrations` ledger が `0008_create_schema_aliases.sql` 適用履歴を示す |
| AC-6 | `PRAGMA table_info(schema_aliases)` が Required columns を満たす |
| AC-7 | `PRAGMA index_list(schema_aliases)` が Required indexes を満たす |
| AC-8 | Cloudflare CLI は `bash scripts/cf.sh ... --config apps/api/wrangler.toml --env production` 経由で実行する |
| AC-9 | production write / rollback / push / PR はユーザー明示承認なしに実行しない |
| AC-10 | `database-schema.md` と workflow tracking に production applied marker を同期する |

## スコープ境界

#299 fallback retirement と #300 direct update guard は、本タスクの完了により production apply prerequisite が満たされた独立未割り当てタスクとして継続する。本タスクではコード変更、guard script、fallback removal、coverage query を必須成果物にしない。

## 完了条件

- [x] AC-1〜AC-10 が検証可能な形で定義されている
- [x] production D1 apply / already-applied verification は Phase 13 承認後のみとする境界が明記されている
- [x] #299/#300 を scope 外の依存タスクとして扱う方針が明記されている

## 実行タスク

- Phase 01: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 参照資料

- Phase 01: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 統合テスト連携

- Phase 01: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 成果物/実行手順

- production D1 already-applied verification workflow の一部として、本文の正本記述に従う。
