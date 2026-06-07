---
workflow_id: issue-1128-audit-batchid-index-optimization
task_id: task-issue-1079-followup-001-audit-batchid-index-optimization
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-07
owner: daishiman
taskType: implementation
category: 改善（パフォーマンス）
visualEvidence: NON_VISUAL
implementation_mode: new
implementation_status: implementation_complete_pending_pr
branch: docs/issue-1128-audit-batchid-index-optimization-spec
related_issue: 1128
issue_state: CLOSED
parent_workflow: issue-1079-bulk-tag-audit-batch-filter
dependencies:
  - issue-1079-bulk-tag-audit-batch-filter
  - issue-1036-bulk-member-tag-assign
---

# issue-1128 / audit_log batchId index 最適化（タスク仕様書）

## 実装区分

`[実装区分: 実装完了（local evidence captured）]` — コード変更を伴う（apps/api のみ）。

> 元 Issue #1128 は `type:performance` ラベルだが docs-only ではない。目的（`GET /admin/audit`
> の batchId 検索を JSON full scan から index 列走査へ切り替える）の達成には、D1 migration
> （schema 変更）と `apps/api/src/repository/auditLog.ts` の SQL 変更が必須であるため、
> 実装仕様書として作成する（CONST_004 デフォルト・実態優先）。
>
> 本 Issue は **CLOSED 状態のまま** タスク仕様書化する（ユーザー明示指示）。GitHub Issue 上の
> ステータスは変更しない。

## なぜこの実装を今完了したか（issue 鮮度・必要性の判定）

2026-06-07 時点のコードベースを精査し、Issue #1128 の根本問題が**未解決のまま実在する**ことを確認した。

| 確認項目 | 結果 | 根拠 |
| --- | --- | --- |
| audit_log に batchId 相関列（generated column / correlation_id）が存在するか | **無し** | `apps/api/migrations/0003_auth_support.sql:32-42`（テーブル定義以後、列追加 migration 無し。`grep batchId\|correlation_id\|GENERATED ALWAYS apps/api/migrations/` = 0 件） |
| batchId 専用 index が存在するか | **無し** | audit_log の index は `idx_audit_log_target`（`0003`）と `idx_audit_log_export`系のみ |
| `GET /admin/audit` の batchId 検索が index 列走査になっているか | **否（JSON full scan）** | `apps/api/src/repository/auditLog.ts:200-205` が `json_valid(after_json) AND json_extract(after_json,'$.batchId') = ? OR (... before_json ...)` の full scan |
| 別タスクで解決済みか | **当初は否。今回解決済み** | 元 unassigned task は `consumed_by_issue_1128` へ更新済み。今回 `0026_audit_log_batchid_index.sql` を追加 |

→ **結論: 必要（未解決）**。Issue #1079 Phase 12 で YAGNI として先送りされた performance 改善だが、根本問題（full scan）は実在し未実装。本タスクで根本解決する。

### issue を現在のコードに最適化した点（鮮度補正）

元 Issue #1128 は「`GENERATED ALWAYS AS (...) STORED` 列を第一候補」としていたが、現行 SQLite / D1 の実態に合わせて次のとおり最適化する。

- **SQLite の `ALTER TABLE ... ADD COLUMN` は STORED generated column を追加できない**（VIRTUAL のみ許可。STORED は既存行の再計算＝テーブル再構築が必要）。append-only な audit_log（行数増を前提とする本タスクの動機そのもの）でテーブル再構築は高コスト・高リスク。
- 一方 **VIRTUAL generated column は `ADD COLUMN` 可能、かつ index 可能**（index は算出値を materialize するため index 走査が効く）。append() の write path 変更も backfill UPDATE も不要（列は派生・index 構築時に全既存行へ算出が及ぶ）。
- よって **第一候補を「VIRTUAL generated column + index」に変更**し、Issue が懸念した「VIRTUAL は D1 で index 不可になり得る」点は Phase 2 で Miniflare D1（D1 と同一 SQLite エンジン）+ `EXPLAIN QUERY PLAN` により実測検証する。**fallback を「plain `correlation_id` 列 + backfill UPDATE + append() write + index」** とする（決定は Phase 2/3 ゲート）。

## 正本の事実（調査確定）

| 項目 | 確定値 |
| --- | --- |
| 対象テーブル | `audit_log`（定義: `apps/api/migrations/0003_auth_support.sql:32-42`、append-only） |
| 対象 repository | `apps/api/src/repository/auditLog.ts` の `listFiltered`（batchId 分岐 = `:200-205`）と `append`（`:103-138`） |
| 対象 route | `apps/api/src/routes/admin/audit.ts`（`GET /audit`・query surface は #1079 で確定済み、変更しない） |
| batchId の埋め込み位置 | assign は `after_json.$.batchId`、unassign は `before_json.$.batchId`（非対称） |
| 既存 batchId 検索 SQL | `((json_valid(after_json) AND json_extract(after_json,'$.batchId') = ?n) OR (json_valid(before_json) AND json_extract(before_json,'$.batchId') = ?n))` |
| 次の migration 番号 | `0026`（最新 = `0025_backfill_member_status.sql`。`sequence-exceptions.json` に重複登録不要な新規連番） |
| 非退化 contract test | `apps/api/src/repository/__tests__/auditLog.repository.spec.ts`（batchId ケース `:122-235`）/ `apps/api/src/routes/admin/audit.contract.spec.ts` |
| テスト migration loader | `apps/api/src/repository/__tests__/_setup.ts`（`apps/api/migrations/*.sql` を sort 順に全適用。`0026` は自動で乗る。`--` コメント除去 + `;` 分割のため BEGIN..END を含まない単文 DDL のみ可） |
| D1 テスト config | `vitest.d1.config.ts`（`pool: forks` / `singleFork`。`apps/api/src/repository/**/*.repository.spec.ts` と `apps/api/src/routes/**/*.contract.spec.ts` を include） |

## 受け入れ基準（元 Issue AC を継承・現行コードへ補正）

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | audit_log に batchId 相関キーを保持する列（VIRTUAL generated column 第一候補 / plain `correlation_id` 列 fallback）が `0026` migration で追加される |
| AC-2 | 追加列に index が付与され、`GET /admin/audit` の batchId 検索が index 列走査になる（`EXPLAIN QUERY PLAN` で `SCAN audit_log` でなく index 使用を確認） |
| AC-3 | assign（after_json 由来）/ unassign（before_json 由来）双方の batchId が1列で拾える（`COALESCE(json_extract(after_json,'$.batchId'), json_extract(before_json,'$.batchId'))`） |
| AC-4 | 既存 audit 行も検索に乗る（VIRTUAL なら index 構築で自動・plain 列なら backfill UPDATE migration） |
| AC-5 | `GET /admin/audit` の batchId フィルタの返却結果が切替前と同一（非退化・既存 contract / repository test 緑） |
| AC-6 | migration のロールバック手順が用意される（`DROP INDEX` + `ALTER TABLE DROP COLUMN`、または再構築手順） |
| AC-7 | `append-only` 不変条件を破らない（`auditLog.ts` から UPDATE/DELETE を export しない設計を維持。backfill は migration 内 UPDATE のみで、アプリ API は追加しない） |

## 実装結果（2026-06-07）

| 項目 | 結果 |
| --- | --- |
| migration | `apps/api/migrations/0026_audit_log_batchid_index.sql` を追加。`audit_log.batch_id` を VIRTUAL generated column とし、`idx_audit_log_batch_id(batch_id, created_at DESC, audit_id DESC)` を作成 |
| repository | `apps/api/src/repository/auditLog.ts` の `listFiltered` batchId 分岐を `batch_id = ?` に変更。公開 query surface / response shape は不変 |
| tests | focused D1 Vitest 3 files / 28 tests PASS。`EXPLAIN QUERY PLAN` で `idx_audit_log_batch_id` 使用、`SCAN audit_log` 不在を assert |
| user-gated | staging / production D1 migration apply、deploy、commit、push、PR は未実行 |

## スコープ

### 含む（今サイクルで完了）

- `0026` migration: batchId 相関列 + index 追加（+ fallback 採用時は backfill UPDATE）
- `auditLog.ts` の `listFiltered` batchId 分岐を index 列走査へ切替（+ fallback 採用時は `append` の write path 拡張）
- migration ロールバック手順の文書化
- 既存 contract / repository test の非退化確認 + index 走査 / 後方互換の追加 test

### 含まない

- `GET /admin/audit` の query surface 変更（batchId param は #1079 で確定済み）
- bulk tag write 実装の変更（#1036）
- production / staging への migration apply・deploy（CONST_002 / user-gated）
- commit・push・PR 作成（CONST_002 / user-gated・Phase 13）

> **CONST_007（単一サイクル完了）**: 本タスクは migration 1 本 + repository 1 ファイル変更 + test に閉じ、分割や先送りなしで 03.実装.md の 1 サイクルで完了できる。未タスク分離は行わない。

## Phase 構成

| Phase | ファイル | 目的 |
| --- | --- | --- |
| 1 | `phase-1-requirements.md` | 要件・scope・inventory・命名規則・タスク分類（NON_VISUAL）確定 |
| 2 | `phase-2-design.md` | 列方式の実測決定（VIRTUAL vs plain）・migration / SQL / rollback 設計 |
| 3 | `phase-3-design-review.md` | Phase 4 進行可否ゲート判定 |
| 4 | `phase-4-test-plan.md` | command suite と expected result（RED）設計 |
| 5 | `phase-5-implementation.md` | migration + repository 実装手順（変更ファイル一覧・DoD） |
| 6 | `phase-6-test-additions.md` | fail path / 回帰 guard / index 走査 assertion 追加 |
| 7 | `phase-7-coverage.md` | 変更行 coverage 可視化 |
| 8 | `phase-8-refactor.md` | duplicate / drift 削減 |
| 9 | `phase-9-qa.md` | typecheck / lint / D1 test 一括判定 |
| 10 | `phase-10-final-review.md` | AC 充足・blocker 判定 |
| 11 | `phase-11-manual-test.md` | NON_VISUAL 証跡（自動テスト + EXPLAIN QUERY PLAN） |
| 12 | `phase-12-documentation.md` | implementation guide / spec sync / 未タスク / feedback |
| 13 | `phase-13-pr.md` | PR 作成（user 明示承認後のみ） |

## 参照

- 元タスク仕様: `docs/30-workflows/unassigned-task/task-issue-1079-followup-001-audit-batchid-index-optimization.md`
- 親 workflow: `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/`（baseline B-1 起票元）
- 対象コード: `apps/api/src/repository/auditLog.ts` / `apps/api/migrations/` / `apps/api/src/routes/admin/audit.ts`
- migration 運用: `apps/api/migrations/README.md` / `docs/30-workflows/unassigned-task/UT-08A-04-d1-migration-test-guideline.md`
- 不変条件: CLAUDE.md 「D1 直接アクセスは apps/api に閉じる」/ audit_log append-only（`auditLog.ts:228-229`）
