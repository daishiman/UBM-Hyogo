# Phase 1: 要件定義

`[実装区分: 実装仕様書]`

## 1. 入力

- Issue #362 body（タスク指示書）
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/routes/admin/schema.ts`（POST `/schema/aliases` 200/202 contract）
- `apps/api/src/workflows/schemaAliasAssign.ts`（`BackfillResult` retryable union）
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`（現行 UI）
- `apps/web/src/lib/admin/api.ts`（API client）

## 2. 確定事項

### 2.1 taskType / visualEvidence

- `taskType: implementation`（CONST_004 判定根拠は `index.md` に記載）
- `visualEvidence: VISUAL_ON_EXECUTION`（admin UI の表示変更を伴う。focused component evidence は取得済み、manual screenshot は Phase 11 deferred evidence に残す）
- `docsOnly: false`

### 2.2 機能要件

| FR-ID | 要件 |
| --- | --- |
| FR-1 | 管理 UI が POST `/api/admin/schema/aliases` の HTTP 202 + `code='backfill_cpu_budget_exhausted'` + `retryable=true` + `backfill.status='exhausted'` を retryable continuation として識別する |
| FR-2 | retryable continuation 時は通常成功とも通常エラーとも区別される label / status message を表示する |
| FR-3 | retryable continuation 時に運用者が同じ alias 確定 form を再送信して back-fill を続きから再開できる導線が表示される |
| FR-4 | 通常成功（200 / `confirmed=true` / `backfill.status='completed' or 'running'`）は従来どおりの toast を表示する |
| FR-5 | validation error（422）と conflict error（409）は引き続きエラー表示として区別される |

### 2.3 非機能要件

| NFR-ID | 要件 |
| --- | --- |
| NFR-1 | API contract（routes / workflow / repository / D1）を変更しない |
| NFR-2 | 不変条件 #5（D1 アクセスは `apps/api` 限定）を維持 |
| NFR-3 | 表示分岐ロジックは ad-hoc string 比較の散らばりを避け、`apps/web/src/lib/admin/api.ts` の typed helper / narrowing predicate に集約する |
| NFR-4 | 表示文言は短く（label 30 字以内、補助説明 80 字以内目安） |
| NFR-5 | 既存 component test の regress ゼロ |

### 2.4 入力 / 出力

- 入力: `postSchemaAlias({ diffId, questionId, stableKey })` の戻り値（既存 `AdminMutationResult` を拡張）
- 出力: `SchemaDiffPanel` の表示状態（success / validation error / conflict error / retryable continuation）

## 3. 完了条件

- [ ] `artifacts.json.metadata.taskType=implementation` / `visualEvidence=VISUAL` が確定
- [ ] FR-1〜FR-5 / NFR-1〜NFR-5 が表で列挙されている
- [ ] 参照 API contract の line range が特定済み（`schema.ts` 196-241、`schemaAliasAssign.ts` 47-55）

## 4. 出力

- 本ファイルの確定値
- `artifacts.json.metadata` 更新（既に作成済み）
