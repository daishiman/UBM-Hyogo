# Issue #1079 follow-up 002: 単一 tag write endpoint への batchId 相関キー付与

## メタ情報

```yaml
issue_number: 1129
task_id: task-issue-1079-followup-002-single-write-batchid-correlation
task_name: 単一 tag write endpoint への batchId 相関キー付与
category: 改善
target_feature: POST /admin/members/:memberId/tags / DELETE /admin/members/:memberId/tags/:tagId の audit payload
priority: 低
scale: 小規模
status: 未実施
source_phase: issue-1079 Phase 12 unassigned-task-detection B-2
created_date: 2026-06-03
dependencies: [issue-1079-bulk-tag-audit-batch-filter, issue-1036-bulk-member-tag-assign]
spec_path: docs/30-workflows/unassigned-task/task-issue-1079-followup-002-single-write-batchid-correlation.md
```

| 項目 | 内容 |
| --- | --- |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/` |
| 分類 | follow-up / audit correlation |
| 優先度 | 低 |
| 規模 | 小規模 |
| ステータス | 未実施 |

## 1. 概要（なぜこのタスクが必要か）

Issue #1036 の bulk tag write（`POST /admin/members/tags/bulk`）は、実 mutation した item 単位で `audit_log` に append し、`before_json`/`after_json` payload に `batchId`（UUID v4）を埋めて一括操作を相関する。Issue #1079 はこの batchId を `GET /admin/audit` から検索・表示できるようにした。

一方、単一 member の手動 tag 付与/解除（`POST /admin/members/:memberId/tags` / `DELETE /admin/members/:memberId/tags/:tagId`）の audit は現状 `after: { tagId, source }`（assign）等で **batchId を持たない**。このため bulk 操作は1つの batchId で相関閲覧できるが、単一 write 操作は相関キーを持たず一括フィルタに乗らない非対称が残っている。

本タスクは、「単一 write も一括相関に含めたい」という運用要求が顕在化した場合に、単一 write endpoint の audit payload にも相関キーを付与する別関心タスクである。write 側（#1036 非対象領域）の変更となる。

## 2. 目的（何を達成するか）

単一 tag write endpoint（`POST /admin/members/:memberId/tags` / `DELETE /admin/members/:memberId/tags/:tagId`）の audit payload に相関キー（batchId 相当）を付与し、`GET /admin/audit` の既存 batchId フィルタ（after/before OR 検索）でそのまま相関閲覧できるようにする。audit_log の schema 変更は伴わず、batchId は引き続き JSON payload に埋める軽量方針を維持する。

## 3. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | 単一 write の相関の「まとまり」（リクエスト単位 / 管理操作セッション単位）が定義され、付与方針が確定している |
| AC-2 | `POST /admin/members/:memberId/tags`（assign）の audit payload に相関キーが付与され、`GET /admin/audit` の batchId フィルタでヒットする |
| AC-3 | `DELETE /admin/members/:memberId/tags/:tagId`（unassign）の audit payload（before_json 側）に相関キーが付与され、batchId フィルタでヒットする |
| AC-4 | 単一 write の payload キー名・所在が bulk（#1036）と揃っており、`GET /admin/audit` の `json_extract` after/before OR 検索が改修なしでそのまま効く |
| AC-5 | state 変化時（実 mutation 時）のみ audit を残す既存挙動が維持され、noop は audit を残さない（非退化） |
| AC-6 | bulk の batchId 意味論（実 mutation した item のみ相関）と衝突しない |

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/routes/admin/` の単一 tag write ハンドラ、`apps/api/src/repository/memberTags.ts`（audit append）
- 症状: bulk（#1036）の batchId は「1 回の bulk リクエストで実 mutation した item 群」を束ねる意味論。単一 write に同じ batchId を付けると「まとまり」が曖昧（リクエスト単位なら 1 件しか相関しない／セッション単位なら横断定義が必要）になり、bulk の意味論と衝突しやすい。AC-1 で「まとまり」の定義を先に確定しないと、後段の payload 設計が振れる。
- 注意: payload キー名・JSON path（`$.batchId`）を bulk と完全一致させないと、`GET /admin/audit` の `json_extract(after_json,'$.batchId')` / `json_extract(before_json,'$.batchId')` OR 検索（#1079 で確定）に乗らない。assign は after_json、unassign は before_json という非対称配置も #1036 と揃える必要がある。
- 参照: `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/`, `apps/api/src/repository/memberTags.ts`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 単一 write の相関「まとまり」定義が曖昧で payload 設計が振れる | 中 | AC-1 で粒度（リクエスト単位 / セッション単位）を先に確定してから実装 |
| payload キー名 / JSON path が bulk とずれて batchId フィルタに乗らない | 中 | bulk（#1036）の payload 形・JSON path を contract test で固定し一致を検証 |
| bulk の batchId 意味論と衝突する | 中 | 単一 write 由来の相関キーは bulk と区別可能にし、AC-6 で衝突なしを検証 |
| 不変条件 #13 の 3 経路分離を崩す | 中 | 本タスクは (2) 単一 member 手動付与/解除の audit payload 拡張のみ。新 endpoint 追加・経路変更は禁止 |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/audit.contract.spec.ts
# 単一 write の audit payload に相関キーが付くこと、batchId フィルタでヒットすることを contract test で固定
```

期待: 単一 write assign/unassign の audit が batchId フィルタにヒットし、noop は audit を残さない。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

期待: API typecheck green。audit_log schema 変更は発生しない。

## スコープ

### 含む

- 単一 tag write（assign/unassign）の audit payload への相関キー付与
- 相関「まとまり」の定義（リクエスト単位 / セッション単位）
- contract test での batchId フィルタヒット検証

### 含まない

- `audit_log` schema 変更（JSON payload 軽量方針を維持）
- bulk tag write 実装（#1036）の変更
- `GET /admin/audit` の query surface 変更（#1079 で確定済み）
- production deploy、commit、push、PR 作成（user-gated）

## 参照

- `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/outputs/phase-12/unassigned-task-detection.md`（baseline B-2）
- `apps/api/src/repository/memberTags.ts`
- `apps/api/src/routes/admin/audit.contract.spec.ts`

> 本 Issue は Issue #1079 Phase 12 の未タスク検出（baseline B-2）から起票。GitHub Issue #1129。
