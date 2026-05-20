# Phase 5: Implementation Plan

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
Phase 2 設計 + Phase 4 Red テストに対応する実装手順をファイル単位で明示する。

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | Bulk Resolve トグル button + checkbox 描画 hook 連携 |
| `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx` | 新規 | batch confirm modal |
| `apps/web/src/components/admin/hooks/useSchemaDiffBulkSelection.ts` | 新規 | 選択/modal/submit を内包する hook |
| `apps/web/src/lib/admin/api.ts` | 編集 | `postSchemaAliasBulk` / `SchemaAliasBulkRowResult` 追加（`postSchemaAlias` は無変更） |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 編集 | bulk 経路ケース追記（Phase 4 で追加） |
| `apps/web/src/components/admin/__tests__/SchemaDiffBulkResolveModal.component.spec.tsx` | 新規 | Phase 4 で追加 |
| `apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkSelection.spec.ts` | 新規 | Phase 4 で追加 |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | 編集 | Phase 4 で追加 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | 編集 | bulk resolve 仕様追記（Phase 12） |

**変更しないファイル**: `apps/api/src/routes/admin/schema.ts`（API 不変条件1適合）、`postSchemaAlias`、`useAdminMutation`。

## 実装順序

1. **api.ts**: `postSchemaAliasBulk` と `SchemaAliasBulkRowResult` 型を追加（テスト 4-1〜4-6 が green になる最小実装）
2. **useSchemaDiffBulkSelection.ts**: hook の skeleton → 各 selector → submit ロジック（テスト 1-8 順）
3. **SchemaDiffBulkResolveModal.tsx**: dumb component として props 駆動で実装（テスト 1-8 順、a11y は最後）
4. **SchemaDiffPanel.tsx**: bulk toggle button + checkbox 描画分岐 + hook 接続 + modal mount
5. **schema.handlers.ts**: partial failure 用 mock 分岐

## 関数シグネチャ詳細

### `postSchemaAliasBulk`

```ts
// apps/web/src/lib/admin/api.ts
export interface SchemaAliasBulkRowResult {
  diffId: string;
  questionId: string;
  status: "success" | "retryable" | "error";
  data?: SchemaAliasApplyBody;
  error?: {
    kind: "conflict" | "invalid" | "retryable" | "network" | "other";
    message: string;
    httpStatus?: number;
  };
}

export const postSchemaAliasBulk = async (
  rows: ReadonlyArray<{ diffId: string; questionId: string; stableKey: string }>,
): Promise<{ results: SchemaAliasBulkRowResult[] }> => {
  if (rows.length === 0) return { results: [] };
  const results = await runWithConcurrency(rows, 8, async (row) => {
    try {
      const r = await postSchemaAlias({
        diffId: row.diffId,
        questionId: row.questionId,
        stableKey: row.stableKey,
      });
      if (isSchemaAliasRetryableContinuation(r)) {
        return {
          diffId: row.diffId,
          questionId: row.questionId,
          status: "retryable",
          data: r.data,
          error: {
            kind: "retryable",
            message: "Back-fill can continue from the last processed row.",
            httpStatus: 202,
          },
        };
      }
      if (r.ok) {
        return { diffId: row.diffId, questionId: row.questionId, status: "success", data: r.data };
      }
      const kind =
        r.status === 409 ? "conflict" : r.status === 422 ? "invalid" : "other";
      return {
        diffId: row.diffId,
        questionId: row.questionId,
        status: "error",
        error: { kind, message: r.error ?? "", httpStatus: r.status },
      };
    } catch (e) {
      return {
        diffId: row.diffId,
        questionId: row.questionId,
        status: "error",
        error: { kind: "network", message: e instanceof Error ? e.message : String(e) },
      };
    }
  });
  return { results };
};
```

### `useSchemaDiffBulkSelection`

Phase 2 のシグネチャに従う。内部 state は以下の useState で構成:

```ts
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [modalOpen, setModalOpen] = useState(false);
const [rows, setRows] = useState<BulkRowState[]>([]);
const [isSubmitting, setIsSubmitting] = useState(false);
```

`submit()` 実装:

```ts
const submit = async () => {
  setIsSubmitting(true);
  // 全行 status を pending に
  setRows((rs) => rs.map((r) => ({ ...r, submitStatus: "pending", errorMessage: undefined })));
  const payload = rows.map((r) => ({ diffId: r.diffId, questionId: r.questionId, stableKey: r.stableKey }));
  const { results } = await postSchemaAliasBulk(payload);
  const succeeded = results.filter((r) => r.status === "success").map((r) => r.diffId);
  const failed = results.filter((r) => r.status === "error");
  setRows((rs) =>
    rs
      .filter((r) => !succeeded.includes(r.diffId))  // 成功分は modal から除外
      .map((r) => {
        const f = failed.find((x) => x.diffId === r.diffId);
        return f
          ? { ...r, submitStatus: "error", errorMessage: f.error?.message }
          : r;
      }),
  );
  setSelectedIds((s) => {
    const next = new Set(s);
    succeeded.forEach((id) => next.delete(id));
    return next;
  });
  if (failed.length === 0) {
    setModalOpen(false);
    deps.onAllSucceeded();
  }
  setIsSubmitting(false);
  return { succeeded, failed: failed.map((f) => f.diffId) };
};
```

### `SchemaDiffBulkResolveModal`

Props:

```ts
interface Props {
  open: boolean;
  rows: BulkRowState[];
  isSubmitting: boolean;
  onUpdateStableKey(diffId: string, value: string): void;
  onApplyRecommendation(diffId: string): void;
  onApplyAllRecommendations(): void;
  onSubmit(): void;
  onClose(): void;
}
```

実装ポイント:
- `<dialog>` element ではなく既存 `Modal` primitive（`apps/web/src/components/ui/`）を再利用
- focus trap は既存 Modal primitive に内蔵（再利用）
- stableKey input は既存 `FormField` primitive を再利用
- status badge は OKLch `--color-success` / `--color-danger`

## 副作用とエラー処理

- 副作用: `postSchemaAlias` の HTTP POST（行数分）
- error boundary: `apps/web/src/app/error.tsx` で catch されるが、bulk path では row runner 内で例外を `network` result に変換し、1 行の失敗で batch 全体を throw しない

## 実行/検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## DoD (Definition of Done)

- [ ] Phase 4 で追加した全テストが green
- [ ] `pnpm typecheck` / `pnpm lint` green
- [ ] `pnpm --filter @ubm-hyogo/web build` green（Next.js webpack build / Workers 互換）
- [ ] `verify-design-tokens` gate green（HEX / `bg-[#xxx]` 違反 0）
- [ ] 既存 single-resolve 経路の spec が回帰なし
