# Phase 2: Design

## メタ情報
- workflow: issue-837-schema-alias-bulk-rollback
- 入力: `phase-01-requirements.md`
- 設計方針: 既存コンポーネント再利用優先（FB-SDK-07-1）。bulk resolve（#776）の client-side bounded fan-out 構造を rollback 用に複製し、API/D1 変更を回避する。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 既存資産 | 再利用方法 |
| --- | --- |
| `rollbackSchemaAlias(input)`（api.ts） | bulk helper の per-row 呼び出しでそのまま再利用。改変しない |
| `RollbackApiError`（api.ts） | per-row error 分類で再利用 |
| `runWithConcurrency<T,R>`（api.ts 内 private） | bulk rollback でも再利用。**export して** bulk resolve / bulk rollback 両方が参照する形に SSOT 化（または同ファイル内 private のまま両 helper から参照）。Phase 8 で重複定義が生じないことを確認 |
| `ResolvedAliasItem`（SchemaDiffPanel.tsx） | bulk rollback 選択対象の型としてそのまま使用（`id` / `version` / `aliasLabel` / `stableKey` / `resolvedAt` / `impact` を保持済み） |
| `useSchemaDiffBulkSelection`（hook） | rollback 用 hook の設計テンプレート。selection state machine を踏襲 |
| `SchemaDiffBulkResolveModal`（modal） | rollback modal の a11y（focus trap / Escape / role=dialog）テンプレート |
| `RollbackConfirmModal`（SchemaDiffPanel.tsx 内） | 影響件数 / 再集計警告の表示パターンを踏襲 |

## データフロー

```
HistoryPane (bulk rollback mode ON)
  ├─ 行 checkbox 選択 → useSchemaDiffBulkRollbackSelection (selection Set<aliasId>)
  ├─ 選択件数バッジ / select-all
  └─ 「一括取消」ボタン → SchemaDiffBulkRollbackModal を mount
        ├─ 選択 alias 一覧 + aggregate 影響件数表示
        ├─ confirm 押下 → rollbackSchemaAliasBulk(rows, { onRowResult })
        │     └─ runWithConcurrency(rows, 8, row => rollbackSchemaAlias({ aliasId, version, reason }))
        │           ├─ 成功 → SchemaAliasRollbackBulkRowResult { status: "success", data }
        │           ├─ 409 → { status: "error", error.kind: "version_mismatch" }
        │           ├─ 404 → { status: "error", error.kind: "not_found" }
        │           ├─ status 0 → { status: "error", error.kind: "network" }
        │           └─ other → { status: "error", error.kind: "other" }
        ├─ onRowResult ごとに per-row 進捗 UI 更新
        └─ 完了時 aggregate（全成功/部分成功/全失敗）表示
              ├─ 全成功 → modal close + router.refresh()
              └─ 部分/全失敗 → 失敗 row のみ残し再 submit 導線
```

> **transaction 境界（AC-2）**: 全件 atomic は web 層から D1 binding 横断 transaction を張れず不可能なため採用しない。**per-alias 独立 commit**（各 `rollbackSchemaAlias` が単体 endpoint の D1 batch を atomic 実行）を fan-out で積み上げる。1 件 mismatch が他の成功を巻き戻さない。

## API 契約（client helper — 新 endpoint なし）

### `apps/web/src/lib/admin/api.ts` 追加分

```typescript
export interface SchemaAliasRollbackBulkRow {
  aliasId: string;
  version: number;
  reason?: string;       // 任意。未指定可
}

export interface SchemaAliasRollbackBulkRowResult {
  aliasId: string;
  status: "success" | "error";
  data?: RollbackSchemaAliasResult;
  error?: {
    kind: "version_mismatch" | "not_found" | "network" | "other";
    message: string;
    httpStatus?: number;
  };
}

export interface SchemaAliasRollbackBulkOptions {
  onRowResult?: (result: SchemaAliasRollbackBulkRowResult, index: number) => void;
  concurrency?: number; // 既定 8
}

export const BULK_ROLLBACK_MAX_ROWS = 50;

export async function rollbackSchemaAliasBulk(
  rows: ReadonlyArray<SchemaAliasRollbackBulkRow>,
  options?: SchemaAliasRollbackBulkOptions,
): Promise<{ results: SchemaAliasRollbackBulkRowResult[] }>;
```

実装方針:
- `rows.length === 0` → `{ results: [] }`。
- `rows.length > BULK_ROLLBACK_MAX_ROWS` → `RollbackApiError(0, "bulk_limit_exceeded", ...)` を throw（呼び出し側 UI は事前に FR-10 で抑止するが、helper も防御的に検証）。
- `runWithConcurrency(rows, options?.concurrency ?? 8, fn)` で fan-out。
- 各 row は `rollbackSchemaAlias({ aliasId, version, reason })` を呼び、成功は `status: "success"`、`RollbackApiError` は `error.kind` を `status` から分類:
  - 409 → `version_mismatch`
  - 404 → `not_found`
  - 0 → `network`
  - その他 → `other`
- `options.onRowResult?.(result, index)` を各完了で呼ぶ。

### error.kind マッピング（既存 RollbackApiError.status 準拠）

| HTTP status | server error code（schema.ts） | bulk row error.kind |
| --- | --- | --- |
| 409 | `version_mismatch` | `version_mismatch` |
| 404 | `not_found` / `already_deleted` | `not_found` |
| 401 / 403 | `unauthorized` / `forbidden` | `forbidden` |
| 0 | `network_error` | `network` |
| 400 / 500 / その他 | `bad_request` / `batch_failed` 等 | `other` |

## UI 設計

### 新規 hook: `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts`

```typescript
export interface UseSchemaDiffBulkRollbackSelectionDeps {
  rollbackSchemaAliasBulk: typeof import("@/lib/admin/api").rollbackSchemaAliasBulk;
  onRowsSucceeded: (aliasIds: string[]) => void;
}

export interface UseSchemaDiffBulkRollbackSelectionResult {
  selectedIds: ReadonlySet<string>;
  toggle: (aliasId: string) => void;
  selectAll: (aliasIds: readonly string[]) => void;
  clearSelection: () => void;
  selectedCount: number;
  modalOpen: boolean;
  rows: BulkRollbackRowState[];
  summary: { succeeded: string[]; failed: string[] } | null;
  isSubmitting: boolean;
  openModal: (aliases: ReadonlyArray<ResolvedAliasItem>) => void;
  closeModal: () => void;
  submit: () => Promise<{ succeeded: string[]; failed: string[] }>;
}
```

- selection は `Set<aliasId>`。`toggle` / `selectAll` / `clearSelection`。
- `openModal` は選択済み `ResolvedAliasItem` を `BulkRollbackRowState` に変換する。
- `submit` は `rollbackSchemaAliasBulk` を呼び、`onRowResult` で `rows[].submitStatus` を更新、完了で `summary` を集計する。成功 row は `rows` / `selectedIds` から除去し、成功分があれば `onRowsSucceeded(aliasIds)` を呼ぶ。全成功なら modal close、部分失敗なら失敗 row だけを残す。
- state ownership: selection / submit 進捗は hook が所有。modal は表示のみ。**ロック変数解放経路（正常/エラー/全失敗）すべてで `isSubmitting` を `false` に戻す**（STATE-DETAIL-01）。

### 新規 component: `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx`

props:

```typescript
interface SchemaDiffBulkRollbackModalProps {
  readonly open: boolean;
  readonly rows: BulkRollbackRowState[];
  readonly summary: { succeeded: string[]; failed: string[] } | null;
  readonly isSubmitting: boolean;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
```

表示要素:
- `role="dialog"` / `aria-modal="true"` / `aria-labelledby` / focus trap / Escape close（既存 modal と同パターン）。
- 選択 alias 一覧（aliasLabel / stableKey / resolvedAt / per-row status バッジ idle|pending|success|error）。
- aggregate 影響件数（`rows` の `impact.affectedResponseCount` 合計）と再集計推奨警告（`recomputeRequired` が 1 件でも true なら表示。再集計実行は本タスク外）。
- summary バナー: 全成功 / 部分成功 / 全失敗を `data-role="bulk-rollback-summary"` と `data-summary-kind` で区別。
- 失敗 row が残る場合、hook が成功 row を除外するため同じ submit ボタンの再押下で失敗分のみ再実行する。

### `SchemaDiffPanel.tsx` 変更

- `HistoryPane` props に bulk rollback mode 用を追加（`bulkRollbackMode`, `selection`, `onToggle`, `onSelectAll`）。OFF 時は現行 UI 維持。
- HistoryPane 行に bulk mode 時のみ checkbox を表示（`aria-label` 付き）。
- HistoryPane 見出し付近に「Bulk Rollback」トグルボタン（`aria-pressed`）、選択件数バッジ、select-all、「一括取消」ボタン、50 件超 alert を追加。
- `useSchemaDiffBulkRollbackSelection` を呼び、`SchemaDiffBulkRollbackModal` を条件 mount。
- bulk rollback 成功 alias は `historyAliases` から除去（既存 `setHistoryAliases` 経路を再利用）。

## ステップ間 state 引き渡しテーブル（modal ↔ panel ↔ hook）

| state | owner | 引き渡し |
| --- | --- | --- |
| `selectedIds` | `useSchemaDiffBulkRollbackSelection` | panel が hook から受け取り HistoryPane に checkbox 状態として渡す |
| `bulkRollbackMode` | `SchemaDiffPanel`（useState） | OFF→ON 切替で selection を `clearSelection()` |
| `rows` / `isSubmitting` / `summary` | hook | modal に props で渡す |
| `historyAliases` | `SchemaDiffPanel`（既存 state） | 成功 alias を除去 |

## エラーハンドリング / ロック解放経路（STATE-DETAIL-01）

| 経路 | `isSubmitting` 遷移 | selection |
| --- | --- | --- |
| 正常完了（全成功） | `true` → `false` | 成功分を除去 + modal close |
| 部分成功 | `true` → `false` | 成功分のみ selection から除去、失敗分は残す |
| 全失敗 | `true` → `false` | selection 維持（再 submit 用） |
| modal close | `false` の時だけ close | mode 維持 / selection 任意 |

## 設計成果物チェック

- [ ] client helper シグネチャ確定（`rollbackSchemaAliasBulk` / 3 型 / 定数）
- [ ] error.kind マッピング表確定
- [ ] hook / modal / panel の責務分離確定
- [ ] 全件 atomic を採用しない理由明記（per-alias 独立 commit）
- [ ] 既存 `runWithConcurrency` の SSOT 方針確定（重複定義禁止）
- [ ] a11y / design token 制約を Phase 9 gate に引き継ぎ
