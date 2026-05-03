# task-issue-191-production-d1-schema-aliases-apply-001

[実装区分: 実装仕様書]

判断根拠: Cloudflare D1 production database (`ubm-hyogo-db-prod`) に対する migration apply / 既適用検証を扱う production-operation であり、NON_VISUAL evidence と SSOT 同期を伴うため実装仕様書として扱う。

## メタ情報

| 項目 | 内容 |
| --- | --- |
| GitHub Issue | `Refs #359` |
| 状態 | completed_via_already_applied_path |
| taskType | implementation (production-operation) |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| canonical root | `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/` |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/database-schema.md`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| Priority | High |
| Scale | small |

## 目的

Issue #359 の要求である `apps/api/migrations/0008_create_schema_aliases.sql` の production D1 適用を、ユーザー承認後に安全確認する。2026-05-02 の Phase 13 実行では、production D1 の `d1_migrations` ledger 上で `0008_create_schema_aliases.sql` が 2026-05-01 10:59:35 UTC に既適用であることを検出したため、二重 apply は実行せず、PRAGMA shape verification path で完了した。

## スコープ

含む:

- production D1 (`ubm-hyogo-db-prod`) の migration inventory 確認
- `schema_aliases` table の存在確認
- `d1_migrations` ledger による `0008_create_schema_aliases.sql` 適用履歴確認
- `PRAGMA table_info(schema_aliases)` / `PRAGMA index_list(schema_aliases)` による Required Shape 検証
- `database-schema.md` / workflow tracking / artifact inventory への production applied marker 同期

含まない:

- duplicate `wrangler d1 migrations apply` 実行
- code deploy
- fallback retirement (#299)
- direct stable_key update guard (#300)
- 07b endpoint rename / apps/web UI 変更
- 0008 以降の hardening migration
- destructive rollback DDL

## 正本契約

| 項目 | 値 |
| --- | --- |
| target database | `ubm-hyogo-db-prod` |
| environment | `production` |
| migration file | `apps/api/migrations/0008_create_schema_aliases.sql` |
| Required columns | `id`, `revision_id`, `stable_key`, `alias_question_id`, `alias_label`, `source`, `created_at`, `resolved_by`, `resolved_at` |
| Required indexes | `idx_schema_aliases_stable_key`, `idx_schema_aliases_revision_stablekey_unique`, `idx_schema_aliases_revision_question_unique` |
| 実行ラッパー | `bash scripts/cf.sh d1 ... --config apps/api/wrangler.toml --env production` |
| 禁止 | `wrangler` 直接実行 / ユーザー承認前の production write / duplicate apply / push / PR 作成 |

## Phase 一覧

| Phase | 名称 | 仕様書 | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計 | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビュー | [phase-03.md](phase-03.md) | spec_created |
| 4 | テスト戦略 | [phase-04.md](phase-04.md) | spec_created |
| 5 | 実装計画 | [phase-05.md](phase-05.md) | spec_created |
| 6 | 異常系設計 | [phase-06.md](phase-06.md) | spec_created |
| 7 | ACマトリクス | [phase-07.md](phase-07.md) | spec_created |
| 8 | DRY/責務確認 | [phase-08.md](phase-08.md) | spec_created |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | spec_created |
| 10 | GO/NO-GO | [phase-10.md](phase-10.md) | spec_created |
| 11 | NON_VISUAL evidence | [phase-11.md](phase-11.md) | spec_created |
| 12 | ドキュメント同期 | [phase-12.md](phase-12.md) | spec_created |
| 13 | 承認 + 既適用検証 | [phase-13.md](phase-13.md) | completed_via_already_applied_path |

## 依存関係

- #299 `task-issue-191-schema-questions-fallback-retirement-001` は production apply prerequisite satisfied の未割り当てタスクとして継続する。
- #300 `task-issue-191-direct-stable-key-update-guard-001` は production apply prerequisite satisfied の未割り当てタスクとして継続する。
- 先行 apply の出所監査は `docs/30-workflows/unassigned-task/task-issue-359-production-d1-out-of-band-apply-audit-001.md` で扱う。今回サイクルで完了させると外部ログ・承認証跡の探索が必要になり、本 production verification の完了条件と独立するため、監査タスクとして分離する。

## 実行境界

- Phase 13 ではユーザー承認後に remote inventory / shape verification を実行済み。
- `schema_aliases` は Required Shape を満たしていたため duplicate apply は実行していない。
- commit / push / PR 作成はこのタスク仕様のスコープ外であり、ユーザー明示承認なしに実行しない。
