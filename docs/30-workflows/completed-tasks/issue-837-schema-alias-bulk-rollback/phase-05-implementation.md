# Phase 5: 実装計画

## メタ情報

| Key | Value |
| --- | --- |
| workflow | `issue-837-schema-alias-bulk-rollback` |
| 入力 | `phase-02-design.md` / `phase-04-test-creation.md` |
| 目的 | Phase 4 の Red テストを Green にする実装手順をファイル単位で明示する |
| 実装方針 | client-only 拡張。API/D1 変更なし。既存 `rollbackSchemaAlias` / `runWithConcurrency` を SSOT として再利用 |

---

## 変更対象ファイル一覧（FB-RT-03）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/lib/admin/api.ts` | **編集** | `SchemaAliasRollbackBulkRow` / `SchemaAliasRollbackBulkRowResult` / `SchemaAliasRollbackBulkOptions` 型 + `BULK_ROLLBACK_MAX_ROWS` 定数 + `rollbackSchemaAliasBulk` 関数を追加 |
| `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts` | **新規** | selection state machine + submit ロジックを内包する hook |
| `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx` | **新規** | bulk rollback confirm / progress / summary を表示する modal component |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | **編集** | HistoryPane に bulk rollback mode トグル / checkbox / select-all / 選択件数バッジ / 50件上限 alert を追加し、modal を条件 mount |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | **編集** | bulk rollback 仕様を追記（Phase 12 で実施） |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | **編集** | Phase 4 で追加した `rollbackSchemaAliasBulk` テストケース |
| `apps/web/src/components/admin/__tests__/SchemaDiffBulkRollbackModal.component.spec.tsx` | **新規** | Phase 4 で追加した modal unit test |
| `apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx` | **新規** | hook unit test（selection / openModal / all-success / partial failure） |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | **編集** | Phase 4 で追加した bulk rollback mode 回帰ケース |
| `playwright/tests/issue837-schema-bulk-rollback.spec.ts` | **新規** | Phase 11 で実行する E2E spec（Phase 4 で追加済み） |

**変更しないファイル**: `apps/api/src/routes/admin/schema.ts` / `apps/api/src/workflows/schemaAliasRollback.ts`（API/D1 不変条件1・2）/ `rollbackSchemaAlias`（既存単体 rollback client helper は改変しない）/ `useAdminMutation`。

---

## ステップバイステップ実装手順

### Step 1: `apps/web/src/lib/admin/api.ts` — helper 追加

**対象ファイル**: `apps/web/src/lib/admin/api.ts`

**追加する型・定数・関数のシグネチャ**（`phase-02-design.md` と一致）:

```typescript
// ===== Bulk Rollback =====

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
    kind: "version_mismatch" | "not_found" | "forbidden" | "network" | "other";
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
): Promise<{ results: SchemaAliasRollbackBulkRowResult[] }>
```

**入力**: `SchemaAliasRollbackBulkRow[]`（aliasId / version / reason?）と `SchemaAliasRollbackBulkOptions?`

**出力**: `Promise<{ results: SchemaAliasRollbackBulkRowResult[] }>`

**実装方針**:

1. `rows.length === 0` → `{ results: [] }` を即 return（fetch しない）。
2. `rows.length > BULK_ROLLBACK_MAX_ROWS` → `new RollbackApiError(0, "bulk_limit_exceeded", "rows exceed limit")` を throw。
3. `runWithConcurrency(rows, options?.concurrency ?? 8, async (row, index) => { ... })` で fan-out。
4. 各 row は `rollbackSchemaAlias({ aliasId: row.aliasId, version: row.version, reason: row.reason })` を try/catch で呼ぶ。
   - 成功時: `{ aliasId: row.aliasId, status: "success", data: result }`
   - `RollbackApiError` catch: `error.kind` を以下でマッピング
     - `.status === 409` → `"version_mismatch"`
     - `.status === 404` → `"not_found"`
     - `.status === 401 || .status === 403` → `"forbidden"`
     - `.status === 0` → `"network"`
     - その他 → `"other"`
   - 非 `RollbackApiError` catch: `kind: "network"`
5. 各 row の result 確定後に `options?.onRowResult?.(result, index)` を呼ぶ。
6. `runWithConcurrency` の結果をそのまま `{ results }` で返す（入力順保証は `runWithConcurrency` が担保）。

**副作用**: `rollbackSchemaAlias` による HTTP POST（`POST /api/admin/schema/aliases/:aliasId/rollback`）を row 数分実行。成功時は既存 single rollback endpoint が per-alias audit log を書き込む。

**エラーハンドリング**: row 単位で例外を `SchemaAliasRollbackBulkRowResult` に変換し、1 row の失敗が他 row の実行を中断しない。`rows.length > 50` は呼び出し側 UI で事前に抑止するが、helper も防御的に検証して throw する。

---

### Step 2: `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts` — hook 新規作成

**対象ファイル**: `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts`（新規）

**エクスポートするインタフェース・関数のシグネチャ**（`phase-02-design.md` と一致）:

```typescript
import type { rollbackSchemaAliasBulk as rollbackSchemaAliasBulkType } from "../../../lib/admin/api";
import type { ResolvedAliasItem } from "../SchemaDiffPanel";

export interface UseSchemaDiffBulkRollbackSelectionDeps {
  rollbackSchemaAliasBulk: typeof rollbackSchemaAliasBulkType;
  onRowsSucceeded: (aliasIds: string[]) => void;
}

export interface UseSchemaDiffBulkRollbackSelectionResult {
  selectedIds: ReadonlySet<string>;
  toggle: (aliasId: string) => void;
  selectAll: (ids: string[]) => void;
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

export function useSchemaDiffBulkRollbackSelection(
  deps: UseSchemaDiffBulkRollbackSelectionDeps,
): UseSchemaDiffBulkRollbackSelectionResult
```

**内部 state（`useState` で管理）**:

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [modalOpen, setModalOpen] = useState(false);
const [rows, setRows] = useState<BulkRollbackRowState[]>([]);
const [summary, setSummary] = useState<{ succeeded: string[]; failed: string[] } | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
```

**`submit` の実装方針**:

1. `isSubmitting=true` にし、現在の `rows` を `pending` にする。
2. `deps.rollbackSchemaAliasBulk(rows.map(({ aliasId, version }) => ({ aliasId, version })), { onRowResult })` を await。
3. `onRowResult` で該当 row の `submitStatus` / `errorMessage` を更新する。
4. 完了後、`succeeded/failed` を集計して `summary` を set する。
5. 成功分の aliasId を `selectedIds` から除去し、`rows` からも除外する。
6. 成功分が 1 件以上あれば `deps.onRowsSucceeded(succeededIds)` を呼ぶ。
7. 全成功なら modal を close。部分失敗/全失敗なら失敗 row だけを modal に残す。
8. **ロック解放**: try/catch/finally で `finally { setIsSubmitting(false); }` を保証し、例外が飛んでも送信中状態に固まらないようにする。

**上限判定**: `SchemaDiffPanel` が `bulkRollback.selectedCount > BULK_LIMIT` で導出する。helper 側も `BULK_ROLLBACK_MAX_ROWS` で防御的に throw する。

---

### Step 3: `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx` — modal 新規作成

**対象ファイル**: `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx`（新規）

**props シグネチャ**（`phase-02-design.md` と一致）:

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

**表示要素と実装方針**:

1. `role="dialog"` / `aria-modal="true"` / `aria-labelledby="bulk-rollback-modal-title"` を root 要素に付与。
2. focus trap は既存 `SchemaDiffBulkResolveModal` の実装パターンを踏襲する（`Modal` primitive または同等の focus trap 実装を再利用）。
3. `isSubmitting` 中の close は無視し、submit / cancel button を disabled にする。
4. 選択 alias 一覧: `rows.map(row => ...)` で aliasLabel / stableKey / resolvedAt を行表示。各行に `submitStatus` に応じてバッジを表示（idle/pending/success/error）。
5. aggregate 影響件数: `rows.reduce((acc, row) => acc + (row.impact?.affectedResponseCount ?? 0), 0)` を表示。`rows` の中に `recomputeRequired === true` が 1件でもあれば再集計推奨テキストを表示（再集計実行は本タスク外）。
6. summary バナー: `data-role="bulk-rollback-summary"` 付き要素に `成功 N 件 / 失敗 M 件` を表示し、`data-summary-kind` で `all-success` / `partial` / `all-failed` を区別する。
7. partial failure 後は hook が成功 row を除外し、失敗 row だけを modal に残す。同じ「一括で取り消す」ボタンを再押下すると失敗分のみ再実行する。

**design token 遵守**: 色は OKLch token（CSS custom property）のみ使用。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（不変条件3・`verify-design-tokens` gate）。

---

### Step 4: `apps/web/src/components/admin/SchemaDiffPanel.tsx` — HistoryPane 統合

**対象ファイル**: `apps/web/src/components/admin/SchemaDiffPanel.tsx`（編集）

**追加する state / props**:

```typescript
// SchemaDiffPanel 内部 state
const [bulkRollbackMode, setBulkRollbackMode] = useState(false);

// useSchemaDiffBulkRollbackSelection の接続
const bulkRollback = useSchemaDiffBulkRollbackSelection({
  rollbackSchemaAliasBulk,
  onRowsSucceeded: (aliasIds) => {
    setHistoryAliases((prev) => prev.filter((alias) => !aliasIds.includes(alias.id)));
    router.refresh();
  },
});
```

**HistoryPane への追加要素**:

1. **「Bulk Rollback」トグルボタン**: `aria-pressed={bulkRollbackMode}` 付き。OFF → ON 時に `bulkRollback.clearSelection()` を呼ぶ（誤選択リセット）。
2. **bulk rollback mode ON 時のみ表示**:
   - select-all checkbox（aria-label 付き）: click で `bulkRollback.selectAll(historyAliasIds)` を呼ぶ。
   - 選択件数バッジ: `bulkRollback.selectedCount` 件選択中。
   - 50件超 alert: `bulkRollback.selectedCount > BULK_LIMIT` の時に表示。
   - 「一括取消」ボタン: `disabled={bulkRollback.selectedCount === 0 || bulkRollback.selectedCount > BULK_LIMIT}`.
3. **HistoryPane 各行**: `bulkRollbackMode === true` の時のみ checkbox を表示。`aria-label` を付与。`checked={bulkRollback.selectedIds.has(alias.id)}`、onChange で `bulkRollback.toggle(alias.id)`。
4. **bulk rollback mode OFF 時**: 現行の行ごと単体 rollback ボタン UI を維持（回帰なし）。
5. **`SchemaDiffBulkRollbackModal` の条件 mount**:
   - `bulkRollbackMode === true && bulkRollback.selectedCount > 0` で modal を表示できる状態にする。
   - `onConfirm`: `bulkRollback.openModal(selectedRows)` を呼ぶ（`selectedRows` は `historyAliases.filter(a => bulkRollback.selectedIds.has(a.id))`）。
   - `onClose`: `bulkRollback.closeModal()` を呼ぶ（`isSubmitting` 中は hook / modal が無視）。
   - `onSubmit`: `bulkRollback.submit()` を呼ぶ。partial failure 後は hook が失敗 row だけを保持するため再押下で失敗分のみ実行される。
6. **成功 alias の履歴除去**: `onRowsSucceeded` で成功 aliasId を `historyAliases` state から除去し、`router.refresh()` でサーバー状態と同期する。

**bulk rollback mode と bulk resolve mode の非干渉**: 表示領域と selection state を分離し、互いの選択状態を共有しない。rollback の成功時は HistoryPane 側だけを更新する。

---

### Step 5: `docs/00-getting-started-manual/specs/11-admin-management.md` — spec doc 追記

**実施タイミング**: Phase 12（実装ガイド）で行う。本 Phase では対象ファイルを**変更しない**。Phase 12 の outputs/phase-12/implementation-guide.md で追記内容を確定させる。

追記予定セクション:
- 管理画面 > Schema 管理 > Alias 一括 Rollback
- 操作フロー（bulk rollback mode ON → 選択 → confirm → 成功/部分失敗/全失敗の画面状態）
- 50件上限・楽観ロック仕様
- per-alias audit log 経路

---

### Step 6: 品質検証

実装完了後に以下のコマンドを順番に実行し、全て pass することを確認する。

```bash
# 依存インストール
mise exec -- pnpm install --force

# 型チェック
mise exec -- pnpm typecheck

# リント（自動修正可能なものは --fix で処理）
mise exec -- pnpm lint

# ビルド（Next.js webpack build / Workers 互換）
mise exec -- pnpm --filter @ubm-hyogo/web build

# 単体テスト（Issue #837 focused）
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffBulkRollbackModal.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx

# design token 違反チェック
mise exec -- pnpm verify:design-tokens
```

---

## ロック変数（`isSubmitting`）解放経路テーブル（STATE-DETAIL-01）

| 経路 | `isSubmitting` 遷移 | `selectedIds` 変化 | `summary` 変化 |
| --- | --- | --- | --- |
| 正常完了（全成功） | `true` → `false` | 全 aliasId を除去 | `{succeeded:[...],failed:[]}` |
| 部分成功（一部 error） | `true` → `false` | 成功分のみ除去、失敗分は残留 | `{succeeded:[...],failed:[...]}` |
| 全失敗（全件 error） | `true` → `false` | 変化なし（全残留） | `{succeeded:[],failed:[...]}` |
| 例外 throw（unexpected） | `true` → `false`（finally で保証） | 変化なし | 全 row を `failed` 扱い |
| modal close（`onClose`） | `false` の時だけ close | 変化なし | null にリセット |
| bulk rollback mode OFF | 変化なし | `clearSelection()` | null にリセット |

> **`isSubmitting=true` に固まる経路を残してはならない。** `submit` 関数の実装は必ず `finally { setIsSubmitting(false) }` を含めること。

---

## DoD（Definition of Done）

- [ ] `pnpm typecheck` が green（型エラー 0）
- [ ] `pnpm lint` が green（lint エラー 0）
- [ ] `pnpm --filter @ubm-hyogo/web build` が green（webpack build 成功）
- [ ] Phase 4 で追加した全 spec テスト（RBLK-01〜08 / MOD-01〜14 / HOOK-01〜13 / PANEL-BR-01〜07）が green
- [ ] `pnpm verify:design-tokens` が green（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 違反 0）
- [ ] 既存 single rollback / undo 経路の spec テストが回帰なし
- [ ] 既存 bulk resolve 経路の spec テストが回帰なし
- [ ] AC-1〜9 を充足していること（`phase-01-requirements.md` 参照）:
  - AC-1: bulk rollback mode で複数選択 → confirm → 一括取消 ✓
  - AC-2: 1件 version_mismatch 時、成功分確定・失敗分のみ残留 ✓
  - AC-3: per-alias audit log（既存 single rollback endpoint が emit）✓
  - AC-4: 全成功/部分成功/全失敗の区別表示 ✓
  - AC-5: 50件超で confirm 抑止 ✓
  - AC-6: 既存 single rollback / bulk resolve 回帰なし ✓
  - AC-7: 楽観ロック検証 SSOT（`rollbackSchemaAlias` を再利用）✓
  - AC-8: spec test が partial failure / all-fail / all-success / 50件上限シナリオを green ✓
  - AC-9: design token 違反 0 ✓

---

## ローカル検証コマンド一覧

```bash
# typecheck
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# build
mise exec -- pnpm --filter @ubm-hyogo/web build

# unit test（issue-837 関連のみ絞り込み）
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkRollbackSelection.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffBulkRollbackModal.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx

# unit test（web 全体）
mise exec -- pnpm --filter @ubm-hyogo/web test

# design token 検証
mise exec -- pnpm verify:design-tokens
```

---

## 参照

- `phase-02-design.md`: 型シグネチャ・error.kind マッピング・state 引き渡しテーブル・ロック解放経路の正本
- `phase-04-test-creation.md`: テストケース表（全 Green になることが実装完了の判定基準）
- `apps/web/src/lib/admin/api.ts`: 既存 `rollbackSchemaAlias` / `RollbackApiError` / `runWithConcurrency` / `postSchemaAliasBulk`（実装の参照元）
- `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx`（modal 構造・focus trap・a11y パターンの参照元）
- `apps/web/src/components/admin/hooks/useSchemaDiffBulkSelection.ts`（hook 構造・submit state machine の参照元）
