# Implementation Guide — issue-776-schema-alias-bulk-resolve

## Part 1: 初学者向け説明

この変更は、学校でたくさんのプリントを提出するときに、1 枚ずつ先生の机へ持っていく代わりに、まとめて提出箱へ入れるようにするものです。今の画面では、似た質問の名前直しを 1 件ずつ片付けます。質問が 30 件あると、同じ操作を何度も繰り返す必要があります。

そこで、直したい行にチェックを入れ、まとめ画面で確認してから一度に送ります。途中で 1 件だけ失敗しても、成功した分はそのまま残し、失敗した分だけ理由を見て直せるようにします。

なぜ必要かというと、管理者が同じ作業を何度も繰り返す時間を減らし、入力ミスが起きたときもどこを直せばよいか分かりやすくするためです。

| 用語 | やさしい言い換え |
| --- | --- |
| diff | 前と今で違っているところ |
| alias | 古い名前と新しい名前をつなぐ印 |
| stableKey | ずっと変わらない質問の合言葉 |
| modal | 画面の上に出る確認箱 |
| partial failure | まとめた中の一部だけが失敗すること |

## Part 2: 技術者向け要約

`SchemaDiffPanel` に bulk selection mode を追加し、`unresolved` / `changed` 行だけを選択対象にする。API は新設せず、既存 `postSchemaAlias` を `postSchemaAliasBulk` から bounded fan-out で呼ぶ。これにより `apps/api/src/routes/admin/schema.ts` と D1 schema は変更しない。

State は `SchemaDiffPanel` に集約せず、`useSchemaDiffBulkSelection` と `SchemaDiffBulkResolveModal` に分離する。既存 single-resolve 経路はそのまま維持し、bulk path は薄い wrapper と UI state だけを追加する。

## Implementation Targets

| Path | Action | Notes |
| --- | --- | --- |
| `apps/web/src/lib/admin/api.ts` | edit | `postSchemaAliasBulk` と row result union を追加。`postSchemaAlias` は変更しない |
| `apps/web/src/components/admin/hooks/useSchemaDiffBulkSelection.ts` | add | selection, modal rows, submit status, retry state を管理 |
| `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx` | add | batch confirm modal。existing UI primitives を再利用 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | edit | toggle, checkbox, select-all, modal mount の最小差分 |
| `apps/web/src/components/admin/schemaAliasValidation.ts` | add | single/bulk stableKey validation の単一定義 |
| `apps/web/playwright/tests/issue776-schema-bulk-resolve.spec.ts` | add | Phase 11 screenshot / perf / axe evidence capture |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | edit | bulk resolve operation contract を追記 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | edit | bulk endpoint を新設しない境界を明記 |

## API Contract

The existing upstream endpoint remains `POST /admin/schema/aliases`.

```ts
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
): Promise<{ results: SchemaAliasBulkRowResult[] }>;
```

`202 backfill_cpu_budget_exhausted` maps to `retryable`, `409` maps to `conflict`, `422` maps to `invalid`, thrown/rejected calls map to `network`, and other non-2xx responses map to `other`.

## UI Flow

1. Admin opens `/admin/schema`.
2. Admin toggles bulk mode.
3. Only `unresolved` and `changed` rows render checkboxes.
4. Category-level select-all updates the selected id set and visible breakdown.
5. The modal snapshots selected rows and pre-fills recommendations when available.
6. Submit runs fan-out and keeps failed rows editable if any request fails.
7. All-success closes the modal and triggers parent refetch.

## Error Handling

Partial failure is first-class behavior. Successful rows are treated as committed because the existing endpoint commits one alias per request. Failed rows remain in the modal with `role="alert"` messaging and editable `stableKey` inputs. Retryable `202` rows remain in the modal with restart wording, not failure wording.

The implementation must not throw on a single row failure. A bounded row runner is the controlling primitive, and the hook returns row-level results to the modal as each request completes.

## Verification Commands

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- SchemaDiffBulkResolveModal SchemaDiffPanel useSchemaDiffBulkSelection api.spec
PLAYWRIGHT_EVIDENCE_TASK=issue-776-schema-alias-bulk-resolve mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/issue776-schema-bulk-resolve.spec.ts --project=desktop-chromium
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm verify-design-tokens
mise exec -- pnpm verify:phase12-compliance
```

## Phase 11 Evidence

Local fixture evidence is stored under `outputs/phase-11/`:

- `bulk-select-desktop-1280.png`
- `bulk-modal-desktop-1280.png`
- `bulk-partial-failure-desktop-1280.png`
- `bulk-success-desktop-1280.png`
- `bulk-select-mobile-375.png`
- `bulk-modal-mobile-375.png`
- `perf-30rows.md`
- `a11y-manual-check.md`

## Known Limits

This design intentionally accepts N browser-to-Workers requests for up to 50 selected rows. A server-side batch endpoint is left out because the requirement can be met with lower complexity and no API surface change. If Phase 9 measurement proves the 30-second NFR cannot be met, a separate endpoint task should be formalized with measured evidence.
