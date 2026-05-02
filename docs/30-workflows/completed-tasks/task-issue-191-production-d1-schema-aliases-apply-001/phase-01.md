# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| 作成日 | 2026-05-02 |
| タスク種別 | implementation (production-operation) |
| visualEvidence | NON_VISUAL |
| scope | production D1 への `0008_create_schema_aliases.sql` apply 要件確定。仕様書作成時点では apply 実行しない |

## 目的

Issue #359 の production-operation 要求を、apply 対象 / 環境 / 事前条件 / 事後検証 / 承認ゲートに分解し、AC-1〜AC-8 を確定する。

## 実行タスク

- Issue #359 body と source unassigned task の Why/What/How を読み直す。
- `task-issue-191-schema-aliases-implementation-001` の Phase 11/12 evidence で local apply 完了が確認済みであることを再確認する。
- `apps/api/migrations/0008_create_schema_aliases.sql` の DDL（columns / indexes）を SSOT として固定する。
- production database 名 / environment / binding を確定する。
- ユーザー承認を Phase 13 ゲートに集約する境界を明示する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Issue #359 | `https://github.com/daishiman/UBM-Hyogo/issues/359` | 元タスク。closed のまま扱う |
| 先行 implementation task | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/` | local migration / repository / wiring が完了した先行タスク |
| migration SSOT | `apps/api/migrations/0008_create_schema_aliases.sql` | apply 対象 DDL |
| database SSOT | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | production apply 状態の正本 |
| Cloudflare ラッパー | `scripts/cf.sh` | wrangler 直接実行禁止。`bash scripts/cf.sh d1 ...` 経由で apply |
| CLAUDE.md | `CLAUDE.md` § Cloudflare 系 CLI 実行ルール | secrets と CLI 強制ラッパー |

## 実行手順

1. `task-issue-191-schema-aliases-implementation-001` の `phase-12.md` と `outputs/phase-11/d1-schema-evidence.md` を再読し、local migration apply 完了を確認する。
2. `apps/api/wrangler.toml` から production environment の D1 binding（`ubm-hyogo-db-prod` / database_id）を grep で確認する。
3. `apps/api/migrations/0008_create_schema_aliases.sql` の DDL を取得し、必須 column / index を AC に転記する。
4. Acceptance Criteria を以下で固定する。

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | apply 対象 migration が `apps/api/migrations/0008_create_schema_aliases.sql` のみであることが phase-02 設計に記録されている |
| AC-2 | 対象 production database が `ubm-hyogo-db-prod` (`--env production`) であることが evidence に固定されている |
| AC-3 | apply 前 inventory（既存 table list / `schema_aliases` 不在）が evidence ファイルとして取得可能な手順が明記されている |
| AC-4 | apply 後の `PRAGMA table_info(schema_aliases)` / `PRAGMA index_list(schema_aliases)` が必須 column / index を満たすことを検証する手順が明記されている |
| AC-5 | apply 実行は `bash scripts/cf.sh d1 migrations apply` 経由のみで、`wrangler` 直接呼び出しを禁止していることが記載されている |
| AC-6 | rollback 手順（drop table / 旧 state 復元）が phase-06 で定義されている |
| AC-7 | ユーザー承認が Phase 13 で取得される前に apply を実行しない gate が記載されている |
| AC-8 | `database-schema.md` および `task-workflow-active.md` の production apply 状態 marker 更新が Phase 12 タスクに含まれている |

## 統合テスト連携

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| migration inventory | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` | Phase 11 で evidence 化（Phase 13 承認後に実測） |
| schema verification | `PRAGMA table_info(schema_aliases);` / `PRAGMA index_list(schema_aliases);` | Phase 11 evidence template、Phase 13 で実測 |
| 静的検査 | migration ファイル内容 grep | Phase 9 で実行 |

## 多角的チェック観点（AIが判断）

- HTTP 契約 / code deploy がスコープに紛れ込んでいないか。
- fallback retirement / direct update guard を本タスクに混ぜていないか。
- migration apply の不可逆性とユーザー承認の関係が AC で明示されているか。
- `0008_schema_alias_hardening.sql` 等 0008 系以降の追加 migration は対象外であることが明示されているか。

## サブタスク管理

| サブタスク | owner | 依存 |
| --- | --- | --- |
| AC 確定 | spec author | Issue #359 / source task |
| production env 確認 | spec author | `apps/api/wrangler.toml` |
| 承認ゲート定義 | spec author | CLAUDE.md secrets policy |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 要件定義 | `phase-01.md` | AC とスコープ |

## 完了条件

- [ ] AC-1〜AC-8 が検証可能な形で定義されている
- [ ] Issue #359 closed 維持方針が明記されている
- [ ] production D1 apply は Phase 13 承認後のみとする境界が明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 参照資料を読んだ
- [ ] AC を Phase 7 に引き継げる
- [ ] スコープ外（code deploy / fallback retirement / direct update guard）が明示されている

## 次Phase

Phase 2: 設計
