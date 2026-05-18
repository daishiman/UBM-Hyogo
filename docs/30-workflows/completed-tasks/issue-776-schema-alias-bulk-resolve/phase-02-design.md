# Phase 2: Design

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
Phase 1 要件を満たす UI / state / API contract / コンポーネント分割を設計する。

## 設計判断 1: bulk endpoint 新設 vs client-side fan-out

| 案 | Pros | Cons | 採否 |
| --- | --- | --- | --- |
| A. `POST /admin/schema/aliases:batch` 新設 (D1 transaction) | 1 HTTP 往復、atomic | API 契約変更、D1 transaction 境界判断、複雑度↑ | **却下** |
| B. `POST /admin/schema/aliases:batch` 新設 (per-row commit + result array) | 部分成功許容、shape `{ results: [{diffId, status, error?}] }` | API 契約変更、サーバ実装追加 | 却下（範囲拡大） |
| **C. client-side bounded fan-out（既存 `postSchemaAlias` を loop）** | **API 変更なし / 既存 endpoint 維持（CLAUDE.md 不変条件1）/ 1 サイクル完了原則 (CONST_007) 適合 / 部分成功も結果集計で表現可 / row-level progress を自然に更新可** | **N HTTP 往復のコスト** | **採用** |

採用根拠:
- CLAUDE.md 不変条件「既存 API endpoint surface のみ使用」を維持
- CONST_007「1 サイクル完了原則」優先（API 契約変更は範囲爆発を招く）
- 30 件規模では Workers の rate limit / D1 binding 負荷を Phase 9 で実測し、bottleneck 判明時のみ次サイクルで endpoint 新設を検討

## 設計判断 2: state 管理（単一 reducer vs 専用 sub-component）

採用: **bulk 専用 sub-component に分離** + `SchemaDiffPanel` から props で連携。

理由:
- 既存 single inline edit state は `SchemaDiffPanel` 内 useState で十分簡素
- bulk selection / batch modal / submit progress は state shape が複雑（Set<diffId>, Map<diffId, stableKey>, Map<diffId, submitStatus>）
- 単一 reducer に統合すると `SchemaDiffPanel` が肥大化（既存 261 行 → 推定 500 行超）

## コンポーネント構造

```
apps/web/src/components/admin/
├── SchemaDiffPanel.tsx                  # 既存（最小拡張: bulk mode toggle + checkbox 描画 hook 経由）
├── SchemaDiffBulkResolveModal.tsx       # 新規: batch confirm modal
└── hooks/
    └── useSchemaDiffBulkSelection.ts    # 新規: 選択状態と submit ロジックを内包
```

## hook シグネチャ

```ts
// apps/web/src/components/admin/hooks/useSchemaDiffBulkSelection.ts
export type BulkSubmitStatus = "idle" | "pending" | "success" | "retryable" | "error";

export interface BulkRowState {
  diffId: string;
  questionId: string;
  category: "unresolved" | "changed";
  suggestedStableKey: string | null;
  stableKey: string;            // editable
  submitStatus: BulkSubmitStatus | "idle";
  errorMessage?: string;        // 409 / 422 等
}

export interface UseSchemaDiffBulkSelectionResult {
  selectedIds: ReadonlySet<string>;
  toggle(diffId: string): void;
  selectAllInCategory(category: "unresolved" | "changed", ids: string[]): void;
  clearSelection(): void;
  breakdown: { unresolved: number; changed: number; total: number };
  // modal lifecycle
  modalOpen: boolean;
  openModal(rows: BulkRowState[]): void;
  closeModal(): void;
  rows: BulkRowState[];
  updateRowStableKey(diffId: string, stableKey: string): void;
  applySuggestion(diffId: string): void;
  // submit
  submit(): Promise<{ succeeded: string[]; retryable: string[]; failed: string[] }>;
  isSubmitting: boolean;
}

export function useSchemaDiffBulkSelection(deps: {
  postSchemaAlias: typeof postSchemaAlias;
  onAllSucceeded: () => void;     // refetch trigger
}): UseSchemaDiffBulkSelectionResult;
```

## API helper シグネチャ

```ts
// apps/web/src/lib/admin/api.ts に追加
export interface SchemaAliasBulkRowResult {
  diffId: string;
  questionId: string;
  status: "success" | "retryable" | "error";
  data?: SchemaAliasApplyBody;
  error?: { kind: "conflict" | "invalid" | "retryable" | "network" | "other"; message: string; httpStatus?: number };
}

export const postSchemaAliasBulk = async (
  rows: ReadonlyArray<{ diffId: string; questionId: string; stableKey: string }>,
): Promise<{ results: SchemaAliasBulkRowResult[] }> => {
  const results = await runWithConcurrency(rows, 8, async (r) => {
    const result = await postSchemaAlias({
      diffId: r.diffId,
      questionId: r.questionId,
      stableKey: r.stableKey,
    });
    // map 200 / 202 retryable / 409 / 422 / throw to row result
  });
  // aggregate to SchemaAliasBulkRowResult[] in input order
};
```

不変条件: 既存 `postSchemaAlias` は変更しない。`postSchemaAliasBulk` は薄い fan-out wrapper として共存。

## UI / UX 設計

- `SchemaDiffPanel` 上部に「Bulk Resolve」トグル button（OKLch primary）を追加
- トグル ON で `unresolved` / `changed` 行に checkbox 描画（resolve 不可カテゴリには非表示）
- カテゴリヘッダに `unresolved 全選択` / `changed 全選択` checkbox
- 選択件数バッジ: `12 件選択中（unresolved 8 / changed 4）`
- `Bulk Resolve` 確定ボタン押下 → `SchemaDiffBulkResolveModal` 表示
- modal:
  - 各行: `questionId` / `currentText` / `suggestedStableKey` / stableKey input / [推奨採用] button
  - 共通操作: [全行に推奨を適用]
  - 確定後: 各行 status badge (`pending` spinner / `success` / `retryable` / `error` + reason)
  - 部分失敗時: `retryable` / `error` 行のみ残し再 submit 可。`202 backfill_cpu_budget_exhausted` は失敗扱いにせず、再開可能行として残す。

## a11y 設計

- checkbox: `aria-label="select diff {questionId}"`
- modal: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + initial focus を最初の stableKey input に設定 + focus trap + Esc で close
- submit progress: `role="status"` + `aria-live="polite"` で件数を読み上げ
- error badge: `role="alert"` (aria-live="assertive")

## design token

- 利用 token: `--color-primary`, `--color-danger`, `--color-success`, `--color-surface`, `--space-*`, `--radius-*`（全て `apps/web/src/styles/tokens.css` の既存 OKLch token）
- 新規 token 追加なし。HEX / `bg-[#xxx]` 禁止。

## 完了条件
- [ ] 設計判断 1 / 2 が文書化済み
- [ ] コンポーネント構造とファイルパスが確定
- [ ] hook / helper シグネチャが TypeScript で書ける粒度
- [ ] a11y / design token 方針が明示
