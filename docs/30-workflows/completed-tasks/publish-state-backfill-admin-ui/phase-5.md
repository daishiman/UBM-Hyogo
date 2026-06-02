# Phase 5: 実装

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 5 / 13 |
| 実装区分 | 実装仕様書 |
| workflow_state | implemented_local_evidence_captured |
| 前提 | Phase 4（テスト作成）完了 |
| 正本 | 既存実装（PR #1064 / commit `745c95115` で dev へ landed） |

> 本仕様書は landed 実装の正本記述。実装対象 3 ファイルは既に dev に存在する。`apps/api` 差分は 0。Write 対象は仕様書のみ。

## 目的

公開同意済みで `member_only` に残っている会員を確認（dry-run）し、必要な場合だけ `public` へ昇格（apply）する管理 UI を、既存 endpoint surface のみを使って `apps/web` に追加する。新 endpoint / D1 schema / Google Form 仕様の変更は行わない（親 AC-G2・不変条件 §1）。

## 実行タスク

実装対象 3 ファイル:

### 1. `apps/web/src/features/admin/diagnostics/backfill.ts`（新規相当）

```ts
import { z } from "zod";

export const BackfillResultSchema = z
  .object({
    dryRun: z.boolean(),
    policy: z.literal("auto-publish-on-consent"),
    scanned: z.number().int().nonnegative(),
    candidates: z.number().int().nonnegative(),
    applied: z.number().int().nonnegative(),
    skipped: z
      .object({
        alreadyPublic: z.number().int().nonnegative(),
        adminExplicit: z.number().int().nonnegative(),
        consentNotMet: z.number().int().nonnegative(),
        deleted: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export type BackfillResult = z.infer<typeof BackfillResultSchema>;

export const BACKFILL_PUBLISH_STATE_PATH =
  "/api/admin/sync/backfill-publish-state" as const;
```

- 外側 object と `skipped` の両方を `.strict()` 化し、過不足キーを reject する。
- `policy` は `z.literal("auto-publish-on-consent")` で固定。
- path は proxy 経由の相対 path（`/api/admin/...`）の `as const`。

### 2. `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx`

- `"use client"`。props `{ onApplied?: (result: BackfillResult) => void }`。
- state: `lastResult: BackfillResult | null` / `mode: "dryRun" | "apply" | null` / `parseError: string | null` / `activeMode: "dryRun" | "apply" | null`（`mode` とは別 state。in-flight 中の操作モードを保持し、`run` の `finally` で `setActiveMode(null)` へ戻す。完了済みの `mode` を loading 判定に使うと片方実行中にもう片方も loading 表示される取り違えを避けるため）。
- mutation: `useAdminMutation<unknown>(BACKFILL_PUBLISH_STATE_PATH, "POST", { refreshOnSuccess: false, successMessage: () => "" })`（不変条件 #10 経路）。
- `canApply = lastResult !== null && mode === "dryRun" && lastResult.dryRun && lastResult.candidates > 0`。
- `run(nextMode)`:
  - apply 時は `globalThis.confirm("直近の dry-run 候補を public に昇格します。実行しますか?")`、cancel で return。
  - `setParseError(null)` → `dryRun = nextMode === "dryRun"` → mutation 実行直前に `setActiveMode(nextMode)` → `try { ... } finally { setActiveMode(null); }` で in-flight モードを設定・確実にリセットする → `mutation.trigger({}, \`${BACKFILL_PUBLISH_STATE_PATH}?dryRun=${String(dryRun)}\`)`。
  - `BackfillResultSchema.safeParse(raw)`：失敗で `setLastResult(null)` + `setMode(null)` + `setParseError("backfill result schema mismatch")` + return。
  - 成功で `setLastResult(parsed.data)` + `setMode(nextMode)`、apply（`!dryRun`）成功で `onApplied?.(parsed.data)`。
- UI:
  - `AdminSectionCard title="公開状態 backfill" density="compact"`（description 付き）。
  - dry-run ボタン: `variant="soft"` / `disabled={mutation.isLoading}` / `loading={mutation.isLoading && activeMode !== "apply"}`（in-flight が apply 以外＝dry-run 実行中のみ busy 表示）/ `data-testid="backfill-dry-run"`。
  - apply ボタン: `variant="danger"` / `disabled={mutation.isLoading || !canApply}` / `loading={mutation.isLoading && activeMode === "apply"}`（in-flight が apply のときのみ busy 表示）/ `data-testid="backfill-apply"`。
  - 両ボタンの `loading` 条件は完了済み `mode` ではなく in-flight 中の `activeMode` を基準とし、押下したボタンだけが busy 表示になる。
  - error 描画順序: `parseError` → `mutation.error` の順で `<p role="alert" className="... text-[var(--ubm-color-danger)]">`。
  - 結果: `<dl className="... grid grid-cols-2 gap-2 ... md:grid-cols-4">`。行 = `mode` + `scanned` / `candidates` / `applied` / `skipped.{alreadyPublic,adminExplicit,consentNotMet,deleted}` の各 `dt`/`dd`。label は `text-[var(--ubm-color-text-muted)]`。各 skipped 行は `<div className="contents">` でラップしグリッド構造を維持。
  - OKLch トークンのみ（HEX / `bg-[#...]` / inline style 禁止・不変条件 §2）。新規 primitive を増やさない（`Button` / `AdminSectionCard` のみ・不変条件 §3 / #9）。

### 3. `apps/web/app/(admin)/admin/sync-status/page.tsx`（編集）

- `export const dynamic = "force-dynamic"`（:9）を維持。
- import（:6）に `BackfillPublishStatePanel` を追加。
- mount（:128）に `<BackfillPublishStatePanel />` を Task B の `<ManualFormResyncPanel />`（:129）と並列配置。

## 入力 / 出力 / 副作用

| 操作 | 入力 | 出力 | 副作用（D1） |
|------|------|------|-------------|
| dry-run | `POST /api/admin/sync/backfill-publish-state?dryRun=true`、body `{}` | `BackfillResult`（`dryRun:true`・候補集計） | **DB 無変更**（読み取りのみ） |
| apply | `POST ...?dryRun=false`、body `{}`（confirm 通過後） | `BackfillResult`（`dryRun:false`・`applied` 件数） | `member_status` を `publish_state='public'`, `updated_by='system:backfill'` に UPDATE（**endpoint 側**で実行） |

- `apps/web` は D1 binding に直接アクセスしない（不変条件 §1 / §5）。UPDATE は救済 endpoint（`apps/api`）が担う。
- `apps/api` 差分 0（本タスクは web のみ変更）。

## 参照資料

| 種別 | パス |
|------|------|
| 既存 endpoint surface | `apps/api/src/routes/`（救済 endpoint・本タスク非変更） |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation` |
| primitives | `apps/web/src/features/admin/components/_shared`（`AdminSectionCard`）/ `components/ui/Button` |
| OKLch トークン | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md` |
| テスト | Phase 4（TC-A1..A7 / TC-B1..B4） |

## 実行手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm lint
```

1. `backfill.ts` に schema + 型 + path 定数を実装する。
2. `BackfillPublishStatePanel.client.tsx` を実装する（state / `canApply` / `run` / UI）。
3. `sync-status/page.tsx` に import と mount を追加する。
4. typecheck / test / lint を通す。

## 統合テスト連携

- Phase 4 の TC-A1..A7（panel）と TC-B1..B4（schema）が本実装に対して green であること。
- endpoint レスポンス形（`DRY_RUN_RESULT` / `APPLY_RESULT`）が `BackfillResultSchema.safeParse` を通過すること。

## 多角的チェック観点（AIが判断）

- `endpointOverride`（`mutation.trigger` の第 2 引数）で dry-run / apply を 1 hook に集約しているか（hook 二重化を避ける設計）。
- apply の破壊性が dry-run 先行（`canApply`）+ `confirm` の 2 段で守られているか。
- `parseError` を `mutation.error` より優先して描画し、両者とも結果テーブルを非描画にするか。
- `text-[var(--ubm-color-danger)]` / `text-[var(--ubm-color-text-muted)]` 以外の色指定や inline style を持ち込んでいないか（`verify-design-tokens` gate）。
- `process.env.*` 直接参照や D1 binding 参照を `apps/web` に持ち込んでいないか（不変条件 §5 / env アクセサ規約）。

## サブタスク管理

| ID | 内容 | 判定 |
|----|------|------|
| T5-1 | `backfill.ts`（schema / 型 / path） | 完了（landed） |
| T5-2 | `BackfillPublishStatePanel.client.tsx` | 完了（landed） |
| T5-3 | `sync-status/page.tsx` mount | 完了（landed） |

## 成果物

- `apps/web/src/features/admin/diagnostics/backfill.ts`
- `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx`
- `apps/web/app/(admin)/admin/sync-status/page.tsx`（編集・import / mount 追加）

## 完了条件

- [x] 3 ファイルが実装され typecheck / lint green。
- [x] Phase 4 の全 TC が green。
- [x] `apps/api` 差分 0（既存 endpoint surface のみ利用）。
- [x] OKLch トークンのみ・新規 primitive なし。
- [x] mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）。
- [x] coverage AC（apps/web 既定閾値 Statements/Branches/Functions/Lines >= 80%）は Phase 7 で確定。

## タスク100%実行確認【必須】

- [x] 実コードを正本として 3 ファイルの実装内容を記述した。
- [x] 入力 / 出力 / 副作用表（dry-run=DB 無変更 / apply=UPDATE は endpoint 側）を含めた。
- [x] `apps/api` 差分 0 を明記した。

## 次Phase

Phase 6（テスト拡充）。
