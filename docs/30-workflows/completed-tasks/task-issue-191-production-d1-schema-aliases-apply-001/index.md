# task-issue-191-production-d1-schema-aliases-apply-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| GitHub Issue | #359 (closed のまま扱う) |
| 状態 | spec_created / Phase 13 blocked_until_user_approval |
| taskType | implementation (production-operation) |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| canonical root | `docs/30-workflows/task-issue-191-production-d1-schema-aliases-apply-001/` |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| Priority | High |
| Scale | small |

## 目的

Issue #359 の production-operation 要求である `apps/api/migrations/0008_create_schema_aliases.sql` の Cloudflare D1 production database への適用と、適用前後の inventory / PRAGMA evidence 取得、`.claude/skills/aiworkflow-requirements/references/database-schema.md` の production apply 状態同期を、Phase 1〜13 の単独実行可能な仕様へ落とし込む。

## スコープ

含む:

- production D1 (`ubm-hyogo-db-prod`) への `0008_create_schema_aliases.sql` migration apply
- apply 前 inventory（既存 table list / 既存 schema_aliases 不在確認）の evidence 化
- apply 後の `PRAGMA table_info(schema_aliases)` / `PRAGMA index_list(schema_aliases)` 取得
- `database-schema.md` および `task-workflow-active.md` の production apply 状態 marker 更新
- ユーザー承認ゲート（Phase 13）でのみ実行する operation 境界の明示

含まない:

- code deploy（apps/api / apps/web の Worker bundle deploy は別タスク）
- `task-issue-191-schema-questions-fallback-retirement-001` の fallback 廃止
- `task-issue-191-direct-stable-key-update-guard-001` の direct update guard
- 07b endpoint path rename / apps/web UI 変更
- `0008_schema_alias_hardening.sql` 等 0008 系以降の追加 migration

## 正本契約

| 項目 | 値 |
| --- | --- |
| target database | `ubm-hyogo-db-prod` |
| environment | `production` |
| migration file | `apps/api/migrations/0008_create_schema_aliases.sql` |
| 必須 columns | `id`, `revision_id`, `stable_key`, `alias_question_id`, `alias_label`, `source`, `created_at`, `resolved_by`, `resolved_at` |
| 必須 indexes | `idx_schema_aliases_stable_key`, `idx_schema_aliases_revision_stablekey_unique`, `idx_schema_aliases_revision_question_unique` |
| 実行ラッパー | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production` |
| 禁止 | `wrangler` 直接実行 / migration apply と code deploy の同時実行 / ユーザー承認前の apply |

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
| 13 | 承認 + 実適用 + PR作成 | [phase-13.md](phase-13.md) | blocked_until_user_approval |

## 実行境界

- Issue #359 は closed のまま扱い、Issue 再オープン / ラベル変更 / コメント追加は Phase 13 のユーザー承認まで実行しない。
- production D1 への migration apply は **Phase 13 のユーザー承認後にのみ** 実行する。Phase 1-12 は仕様書作成・dry-run 計画・evidence template 整備までに留める。
- `d1 migrations apply` は未適用 migration を適用する操作なので、Phase 13 の preflight で unapplied migration が `0008_create_schema_aliases.sql` のみであることを確認する。target 以外の pending migration があれば NO-GO とし、apply しない。
- code deploy はこのタスクのスコープ外。
