# task-issue-191-schema-aliases-implementation-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| GitHub Issue | #298 |
| 状態 | completed / implementation done / Phase 13 blocked_until_user_approval |
| taskType | implementation |
| docsOnly | false |
| visualEvidence | NON_VISUAL |
| canonical root | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/` |
| source task | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001.md` |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` |

## 目的

Issue #191 の docs-only close-out で確定した `schema_aliases` 正本方針を、後続実装者が迷わず実装できる Phase 1-13 の実行仕様に落とし込む。HTTP 契約は `POST /admin/schema/aliases` を維持し、内部書き込み先を `schema_questions.stable_key` 直更新から `schema_aliases` INSERT へ切り替える。

## スコープ

含む: D1 migration、`schemaAliasesRepository`、07b alias apply 配線、03a alias-first lookup、contract tests、静的検査、NON_VISUAL evidence、Phase 12 正本同期。

含まない: 本番 D1 apply、fallback retirement、endpoint rename、apps/web からの D1 直接参照。

## 正本契約

| 項目 | 内容 |
| --- | --- |
| DDL columns | `id`, `stable_key`, `alias_question_id`, `alias_label`, `source`, `created_at`, `resolved_by`, `resolved_at` |
| required index | `idx_schema_aliases_stable_key` |
| repository | `schemaAliasesRepository.lookup(questionId)`, `insert(row)`, `update(id, patch)` |
| 03a lookup | `schema_aliases` first、miss 時のみ `schema_questions.stable_key` fallback |
| 07b write | `POST /admin/schema/aliases` を維持し、`schema_aliases` INSERT + `schema_diff_queue.status='resolved'` |
| 禁止 | `UPDATE schema_questions SET stable_key` |

## Phase一覧

| Phase | 名称 | 仕様書 | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | completed |
| 2 | 設計 | [phase-02.md](phase-02.md) | completed |
| 3 | 設計レビュー | [phase-03.md](phase-03.md) | completed |
| 4 | テスト戦略 | [phase-04.md](phase-04.md) | completed |
| 5 | 実装計画 | [phase-05.md](phase-05.md) | completed |
| 6 | 異常系設計 | [phase-06.md](phase-06.md) | completed |
| 7 | ACマトリクス | [phase-07.md](phase-07.md) | completed |
| 8 | DRY/責務確認 | [phase-08.md](phase-08.md) | completed |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | completed |
| 10 | GO/NO-GO | [phase-10.md](phase-10.md) | completed |
| 11 | NON_VISUAL evidence | [phase-11.md](phase-11.md) | completed |
| 12 | ドキュメント同期 | [phase-12.md](phase-12.md) | completed |
| 13 | PR作成 | [phase-13.md](phase-13.md) | blocked_until_user_approval |

## 実装結果

- `apps/api/migrations/0008_create_schema_aliases.sql` を追加し、`schema_aliases` table と `idx_schema_aliases_stable_key` を定義した。
- `apps/api/src/repository/schemaAliases.ts` に `lookup/insert/update` repository contract を追加した。
- `POST /admin/schema/aliases` は path を維持し、apply mode で `schema_aliases` INSERT + `schema_diff_queue.status='resolved'` を行う。
- 03a lookup は `schema_aliases` first、miss 時のみ `schema_questions.stable_key` fallback とした。
- `packages/shared` に `SchemaAlias` / `SchemaAliasZ` を追加した。

## 実行境界

Issue #298 は closed のまま扱い、PR 作成や Issue 再オープンは Phase 13 のユーザー承認があるまで実行しない。
