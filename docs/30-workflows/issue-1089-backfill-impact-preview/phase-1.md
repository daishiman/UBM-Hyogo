# Phase 1 — 要件定義

**[実装区分: 実装仕様書 / implementation_mode: new]**

> issue #1089「全件 backfill 承認前の影響件数プレビュー」を Phase 1〜13 仕様書へ展開する第 1 フェーズ。
> Phase 1 作成時点では現行コードに **未実装**だったため、本 Phase は scope/AC/inventory を固定し、
> 現行コードの命名規則を分析し、issue 本文の現行コードへの最適化（O1..O5）を確定する。

---

## 1. 目的 / 主問題（真の論点）

### 真の論点（1 文固定）

> 「破壊的になりうる全件 backfill（`?fullSync=true`）の実行前に、**Forms API から取得した実カウント**を
> 根拠に『何件の回答が再取込されるか』を管理者へ提示し、その実数を承認文言へ埋め込んでから実行できる状態を
> 担保する。UI 側の推定値ではなく backend の count-only 経路の実数を使う。」

### why now / why this way

- **why now**: 全件 backfill は `variant=danger` の破壊的操作でありながら、実行前に提示できるのは標準
  `confirm` の固定文言（「Google Forms 回答を fullSync=true で再取込します。実行しますか?」）だけで、
  件数の事前提示が無い（親 Task B Phase 10/12 で「将来UX改善候補-2」として記録）。
- **why this way**: 同じ `_sync` 配下の `BackfillPublishStatePanel` が `?dryRun=true|false` の dry-run
  パターンを既に完成させている。これを `ManualFormResyncPanel` / `POST /admin/sync/responses` へ
  踏襲することで、UX・実装・テストの整合を最小コストで担保する。Forms API を read-only で
  ページングして件数を数える count-only 経路を backend に新設し、書込は一切行わない。

---

## 2. 受け入れ基準（issue #1089 の AC を現行コードへ最適化）

| ID | 内容 | 現行コードでの実現方針 |
|----|------|----------------------|
| AC-1 | 全件 backfill 承認フローの前段に、影響を受ける見込み件数（または「件数取得不可」明示）が表示される | `影響件数を確認`（dry-run）ボタン → preview 結果テーブルに `responseCount` / `estimatedWrites` / `capped` を表示。失敗時は `parseError` / 「件数取得不可」を表示 |
| AC-2 | プレビューに表示する件数は backend の dry-run / count-only 経路から取得した実数であり、UI 側の推定値ではない | `responseCount` は `POST /admin/sync/responses?dryRun=true` が Forms API `listResponses` を実際にページングして数えた実カウント。UI では推定しない。`estimatedWrites` は「推定」とラベル明示 |
| AC-3 | 既存の差分 sync（`?fullSync=false`）/ 全件 backfill（`?fullSync=true`）→ `POST /admin/sync/responses` 呼び出しと `SyncResultSchema`（status/jobId/processedCount/writeCount/cursor + optional skippedReason）が退化しない | `SyncResultSchema` / `SyncRunResponseSchema` は **不変**。dry-run は新規 `SyncPreviewResultSchema` / 新規 route 分岐として **追加のみ**。`?fullSync=true/false` 経路は無改変 |
| AC-4 | confirm キャンセル相当の操作で backfill が実行されない（現 TC-B3 相当の不実行保証を維持） | `runBackfill` 内の `globalThis.confirm` が false なら early return（現行維持）。preview 後でも confirm cancel で `?fullSync=true` を呼ばない |
| AC-5 | `ManualFormResyncPanel.spec.tsx`（TC-B1..B8、特に TC-B2）が green、または件数プレビュー導入に合わせて TC-B2 が更新されても等価の承認保証を担保する | TC-B1..B8 は維持。TC-B2 は「preview → confirm 承認 → `?fullSync=true`」の staged flow へ更新し、承認保証を等価に担保（更新理由を test 内コメント + phase-4.md に記録） |

---

## 3. スコープ

### 含む

- backend: `POST /admin/sync/responses?dryRun=true` の count-only 経路新設（`previewResponseSync`）
- backend: `sync-forms-responses.ts` に `previewResponseSync` + `ResponseSyncPreview` 型追加（write 一切なし・lock 不取得・ledger 非変更）
- frontend: `manual-sync.ts` に `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` / 型 追加（既存 `SyncResultSchema` は不変）
- frontend: `ManualFormResyncPanel.client.tsx` に dry-run プレビューボタン + 件数表示 + staged backfill enable + confirm 文言への実数埋め込み
- backend/frontend テスト（preview 経路 / route dryRun 分岐 / staged UI flow / schema）
- D7（自前 dialog 不採用）の本タスク内での再判断記録（phase-3.md）

### 含まない（スコープ外・不変条件）

- 差分 sync / 全件 backfill の既存 URL 契約（`?fullSync=false` / `?fullSync=true`）と `SyncResultSchema` の破壊的変更
- D1 migration / Google Form schema 変更 / sync write path（`processResponse`）の挙動変更
- `app/api/admin/[...path]/route.ts` の `SYNC_ADMIN_TOKEN` server-only 注入経路の変更（`?dryRun` は query のため `needsSyncAdminBearer` の path 判定に影響せず無改変で通る）
- 自前 modal/dialog component の新規追加（D7 再判断の結論として不採用）
- `SYNC_ADMIN_TOKEN` の実値投入（Cloudflare Secrets / `.dev.vars`）= user-gated
- commit / push / PR 作成 / staging / production deploy / authenticated runtime screenshot = user-gated（CONST_002）

---

## 4. inventory（既存コードの命名規則・現状確認）

| 項目 | current facts |
|------|--------------|
| component 命名 | PascalCase + `.client.tsx`。`ManualFormResyncPanel.client.tsx` / `BackfillPublishStatePanel.client.tsx`（参考） |
| schema/型/定数 | `diagnostics/manual-sync.ts` / `diagnostics/backfill.ts`（参考）。zod schema は PascalCase + `Schema` 接尾（`SyncResultSchema` / `BackfillResultSchema`） |
| backend 経路 | `apps/api/src/routes/admin/responses-sync.ts`（`createAdminResponsesSyncRoute`）。dry-run 参考は `sync-backfill-publish-state.ts`（`?dryRun` query → `runBackfillPublishState({dryRun})`） |
| backend job | `apps/api/src/jobs/sync-forms-responses.ts`（`runResponseSync` / `processResponse` / pagination helper 群 / `estimateResponseWrites`） |
| mutation hook | `@/features/admin/hooks/useAdminMutation`（不変条件 #10・legacy `@/lib/useAdminMutation` 不使用） |
| 色トークン | OKLch CSS 変数（`var(--ubm-color-*)`）・HEX 直書き禁止（不変条件 #2） |
| confirm | `globalThis.confirm`（test は `vi.spyOn(globalThis,"confirm")`）。`BackfillPublishStatePanel` も同方式 |
| test 命名 | frontend は `*.spec.{ts,tsx}`、backend は `*.contract.spec.ts`（既存慣習・不変条件 #8） |
| dry-run UI パターン（参考正本） | `BackfillPublishStatePanel`: `mode: "dryRun"\|"apply"\|null` / `activeMode` / `canApply = lastResult!==null && mode==="dryRun" && dryRun && candidates>0` / apply は confirm 後実行 / 結果テーブルに `mode` 表示 |

### targeted test run ファイルリスト（[FB-UI-02-2] 全件 SIGKILL 回避）

```
apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx
apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
apps/api/src/jobs/sync-forms-responses.contract.spec.ts
apps/api/src/routes/admin/responses-sync.contract.spec.ts
```

---

## 5. 変更対象ファイル一覧（CONST_005 必須項目）

| パス | 変更種別 | 内容 |
|------|---------|------|
| `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | `ResponseSyncPreview` 型 + `previewResponseSync(env, opts)` 追加。pagination helper（`parseHighWaterCursor` / `isAfterHighWater` / `estimateResponseWrites`）を再利用。write/lock/ledger 非実行 |
| `apps/api/src/routes/admin/responses-sync.ts` | 編集 | `c.req.query("dryRun") === "true"` 分岐で `previewResponseSync` を呼び `{ ok:true, preview }` を返す。既存 `?fullSync`/`?cursor` 経路は不変 |
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | 編集 | `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` / 型 追加。`SyncResultSchema` / `SyncRunResponseSchema` は不変 |
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 編集 | dry-run preview ボタン（`data-testid="manual-sync-backfill-preview"`）/ preview 件数表示 / `canBackfill` gate / confirm 文言への実数埋め込み |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | 編集 | `previewResponseSync` の count/no-write/capped テスト追加 |
| `apps/api/src/routes/admin/responses-sync.contract.spec.ts` | 編集 | `?dryRun=true` 分岐の route テスト追加 |
| `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx` | 編集 | TC-B9..B12（preview/staged backfill）追加・TC-B2 を staged 化 |
| `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` | 編集 | preview schema の正常/異常ケース追加 |

---

## 6. 不変条件（本タスク固有）

1. `SyncResultSchema` / `SyncRunResponseSchema` / `?fullSync=true|false` 契約は不変（AC-3）
2. D1 直接アクセスは `apps/api` に閉じる（`apps/web` から binding 禁止・不変条件 #5 → UI は zod 再宣言）
3. preview 経路は **read-only**: write / sync lock 取得 / sync_jobs ledger mutation を一切行わない
4. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）
5. 色は OKLch トークンのみ・HEX 禁止（不変条件 #2）
6. 機密値 `SYNC_ADMIN_TOKEN` は Cloudflare Secrets / `.dev.vars`（toml に実値を書かない）
7. PII（responseEmail / responseId / questionId）を preview response・log へ出さない（`redact` 方針を踏襲）

---

## 7. carry-over 確認

- 親 Task B（commit `745c95115` / PR #1064）が dev へ landed 済み。本タスクはその follow-up（issue #1089）。
- 親の「apps/api 差分ゼロ」invariant は本 follow-up で意図的に解除（O4）。`?dryRun=true` は後方互換の opt-in 追加。
- `BackfillPublishStatePanel` の dry-run パターン（同 wave で landed 済）を参考正本として再利用。

---

## 完了条件

- [x] 真の論点を 1 文で固定した
- [x] AC-1..AC-5 を現行コードの実現方針へ写像した
- [x] scope（含む / 含まない）と不変条件を確定した
- [x] 既存コードの命名規則を inventory に記録した（[FB-SDK-07-4] 命名一貫性）
- [x] issue 本文の現行コードへの最適化（O1..O5・index.md §1）を確定した
- [x] 変更対象ファイル一覧（新規/編集）を列挙した（CONST_005 / [Feedback RT-03]）
- [x] targeted test run ファイルリストを事前列挙した（[FB-UI-02-2]）
- [x] タスク分類（UI task / VISUAL）を記録した（[Feedback 3]）
