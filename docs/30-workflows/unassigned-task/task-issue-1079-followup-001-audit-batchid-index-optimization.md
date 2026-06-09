# Issue #1079 follow-up 001: audit_log batchId index 最適化

> **[consumed → spec 化済み 2026-06-07]** 本未タスクは Phase 1-13 実装仕様書へ展開済み。
> 正本: `docs/30-workflows/completed-tasks/issue-1128-audit-batchid-index-optimization/`（`implemented_local_evidence_captured`）。
> Issue #1128 は CLOSED のまま実装（ユーザー指示）。staging / production migration apply・PR は Phase 13
> user-gated。初期 spec では「STORED generated column 第一候補」を SQLite/D1 の
> `ALTER TABLE ADD COLUMN` 制約（STORED 追加不可・VIRTUAL のみ可）に合わせ
> **VIRTUAL generated column + index（fallback: plain `correlation_id`）** へ最適化補正した。

## メタ情報

```yaml
issue_number: 1128
task_id: task-issue-1079-followup-001-audit-batchid-index-optimization
task_name: audit_log batchId index 最適化（generated column / correlation_id 列）
category: 改善（パフォーマンス）
target_feature: GET /admin/audit の batchId 検索 / audit_log schema
priority: 低
scale: 中規模
status: consumed_by_issue_1128
source_phase: issue-1079 Phase 12 unassigned-task-detection B-1
created_date: 2026-06-03
dependencies: [issue-1079-bulk-tag-audit-batch-filter, issue-1036-bulk-member-tag-assign]
spec_path: docs/30-workflows/unassigned-task/task-issue-1079-followup-001-audit-batchid-index-optimization.md
```

| 項目 | 内容 |
| --- | --- |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/` |
| 分類 | follow-up / performance |
| 優先度 | 低 |
| 規模 | 中規模 |
| ステータス | consumed_by_issue_1128 |

## 1. 概要（なぜこのタスクが必要か）

Issue #1079 では `GET /admin/audit` に `batchId` フィルタを追加し、bulk tag 操作（#1036）の audit 行を一括相関閲覧できるようにした。実装は `json_valid(after_json) AND json_extract(after_json,'$.batchId')`（assign）/ `json_valid(before_json) AND json_extract(before_json,'$.batchId')`（unassign）を同一 binding で OR 検索する。

親 Issue #1036 が採択した「軽量 batchId 方針（schema 変更なし）」に従い、batchId（UUID v4）は正規化列ではなく JSON payload 内に埋め込まれている。このため JSON 列には index が貼れず、`json_extract` 検索は **full scan** になる。Issue #1079 ではこれを (a) keyset cursor + LIMIT、(b) UUID v4 の sparse 性、(c) from/to・action 併用誘導 で走査範囲を bound する緩和策で釣り合わせた（AC-5 は「制限または index 方針の明記」のみ要求し、schema 変更自体は要求しない）。

本タスクは、将来 audit 行数が増え `json_extract` の full scan コストが運用問題として顕在化した場合に、別タスクとして index 化（schema 変更を伴う D1 migration）を検討するものである。YAGNI に従い、コストが実際に問題化するまで着手しない。

## 2. 目的（何を達成するか）

audit_log に batchId 抽出用の **generated column（STORED）** もしくは **`correlation_id` 列** を追加し、index を付与して、`GET /admin/audit` の batchId 検索を JSON 走査から index 列走査へ切り替える。既存行の backfill 方針も併せて確定する。

## 3. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | audit_log に batchId 相関キーを保持する列（generated column STORED もしくは correlation_id 列）が migration で追加されている |
| AC-2 | 追加列に index が付与され、`GET /admin/audit` の batchId 検索が index 列走査になる（EXPLAIN QUERY PLAN で full scan でないことを確認） |
| AC-3 | assign（after_json 由来）/ unassign（before_json 由来）双方の batchId が1列で拾える（例: `COALESCE(json_extract(after_json,'$.batchId'), json_extract(before_json,'$.batchId'))`） |
| AC-4 | 既存 audit 行の backfill 方針が確定し（generated column なら自動再計算、correlation_id 列なら backfill migration）、過去の bulk 操作も検索に乗る |
| AC-5 | `GET /admin/audit` の batchId フィルタの返却結果が切替前と同一であること（非退化・既存 contract test 緑） |
| AC-6 | migration のロールバック手順が用意されている |

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/auditLog.ts`（`listFiltered` の batchId 検索）、`apps/api/migrations/`（schema 変更）
- 症状: 親 #1036 の軽量方針で batchId が正規化列でなく `after_json` / `before_json` の JSON payload 内に埋まっているため、index が貼れず `json_extract` が full scan になる。assign は `after_json.$.batchId`、unassign は `before_json.$.batchId` という **非対称な埋め込み位置**のため、1 列に集約するには `COALESCE(json_extract(after_json,'$.batchId'), json_extract(before_json,'$.batchId'))` のように両側を畳み込む generated column が必要。
- 注意: SQLite/D1 の `GENERATED ALWAYS AS (...) STORED` 列は index 可能だが、`VIRTUAL` 列は D1 の制約で index 不可になり得る。STORED を第一候補とし、既存行への再計算（backfill）挙動を migration で確認すること。
- 参照: `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/outputs/phase-12/implementation-guide.md`, `apps/api/src/repository/auditLog.ts`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| generated column STORED の追加で既存行の再計算コスト / テーブルロックが発生する | 中 | 行数が問題化した規模で migration を計画し、メンテ枠で apply。ロールバック手順を用意する |
| `VIRTUAL` 列を選ぶと index が効かない | 中 | `STORED` を第一候補とし、EXPLAIN QUERY PLAN で index 走査を確認する |
| 親 #1036 の軽量 batchId 方針（schema 変更なし）と矛盾する | 中 | 本タスクは「full scan コストが運用問題化した時点」のトリガ付き別関心。トリガ未達なら起票のみで着手しない |
| backfill 漏れで過去 bulk 操作が検索に乗らない | 低 | generated column は自動再計算、correlation_id 列は backfill migration を AC-4 で必須化 |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/repository/__tests__/auditLog.repository.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts
```

期待: batchId フィルタの返却結果が切替前と同一（非退化）。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
# EXPLAIN QUERY PLAN で index 走査を確認
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production   # production runtime は user-gated
```

期待: API typecheck green。batchId 検索が full scan でない。

## スコープ

### 含む

- audit_log への batchId 相関列（generated column STORED / correlation_id 列）+ index 追加 migration
- 既存行 backfill 方針の確定
- `auditLog.ts` の batchId 検索を index 列走査へ切替（contract 非退化）
- migration ロールバック手順

### 含まない

- `GET /admin/audit` の query surface 変更（batchId param は #1079 で確定済み）
- bulk tag write 実装の変更
- production deploy、commit、push、PR 作成（user-gated）

## 参照

- `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/outputs/phase-12/unassigned-task-detection.md`（baseline B-1）
- `apps/api/src/repository/auditLog.ts`

> 本 Issue は Issue #1079 Phase 12 の未タスク検出（baseline B-1）から起票。GitHub Issue #1128。
