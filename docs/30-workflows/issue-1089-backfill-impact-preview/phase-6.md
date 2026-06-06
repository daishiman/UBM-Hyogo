# Phase 6 — テスト拡充

**[実装区分: 実装仕様書 / implementation_mode: new]**

> Phase 4（Red）/ Phase 5（Green）で確立した契約に対し、fail path・回帰 guard・境界値の網羅を拡充する。
> 既存 TC-B1..B8 / TC-S1..S7 の不退行（AC-3/AC-5）を確認し、preview 経路固有の失敗・境界を追加検証する。
> 過剰実装を避け、価値のある枝のみを追加する（低価値・低発生頻度は候補列挙に留める）。

---

## 1. fail path 拡充

| ID | fail path | 配置 | 検証内容 |
|----|-----------|------|---------|
| FP-1 | Forms API throw → route 500 | `responses-sync.contract.spec.ts` | `client.listResponses` が throw → `previewResponseSync` が throw → route が `{ ok:false, error:"preview_failed" }` を `500` で返す（PII 非露出・Phase 2 §2.3） |
| FP-2 | preview schema mismatch（UI） | `ManualFormResyncPanel.spec.tsx` | `previewMutation` が schema 不一致（`{ ok:true, preview:{ foo:1 } }` / `{ ok:false, ... }`）を resolve → `parseError`「preview result schema mismatch」を `role="alert"` 表示 / preview パネル非描画 / `canBackfill=false`（TC-B12 の補完枝を網羅） |
| FP-3 | network error（UI） | `ManualFormResyncPanel.spec.tsx` | `previewMutation.trigger` が reject（throw）→ preview 表示されず `mode` が `preview` にならない / `activeMode` が `finally` で null へ戻る / `manual-sync-backfill` は `disabled`（`canBackfill=false`） |
| FP-4 | formId 未設定 throw → route 500 | `responses-sync.contract.spec.ts` | `env.GOOGLE_FORM_ID` 未設定で `?dryRun=true` → `previewResponseSync` throw → route `500 preview_failed`（TC-PV9 の route レベル投影） |

> FP-1/FP-4 は backend throw が route で 500（PII を含まない固定 error）へ変換されることを保証する。FP-2/FP-3 は UI が preview 失敗時に「件数取得不可」を表面化し誤承認を防ぐこと（AC-1 代替表示）を保証する。

---

## 2. 回帰 guard（TC-B1..B8 / 既存契約の不退行）

> preview 導入で既存経路が壊れていないことを確認する。AC-3（既存契約不退行）・AC-5（TC-B1..B8 維持）の guard。

| guard | 対象 TC | 確認手順 |
|-------|---------|---------|
| 差分 sync `?fullSync=false` | TC-B1 | `manual-sync-run` click で `runTriggerMock` が `({}, ".../responses?fullSync=false")` 完全一致で呼ばれる。query 取り違え（dryRun 混入・fullSync 誤値）が無いこと |
| 全件 backfill `?fullSync=true` | TC-B2（staged） | preview → confirm 承認後に `backfillTriggerMock` が `({}, ".../responses?fullSync=true")` で呼ばれる。`?dryRun` が**付かない**こと（backfill は実書込ゆえ dryRun 非混入） |
| 409 in-progress | TC-B5 | `FetchAuthedError(409, {ok:false,result:{status:"skipped",...}})` で `role="status"`「他の sync が実行中です」/ 結果テーブル非描画。preview 状態の有無に影響されないこと |
| run 経路 parseError | TC-B7 | run の `{foo:1}` resolve で `role="alert"`「sync result schema mismatch」。preview の parseError（「preview result schema mismatch」）と**別メッセージ**で混同しないこと |
| schema 不変 | TC-S1..S7 | `SyncResultSchema` / `SyncRunResponseSchema` の既存 7 TC が green。preview schema 追加で 1 件も落ちないこと（`git diff` で既存 describe 無改変を確認） |
| route 後方互換 | TC-RT5 | `?fullSync=true`（dryRun 未指定）が既存 `runResponseSync` 経路（200/409/500）へ到達し preview を呼ばないこと |

> **確認手順（コマンド）**: §4 の targeted vitest を実行し、上記 guard TC が全て green。さらに `git diff dev...HEAD -- apps/web/src/features/admin/diagnostics/manual-sync.ts` で `SyncResultSchema` / `SyncRunResponseSchema` / `SYNC_RESPONSES_PATH` の行が変更されていないこと（追加のみ）を目視確認する。

---

## 3. 境界値

| ID | 境界 | 配置 | 検証内容 |
|----|------|------|---------|
| BV-1 | responseCount=0（全件空） | `sync-forms-responses.contract.spec.ts` | `listResponses` が空ページ（または全 response が responseEmail 欠落）→ `responseCount === 0` / `estimatedWrites === 0` / `capped === false`。UI 側（`ManualFormResyncPanel.spec.tsx`）で `responseCount=0` の confirm 文言が `全 0 件の回答を再取込します（推定 0 write）。実行しますか?` になること |
| BV-2 | capped boundary（ちょうど 100 page） | `sync-forms-responses.contract.spec.ts` | 100 ページ目で `nextPageToken` が無くなる → `capped === false` / `pagesScanned === 100`。101 ページ目相当（`safetyCounter > 100`）に到達する場合のみ `capped === true`（Phase 2 §2.2-7 の境界） |
| BV-3 | estimatedWrites=0 | `sync-forms-responses.contract.spec.ts` | `responseCount > 0` だが `estimateResponseWrites` が全て 0 を返すケース → `estimatedWrites === 0`。`responseCount` と `estimatedWrites` が独立指標であること（実数 ≠ 推定 write） |

> BV-2 は off-by-one の罠が出やすい境界。「100 ページちょうどは capped でない・101 ページ目で打ち切り capped」という Phase 2 の overflow guard 値を厳密に固定する。

---

## 4. 補助コマンド（targeted vitest・Phase 1 §4 ファイルリスト使用）

```bash
# backend（api）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/responses-sync.contract.spec.ts

# frontend（web・リポジトリルートから root glob 解決）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
```

- 全件実行（SIGKILL リスク）を避け、Phase 1 §4 の 4 ファイルのみを targeted 実行する（[FB-UI-02-2]）。

---

## 完了条件

- [ ] fail path（FP-1 Forms API throw 500 / FP-2 preview schema mismatch / FP-3 network error / FP-4 formId 未設定 500）を配置・検証内容付きで定義した
- [ ] 回帰 guard（TC-B1/B2/B5/B7・TC-S1..S7・TC-RT5）の不退行確認手順を記述した（AC-3/AC-5）
- [ ] 境界（BV-1 responseCount=0 / BV-2 capped 100page boundary / BV-3 estimatedWrites=0）を定義した
- [ ] 補助コマンド（targeted vitest・Phase 1 §4 ファイルリスト・全件回避）を提示した
- [ ] run 経路と preview 経路の parseError メッセージが別物で混同しないことを guard 化した
