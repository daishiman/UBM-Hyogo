# Phase 2: 設計

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 2 / 13 |
| 前提 | Phase 1（要件）完了 |

## 目的

Task A の UI 導線を、既存 admin feature の構造・mutation 規約・OKLch トークンに整合する形で設計する。
concern は 1（admin 操作 UI）に固定。

## 実行タスク

1. 既存実装のターゲットトポロジを owner/co-owner 付きで確定する。
2. backfill endpoint のレスポンス契約を web 側 zod schema へ写像する。
3. パネル component の state、mutation、apply ガード、UI 構造を設計する。
4. `/admin/sync-status` page への mount 位置と Task B 依存を明記する。
5. validation matrix を実在 script 名で固定する。

## 1. ターゲットトポロジ（変更対象ファイル）

| パス | 区分 | 責務 | owner |
|------|------|------|-------|
| `apps/web/src/features/admin/diagnostics/backfill.ts` | 実装済み（記述対象） | `BackfillResultSchema`（zod, `.strict()`）+ `BackfillResult` 型 + `BACKFILL_PUBLISH_STATE_PATH` 定数 | task-A |
| `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` | 実装済み（記述対象） | dry-run / apply 操作パネル（client component） | task-A |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | 実装済み（mount 行） | `SyncStatusView` 末尾に `<BackfillPublishStatePanel />` をマウント | task-A（co-owner: Task B の `ManualFormResyncPanel` も同 page に mount） |
| `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx` | 実装済み（記述対象） | パネル単体テスト | task-A |
| `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | 実装済み（記述対象） | schema parse/reject テスト | task-A |

> 配置方針: sync 系パネルは `_sync/` サブディレクトリへ集約（既存 `_members/` `_meetings/` と同列）。
> zod/型は `diagnostics/`（既存 `types.ts` / `api.ts` / `manual-sync.ts` と同階層）へ co-locate。

## 2. レスポンス契約（仕様語 ↔ 実装語 対応表）

endpoint 側 `BackfillResult`（`apps/api/src/routes/admin/sync-backfill-publish-state.ts:31-43`）と完全一致させる。
web は API を直接 import しない（不変条件 #5）ため `backfill.ts` で再宣言する。

| フィールド | 型 | 意味 |
|-----------|-----|------|
| `dryRun` | `boolean` | dry-run なら true |
| `policy` | `"auto-publish-on-consent"` リテラル | 救済ポリシー識別子 |
| `scanned` | `number >=0` | 走査件数 |
| `candidates` | `number >=0` | 昇格対象件数 |
| `applied` | `number >=0` | 実際に昇格した件数（dry-run は 0） |
| `skipped.alreadyPublic` | `number >=0` | 既に public |
| `skipped.adminExplicit` | `number >=0` | 管理者明示設定（override） |
| `skipped.consentNotMet` | `number >=0` | 同意未達 |
| `skipped.deleted` | `number >=0` | 削除済み |

```ts
export const BackfillResultSchema = z.object({
  dryRun: z.boolean(),
  policy: z.literal("auto-publish-on-consent"),
  scanned: z.number().int().nonnegative(),
  candidates: z.number().int().nonnegative(),
  applied: z.number().int().nonnegative(),
  skipped: z.object({
    alreadyPublic: z.number().int().nonnegative(),
    adminExplicit: z.number().int().nonnegative(),
    consentNotMet: z.number().int().nonnegative(),
    deleted: z.number().int().nonnegative(),
  }).strict(),
}).strict();
export type BackfillResult = z.infer<typeof BackfillResultSchema>;
export const BACKFILL_PUBLISH_STATE_PATH = "/api/admin/sync/backfill-publish-state" as const;
```

## 3. パネル component 設計

```ts
export interface BackfillPublishStatePanelProps {
  readonly onApplied?: (result: BackfillResult) => void; // apply 成功時の任意通知（既定 no-op）
}
export function BackfillPublishStatePanel(props: BackfillPublishStatePanelProps): JSX.Element;
```

### 内部 state

| state | 型 | 役割 |
|-------|-----|------|
| `lastResult` | `BackfillResult \| null` | 直近の検証済みレスポンス。結果表示ソース |
| `mode` | `"dryRun" \| "apply" \| null` | `lastResult` のモードラベル |
| `parseError` | `string \| null` | schema mismatch 文言 |

### mutation の使い方（AC-4 / 不変条件 #10）

`useAdminMutation` の素 fetch 経路（`mutationFn` 未指定）を使い、`endpointOverride`（`trigger(payload, endpointOverride)` 第2引数 = `useAdminMutation.ts:179,225`）で `?dryRun=true|false` を切替。hook は 1 インスタンス。

```ts
const mutation = useAdminMutation<unknown>(BACKFILL_PUBLISH_STATE_PATH, "POST", {
  refreshOnSuccess: false,    // 結果は手動描画。一覧再検証は不要
  successMessage: () => "",   // 操作系トースト抑止
});
const raw = await mutation.trigger({}, `${BACKFILL_PUBLISH_STATE_PATH}?dryRun=${String(dryRun)}`);
const parsed = BackfillResultSchema.safeParse(raw);
```

### apply ガード（破壊的操作の安全設計）

- **dry-run 先行必須**: `canApply = lastResult !== null && mode === "dryRun" && lastResult.dryRun && lastResult.candidates > 0`。apply ボタンは `disabled={mutation.isLoading || !canApply}`。dry-run で候補 0 のときは apply 不可。
- **confirm 確認**: apply 押下時 `globalThis.confirm("直近の dry-run 候補を public に昇格します。実行しますか?")`。キャンセルで no-op。
- **二重起動防止**: `useAdminMutation` の `isSubmittingRef`（`useAdminMutation.ts:180-183`）が同時 trigger を内部ブロック。パネルは `mutation.isLoading` を両ボタン `disabled` + `loading` に渡す。

### UI 構造（OKLch トークンのみ・HEX 禁止 / 不変条件 §2）

- `AdminSectionCard`（`_shared`）で `title="公開状態 backfill"` / `density="compact"` をラップ。
- dry-run ボタン `variant="soft"`、apply ボタン `variant="danger"`（破壊的）。`data-testid="backfill-dry-run"` / `"backfill-apply"`。
- error 文言は `role="alert"` + `text-[var(--ubm-color-danger)]`。`parseError` → `mutation.error.message` の順で表示。
- 結果は `<dl className="grid grid-cols-2 md:grid-cols-4">`。行: `mode` / `scanned` / `candidates` / `applied` / `skipped.alreadyPublic` / `skipped.adminExplicit` / `skipped.consentNotMet` / `skipped.deleted`（AC-3 可視化）。ラベルは `text-[var(--ubm-color-text-muted)]`。

## 4. page への組み込み

`apps/web/app/(admin)/admin/sync-status/page.tsx`:
- `export const dynamic = "force-dynamic"`（`:9`）を維持。
- import（`:6`）: `import { BackfillPublishStatePanel } from "../../../../src/features/admin/components/_sync/BackfillPublishStatePanel.client";`
- mount（`:128`）: `<BackfillPublishStatePanel />`（`SyncStatusView` ルート末尾、Task B の `ManualFormResyncPanel` と並列）。

## 5. 認証経路の依存（Task B に集約）

backfill endpoint は `requireSyncAdmin`（Bearer `SYNC_ADMIN_TOKEN`）で保護される。
web の admin catch-all proxy（`apps/web/app/api/admin/[...path]/route.ts`）が `Authorization: Bearer ${SYNC_ADMIN_TOKEN}` を server-only 注入する変更は **Task B に 1 箇所集約**済み。本タスクはそれに依存する（proxy を本タスクで変更しない）。

## 6. validation matrix

| 検証 | コマンド |
|------|---------|
| 型 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| 単体テスト | `mise exec -- pnpm --filter @ubm-hyogo/web test`（追加分含む） |
| lint（inline style 禁止含む） | `mise exec -- pnpm lint` |

## 統合テスト連携

- web 側 schema 契約は `BackfillResultSchema.safeParse` + `sync-schemas.spec.ts`、UI は `BackfillPublishStatePanel.spec.tsx`、endpoint 側は `sync-backfill-publish-state.spec.ts`（D1 in-memory）で 3 層整合。

## 参照資料

| 参照 | パス |
|------|------|
| 要件定義 | `./phase-1.md` |
| endpoint 正本 | `apps/api/src/routes/admin/sync-backfill-publish-state.ts` |
| admin mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| sync status page | `apps/web/app/(admin)/admin/sync-status/page.tsx` |

## 多角的チェック観点（AIが判断）

- `dl` グリッドの contents wrapper で grid 行が崩れないか（`className="contents"`）。
- `confirm` は jsdom で `globalThis.confirm` モック必須（Phase 4 で `vi.spyOn`）。

## サブタスク管理

| ID | 内容 | 依存 |
|----|------|------|
| D-1 | schema/型/path 定数設計 | — |
| D-2 | パネル state + mutation + apply ガード設計 | D-1 |
| D-3 | UI トークン + 結果 dl 設計 | D-2 |
| D-4 | page mount 設計 | D-2 |

## 成果物

- 本設計ファイル（target topology / 契約 / component / mount / validation matrix）。

## 完了条件

- [x] 変更対象ファイル表（owner/co-owner 付き）を確定。
- [x] レスポンス契約の仕様語↔実装語対応表を作成。
- [x] mutation 規約（endpointOverride / isSubmittingRef / refreshOnSuccess:false）を確定。
- [x] apply ガード（dry-run 先行 + confirm + pending）を設計。
- [x] OKLch トークンのみ（HEX/inline style 禁止）を明記。
- [x] validation matrix を実在 script 名で記述。

## タスク100%実行確認【必須】

- [x] concern 1 に固定、lane <=3。
- [x] 既存 state 名・既存 route pattern をコードから確定して持ち込み。

## 次Phase

Phase 3（設計レビュー）。
