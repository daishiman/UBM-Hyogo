# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | `schema_aliases` 実装仕様。仕様書作成時点ではコード実装しない |

## 目的

Issue #298 の実装要件を、D1 schema、repository、07b route、03a sync lookup、検証条件へ分解する。

## 実行タスク

- Issue #298 と unassigned task の Why/What/How を読み直す。
- Issue #191 close-out の正本仕様を確認する。
- AC-1 から AC-9 を確定する。
- Phase 1-3 完了まで Phase 4 以降へ進まない gate を確認する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Issue #298 | `https://github.com/daishiman/UBM-Hyogo/issues/298` | 元タスク。closed のまま扱う |
| source task | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001.md` | 実装要求の原本（completed / promoted） |
| Schema Alias Resolution | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | `schema_aliases` 正本契約 |
| 07b workflow | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/index.md` | 既存 HTTP 契約と stale 記述の差分 |
| issue-191 close-out | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/` | docs-only close-out 成果物 |

## 実行手順

1. `git log --oneline -20 -- apps/api/migrations apps/api/src/routes/admin apps/api/src/repository apps/api/src/jobs apps/api/src/sync` を実行し、既実装状態を確認する。
2. `rg -n "schema_aliases|POST /admin/schema/aliases|UPDATE schema_questions SET stable_key|stableKey" apps/api docs/30-workflows .claude/skills/aiworkflow-requirements` を実行する。
3. Acceptance Criteria を以下で固定する。

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | `apps/api/migrations/<NNNN>_create_schema_aliases.sql` が追加され、必要 column と index がある |
| AC-2 | `schemaAliasesRepository.lookup(questionId)`, `insert(row)`, `update(id, patch)` または同等 API があり contract tests がある |
| AC-3 | `POST /admin/schema/aliases` の path/request/response は維持される |
| AC-4 | apply は `schema_aliases` INSERT と `schema_diff_queue.status='resolved'` を同一 transaction / D1 batch で行う |
| AC-5 | `schema_questions.stable_key` 直更新は実行経路から除外される |
| AC-6 | 03a lookup は `schema_aliases` first、miss の場合のみ `schema_questions.stable_key` fallback |
| AC-7 | transient lookup error は miss 扱いせず sync failure + retry へ倒す |
| AC-8 | duplicate alias / fallback hit / fallback miss / transient failure の tests がある |
| AC-9 | `source='manual'` の INSERT は auth middleware 由来の `resolved_by` を必須にする |

## 統合テスト連携

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| API unit/contract | `mise exec -- pnpm --filter @repo/api test` | Phase 9 で実行 |
| 静的検査 | `rg -n "UPDATE schema_questions SET stable_key|stableKey.*schema_questions" apps packages` | Phase 11 で evidence 化 |
| D1 schema | `PRAGMA table_info(schema_aliases);` | Phase 11 で evidence 化 |

## 多角的チェック観点（AIが判断）

- HTTP 契約と内部保存先を分離できているか。
- `schema_questions.stable_key` fallback retirement を本タスクに混ぜていないか。
- 03a と 07b の owner 境界が Phase 2 に引き継がれているか。

## サブタスク管理

| サブタスク | owner | 依存 |
| --- | --- | --- |
| D1 migration | backend implementation | Phase 2 |
| Repository contract | backend implementation | migration |
| 07b wiring | backend implementation | repository |
| 03a lookup | backend implementation | repository |
| tests/evidence | backend implementation | all implementation subtasks |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 要件定義 | `phase-01.md` | AC とスコープ |

## 完了条件

- [ ] AC-1 から AC-9 が検証可能な形で定義されている
- [ ] Issue #298 closed 維持方針が明記されている
- [ ] Phase 1-3 gate が確認されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 参照資料を読んだ
- [ ] P50チェックを実行した
- [ ] AC を Phase 7 に引き継げる

## 次Phase

Phase 2: 設計
