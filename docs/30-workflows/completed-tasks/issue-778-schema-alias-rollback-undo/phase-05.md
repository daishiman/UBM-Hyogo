# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 5 / 13 |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | spec_created |

## 目的

T-01〜T-15 を実装シーケンスに整列し、変更対象ファイル一覧と関数シグネチャを確定する。

## 変更対象ファイル一覧（CONST_005 必須項目）

| パス | 種別 | 変更概要 |
| --- | --- | --- |
| apps/api/migrations/0019_schema_alias_soft_delete.sql | 新規 | soft delete 列 + version + index 再作成 |
| apps/api/src/workflows/schemaAliasRollback.ts | 新規 | rollback workflow (batch transaction) |
| apps/api/src/routes/admin/schema.ts | 編集 | rollback endpoint 追加 |
| apps/api/src/repository/schemaAliases.ts | 新規/編集 | `softDeleteById` / `getById` / `findActiveByStableKey` |
| apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts | 新規 | endpoint spec |
| apps/web/src/lib/admin/api.ts | 編集 | `rollbackSchemaAlias` helper |
| apps/web/src/components/admin/SchemaDiffPanel.tsx | 編集 | HistoryPane / modal / undo toast |
| apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx | 編集 | rollback / undo ケース |
| docs/00-getting-started-manual/specs/11-admin-management.md | 編集 | rollback / undo 操作仕様追記 |
| docs/00-getting-started-manual/specs/01-api-schema.md | 編集 | endpoint 追記 |
| docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md | 既存参照 | 分離 followup（重複新規作成禁止） |
| docs/30-workflows/unassigned-task/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md | 新規 | 分離 followup |
| docs/30-workflows/unassigned-task/serial-05-step-03-followup-006-schema-alias-bulk-rollback.md | 新規 | 分離 followup |
| docs/30-workflows/unassigned-task/serial-05-step-03-followup-007-schema-alias-rollback-notification.md | 新規 | 分離 followup |
| docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md | 編集 | `consumed_via_issue_778_rollback_undo_spec` 同期 |

## 関数シグネチャ

### API workflow

```ts
// apps/api/src/workflows/schemaAliasRollback.ts
export interface SchemaAliasRollbackInput {
  aliasId: string;
  expectedVersion: number;
  actor: AdminEmail;
  reason?: string;
}

export interface SchemaAliasRollbackResult {
  aliasId: string;
  rolledBackAt: string;
  relatedAuditId: string;
  newVersion: number;
  impact: {
    affectedResponseCount: number;
    recomputeRequired: boolean;
  };
}

export class SchemaAliasRollbackFailure extends Error {
  constructor(
    public readonly kind: "not_found" | "already_deleted" | "version_mismatch" | "batch_failed",
    message: string,
  ) {
    super(message);
  }
}

export async function schemaAliasRollback(
  db: D1Database,
  input: SchemaAliasRollbackInput,
): Promise<SchemaAliasRollbackResult>;
```

### Repository

```ts
// apps/api/src/repository/schemaAliases.ts
export interface SchemaAliasRow {
  id: string;
  revisionId: string;
  stableKey: string;
  aliasQuestionId: string;
  version: number;
  deletedAt: string | null;
  deletedBy: string | null;
}

export async function getById(db: D1Database, id: string): Promise<SchemaAliasRow | null>;
export function buildSoftDeleteStatement(
  db: D1Database,
  input: { id: string; expectedVersion: number; actor: string; now: string },
): D1PreparedStatement;
```

### Web helper

```ts
// apps/web/src/lib/admin/api.ts
export interface RollbackSchemaAliasInput {
  aliasId: string;
  version: number;
  reason?: string;
}

export interface RollbackSchemaAliasResult {
  aliasId: string;
  rolledBackAt: string;
  relatedAuditId: string;
  newVersion: number;
  impact: { affectedResponseCount: number; recomputeRequired: boolean };
}

export async function rollbackSchemaAlias(
  input: RollbackSchemaAliasInput,
): Promise<RollbackSchemaAliasResult>;
```

### UI

```ts
// apps/web/src/components/admin/SchemaDiffPanel.tsx 内
type RollbackModalState =
  | { kind: "idle" }
  | { kind: "confirm"; alias: ResolvedAlias }
  | { kind: "calling"; alias: ResolvedAlias }
  | { kind: "error"; alias: ResolvedAlias; message: string };

type UndoState =
  | { kind: "hidden" }
  | { kind: "available"; alias: ResolvedAlias; expiresAt: number };
```

## 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `schemaAliasRollback` | `SchemaAliasRollbackInput` | `SchemaAliasRollbackResult` | `schema_aliases` 行 soft delete / `schema_diff_queue.status` 戻し / `audit_log` 行追加 |
| `rollbackSchemaAlias` | `RollbackSchemaAliasInput` | `RollbackSchemaAliasResult` | HTTP POST |
| SchemaDiffPanel | resolved alias 一覧 | DOM | UI 状態遷移 |

## エラーハンドリング

| エラー | API status | UI 挙動 |
| --- | --- | --- |
| version_mismatch | 409 | modal: "他の管理者が変更済。再読込してください" + reload ボタン |
| not_found / already_deleted | 404 | toast: "既に取消済です" + list 更新 |
| batch_failed | 500 | modal: "取消失敗。時間をおいて再試行" |
| network error | - | toast: "通信エラー" |

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test -- schema.rollback
mise exec -- pnpm --filter @ubm/web test -- SchemaDiffPanel
mise exec -- pnpm build
```

migration ローカル検証:
```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --local
bash scripts/cf.sh d1 execute ubm-hyogo-db --local --command "PRAGMA table_info(schema_aliases);"
```

## DoD (Definition of Done)

- [ ] migration 0019 が local d1 で apply 成功
- [ ] `pnpm typecheck && pnpm lint && pnpm build` 全 pass
- [ ] api / web 双方の spec が pass
- [ ] grep gate（`rg "FROM schema_aliases" apps/api/src` で `deleted_at` 漏れ 0）
- [ ] OKLch token のみ使用（`bg-[#` / `text-[#` の新規追加 0）
- [ ] `bash scripts/verify-pr-ready.sh` pass

## 完了条件

- [x] 変更対象ファイル一覧確定（CONST_005-1）
- [x] 関数シグネチャ定義（CONST_005-2）
- [x] 入出力・副作用定義（CONST_005-3）
- [x] テスト方針提示（Phase 07 で詳細化）（CONST_005-4）
- [x] 実行コマンド記述（CONST_005-5）
- [x] DoD 明記（CONST_005-6）

## 次 Phase

- 次: 6（実装手順）
