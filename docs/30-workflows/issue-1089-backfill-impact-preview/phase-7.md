# Phase 7 — カバレッジ確認

**[実装区分: 実装仕様書 / implementation_mode: new]**

> 本 Phase は実装後の test coverage を可視化する。coverage の対象は **本タスクで変更されたブロックのみ**とし、
> 変更しない既存ブロック・共通基盤（`runResponseSync` 既存挙動 / `useAdminMutation` 本体 / `Button` /
> `AdminSectionCard` / 既存 proxy 経路）は coverage 目標から**除外**する
> （[Feedback BEFORE-QUIT-002] / [Feedback 5]: スコープ外を coverage 目標にしない）。

---

## 1. coverage 対象範囲（変更面のみ・全ファイル一律でない）

| ファイル | 変更ブロック | 担当 test | 目標 |
|---------|-------------|----------|------|
| `apps/api/src/jobs/sync-forms-responses.ts` | `previewResponseSync`（新規関数） | `sync-forms-responses.contract.spec.ts` | line / branch 100% |
| `apps/api/src/routes/admin/responses-sync.ts` | `dryRun` 分岐（`previewResponseSync` 呼出 + 200/500） | `responses-sync.contract.spec.ts` | dryRun 分岐 line / branch 100% |
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema`（新規） | `sync-schemas.spec.ts` | parse 正常 / 異常で branch 網羅 |
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | `runPreview` / `runBackfill`（confirm + 実数埋め込み）/ `canBackfill` gate / 描画分岐 | `ManualFormResyncPanel.spec.tsx` | line / branch を実測し証跡へ残す |

> **対象外（明示）**: `runResponseSync` の既存 write/lock/ledger ブロック・`processResponse`・
> pagination helper の既存被覆部分・`useAdminMutation` 本体・`Button`・`AdminSectionCard`・
> 既存 `?fullSync` route 経路（AC-3 で不変）。これらは本タスクで挙動を変更しないため coverage 目標から除外する。
> pagination helper（`parseHighWaterCursor` / `isAfterHighWater` / `estimateResponseWrites` / `parseAutoPublishFlag`）は
> `previewResponseSync` から呼ばれる経路の被覆のみを対象とし、`runResponseSync` 側の既存被覆は対象外。

---

## 2. branch カバレッジ観点（変更面の分岐網羅）

### `previewResponseSync(env, options)`（backend・read-only 集計）

| branch | カバー条件 | 担当ケース |
|--------|-----------|-----------|
| `formId` 未設定（`options.formId` / `env.GOOGLE_FORM_ID` 双方なし）→ throw | env から formId を外して呼ぶ | TC-P-formid（`previewResponseSync` が throw する） |
| `fullSync=true` → cursor=null から全件 scan | `fullSync:true` で呼び、`listResponses` が since=未指定で呼ばれる | TC-P-full |
| `fullSync` 無し → `readLastCursor(env.DB)`（読取のみ） | DB に lastCursor を seed して差分 scan を確認 | TC-P-incremental |
| `highWater` フィルタ（`isAfterHighWater`）→ 対象外 response は数えない | highWater より古い response を fixture に混ぜ、`responseCount` に含まれないことを assert | TC-P-highwater |
| `responseEmail` 無し response → skip（`responseCount` に数えない） | email 欠落 response を混ぜ、count から除外されることを assert | TC-P-noemail |
| 対象 response → `responseCount += 1` / `estimatedWrites += estimateResponseWrites(...)` | 有効 response 複数で count と推定 writes が一致 | TC-P-count |
| `safetyCounter > 100` → `capped = true` で打ち切り | 100 page 超のページングを fixture で再現し `capped:true` | TC-P-capped |
| write/lock/ledger 非実行（read-only 保証）| `acquireSyncLock` / `start` / `succeed` / `fail` / `processResponse` の spy が **未呼出** | TC-P-noWrite |

### route `dryRun` 分岐（`responses-sync.ts`）

| branch | カバー条件 | 担当ケース |
|--------|-----------|-----------|
| `dryRun=true` 成功 → `{ ok:true, preview }` を 200 で返す | `?dryRun=true&fullSync=true` で 200 + preview body | TC-R-dryrun-ok |
| `dryRun=true` 例外 → `{ ok:false, error:"preview_failed" }` を 500（PII なし） | `previewResponseSync` を throw させ 500・body に PII 無し | TC-R-dryrun-error |
| `dryRun` 無し / `false` → 既存 run 経路（不変・退行なし） | `?fullSync=true`（dryRun 無）で従来 `SyncResultSchema` 応答 | TC-R-run-unchanged（AC-3 退行ガード） |
| 認証ガード（`SYNC_ADMIN_TOKEN` Bearer）が dryRun 分岐の前段で効く | Bearer 無しで 401/403 を確認 | TC-R-auth |

### frontend `SyncPreviewRunResponseSchema` / `SyncPreviewResultSchema`

| branch | カバー条件 | 担当ケース |
|--------|-----------|-----------|
| 正常 parse（`status:"preview"` / `dryRun:true` / 各数値 nonnegative）→ success | 正規 fixture で `safeParse().success === true` | TC-S-preview-ok |
| `status` 不一致 / `dryRun !== true` / 余剰キー（`.strict()`）→ failure | 不正 fixture で `success === false` | TC-S-preview-ng |
| 既存 `SyncResultSchema` が不変（退行なし） | 既存ケースが green のまま | TC-S-legacy（AC-3） |

### frontend `runPreview` / `runBackfill` / `canBackfill`（UI staged flow）

| branch | カバー条件 | 担当ケース |
|--------|-----------|-----------|
| preview 成功 → `previewResult` 設定 / `mode="preview"` / `canBackfill=true` | preview ボタン押下後に backfill ボタンが enable | TC-B9 |
| preview schema mismatch → `previewResult=null` / `mode=null` / `parseError` 表示（`role="alert"`） | 不正 body で `parseError` 表示・backfill disable 維持 | TC-B10 |
| `canBackfill=false`（preview 未実行）→ backfill ボタン disabled | 初期状態で backfill が `disabled` | TC-B11 |
| `runBackfill` confirm true → 実数埋め込み文言で `?fullSync=true` を呼ぶ / `previewResult=null`（consume） | confirm 文言に `responseCount` / `estimatedWrites` が含まれ、実行後 preview が consume | TC-B2（staged 化）/ TC-B12 |
| `runBackfill` confirm false → early return（trigger 未呼出・AC-4） | confirm キャンセルで `?fullSync=true` を呼ばない | TC-B3（維持） |
| 差分 sync 実行 → `mode="run"` / `canBackfill=false`（preview stale 化） | preview 後に差分 sync すると backfill が disable に戻る | TC-B-stale |

---

## 3. concern / dependency edge の可視化（preview → UI → confirm 経路）

```
[UI] manual-sync-backfill-preview 押下
   └─> useAdminMutation(POST ?dryRun=true&fullSync=true)
         └─> [route] dryRun 分岐 → previewResponseSync(env, {fullSync:true, client})
               └─> [job] listResponses ページング（read-only）
                     ├─ isAfterHighWater フィルタ
                     ├─ responseEmail 無し skip
                     └─ estimateResponseWrites 合計
               <─ ResponseSyncPreview { responseCount, estimatedWrites, capped, ... }
         <─ { ok:true, preview }
   └─> SyncPreviewRunResponseSchema.safeParse → previewResult / mode="preview"
   └─> canBackfill = true
[UI] manual-sync-backfill 押下（gate 通過後のみ）
   └─> globalThis.confirm(実数埋め込み文言)  ── AC-4: false なら不実行
         └─> useAdminMutation(POST ?fullSync=true)  ── 既存 run 経路（不変）
```

- **concern 境界**: 集計ロジックは job（backend）に閉じる。UI は件数を**再計算しない**（AC-2）。
- **dependency edge**: UI → route → job は片方向。preview は run 経路の write/lock/ledger ノードへ edge を持たない（read-only 保証）。

---

## 4. coverage 計測コマンド（対象ファイル限定・[FB-UI-02-2] 全件 SIGKILL 回避）

```bash
# backend（preview 関数 + route dryRun 分岐）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/responses-sync.contract.spec.ts

# frontend（preview schema + staged UI）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --coverage \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
```

- coverage レポートのうち **§1 の変更面ファイルのみ**を判定対象とする。他ファイルの数値は本タスクの判定材料にしない（[Feedback 5]）。
- `previewResponseSync` / route dryRun 分岐は line / branch **100%** を目標。`runPreview` / `runBackfill` / `canBackfill` は line / branch の実測値を coverage 証跡として残す（数値固定ではなく実測を記録する方針）。

---

## 完了条件

- [x] coverage 対象を変更面ブロック（`previewResponseSync` / route dryRun 分岐 / preview schema / `runPreview`・`runBackfill`・`canBackfill`）に限定した
- [x] 変更ブロック以外（`runResponseSync` 既存挙動 / 共通基盤 / 既存 `?fullSync` 経路）を対象外と明記した（[Feedback BEFORE-QUIT-002][Feedback 5]）
- [x] `previewResponseSync` の各分岐（highWater フィルタ / responseEmail 無し skip / capped / formId 未設定 / read-only 保証）を branch 観点で列挙した
- [x] route dryRun 分岐 / preview schema / staged UI flow の branch カバレッジ観点を記述した
- [x] preview → UI → confirm の dependency edge と concern 境界を可視化した
- [x] coverage 計測コマンド（targeted 指定）と line/branch 目標・実測方針を提示した
