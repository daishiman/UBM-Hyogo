# Phase 13: 承認 + 既適用検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |
| 状態 | completed_via_already_applied_path |

## 目的

ユーザーの明示的な production D1 操作承認後に、`0008_create_schema_aliases.sql` の production state を確認する。2026-05-02 の実行では `schema_aliases` が既に存在し、`d1_migrations` ledger が `0008_create_schema_aliases.sql` の適用履歴を示したため、duplicate apply を実行せず shape verification で完了した。

## 承認ゲート

| ゲート | 内容 | 結果 |
| --- | --- | --- |
| Gate-A: Design GO | Phase 1-12 の operation spec が揃う | PASS |
| Gate-B: User approval | production D1 state 確認の明示承認 | PASS (`outputs/phase-13/user-approval.md`) |
| Gate-C1: Already-applied verification | ledger / PRAGMA evidence による shape verification | PASS |
| Gate-C2: Commit / push / PR | 別承認が必要 | Not executed in this task |

## Runtime Evidence

| Evidence | Status |
| --- | --- |
| `outputs/phase-13/user-approval.md` | recorded |
| `outputs/phase-13/migrations-list-before.txt` | captured |
| `outputs/phase-13/tables-before.txt` | captured |
| `outputs/phase-13/d1-migrations-table.txt` | captured |
| `outputs/phase-13/pragma-table-info.txt` | captured |
| `outputs/phase-13/pragma-index-list.txt` | captured |
| `outputs/phase-13/migrations-list-after.txt` | captured |
| `outputs/phase-13/migrations-apply.log` | intentionally absent; duplicate apply skipped |

## Required Shape

| Object | Expected | Result |
| --- | --- | --- |
| Table | `schema_aliases` exists | PASS |
| Columns | `id`, `revision_id`, `stable_key`, `alias_question_id`, `alias_label`, `source`, `created_at`, `resolved_by`, `resolved_at` | PASS |
| Indexes | `idx_schema_aliases_stable_key`, `idx_schema_aliases_revision_stablekey_unique`, `idx_schema_aliases_revision_question_unique` | PASS |
| Ledger | `0008_create_schema_aliases.sql` applied | PASS |

## Scope Boundary

This Phase 13 does not include fallback retirement (#299), direct update guard (#300), code deploy, push, PR creation, or rollback DDL. Those require separate task execution and explicit user approval where applicable.

## 完了条件

- [x] user approval evidence is recorded
- [x] already-applied path is documented
- [x] duplicate apply was not executed
- [x] Required Shape is verified by PRAGMA evidence
- [x] SSOT production applied marker is synchronized

## 実行タスク

- Record user approval for production D1 remote reads in `outputs/phase-13/user-approval.md`.
- Capture migration inventory and table inventory before any write command.
- If `schema_aliases` already exists and `d1_migrations` records `0008_create_schema_aliases.sql`, skip duplicate apply and execute PRAGMA shape verification.
- Update SSOT only after ledger and PRAGMA evidence match the Required Shape.

## 参照資料

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-13/d1-migrations-table.txt`
- `outputs/phase-13/pragma-table-info.txt`
- `outputs/phase-13/pragma-index-list.txt`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`

## 統合テスト連携

- No UI or application test suite is required for the already-applied production verification path.
- Runtime verification is the remote D1 ledger plus PRAGMA shape evidence.
- Follow-on code behavior remains owned by #299 fallback retirement and #300 direct stable-key update guard.

## 成果物/実行手順

- `migrations-apply.log` is intentionally absent because the apply command did not run.
- `d1-migrations-table.txt` is the ledger substitute for the already-applied path.
- Commit, push, PR, rollback DDL, and code deploy remain outside this Phase 13 execution.
