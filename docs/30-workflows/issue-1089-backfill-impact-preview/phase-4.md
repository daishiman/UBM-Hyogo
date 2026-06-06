# Phase 4 — テスト作成（TDD Red）

**[実装区分: 実装仕様書 / implementation_mode: new]**

> 本タスクは新規実装（`implementation_mode: new`）。本 Phase は Phase 2（SSOT）の契約に対する
> **失敗するテスト（TDD Red）を先に書く**フェーズである。実装（Phase 5）前に、各 TC は
> `previewResponseSync` / `SyncPreviewResultSchema` / preview UI が未実装ゆえ **必ず fail（Red）** する。
> 命名規則・期待値・モック方針を本 Phase で固定し、Phase 5 はこのテストを Green にすることを唯一のゴールとする。

---

## 0. Phase 4 開始前チェック（必須）

> テスト着手前に runtime 整合を確認する。これを怠ると esbuild バージョン不整合で vitest が起動失敗する（[FB-MSO-002]）。

- [ ] `mise exec -- pnpm install`（worktree ごとに `node_modules` が独立するため必須）
- [ ] `mise exec -- pnpm verify:vitest-runtime`（arch / worktree isolation / esbuild version の 3 verify）
- [ ] web の vitest は **リポジトリルートから実行**する（`--filter @ubm-hyogo/web exec vitest run --root=../..`）。web パッケージは unit / d1 の 2 config に分離しているため root glob で解決させる。
- [ ] api の vitest は `--filter @ubm-hyogo/api`。`*.contract.spec.ts` は D1 fixture を伴うため既存 setup を踏襲する。

---

## 1. TDD Red の方針

| 観点 | 方針 |
|------|------|
| Red の対象 | Phase 2 §2（`previewResponseSync` / route dryRun 分岐）・§3（preview schema / staged UI flow） |
| Red の確認 | Phase 5 実装前に全 TC を実行し、`previewResponseSync` 未定義・`SyncPreviewResultSchema` 未 export・`manual-sync-backfill-preview` testid 不在で fail することを確認する |
| 既存 TC の扱い | TC-B1..B8 は既存（landed 済）。TC-B2 は staged 化のため**更新**（§4）。TC-B1/B3..B8 は不退行（AC-3/AC-5・回帰 guard は Phase 6 §回帰 guard） |
| 命名規則（不変条件 #8） | backend=`*.contract.spec.ts` / frontend=`*.spec.{ts,tsx}`。`*.test.*` は `block-test-suffix`（lefthook）・`verify-test-suffix`（GitHub Actions）が reject |

> 命名は Phase 1 §4 inventory / Phase 2 のファイル一覧と完全一致させる。新規ファイルは作らず、既存 4 ファイルへ追加する。

---

## 2. backend テストケース表 — `previewResponseSync`

配置: `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（既存・追加）。`describe("previewResponseSync", ...)` ブロックを新設する。

| TC | シナリオ | 入力 | 期待値 |
|----|---------|------|--------|
| TC-PV1 | 件数カウント正常 | `client.listResponses` が `responseEmail` あり response を 3 件返す（1 ページ） | `responseCount === 3` / `status === "preview"` / `dryRun === true` / `pagesScanned === 1` / `capped === false` |
| TC-PV2 | responseEmail なしは数えない | 5 件中 2 件が `responseEmail` 欠落（残り 3 件あり） | `responseCount === 3`（欠落 2 件は `processResponse` skip 相当ゆえ非カウント・Phase 2 §2.2-6） |
| TC-PV3 | highWater フィルタ | `fullSync:false`＋`readLastCursor` が high-water を返し、一部 response が `isAfterHighWater` を満たさない | フィルタ通過分のみ `responseCount` に計上（`runResponseSync` と同条件） |
| TC-PV4 | write が呼ばれない | spy: `processResponse`（または D1 `env.DB.prepare`/`run`） | `processResponse` spy が **0 回**・D1 write 系 spy が **0 回** |
| TC-PV5 | lock が呼ばれない | spy: `acquireSyncLock` | `acquireSyncLock` spy が **0 回**（preview は二重起動防止対象外・Phase 2 §2.2-3） |
| TC-PV6 | ledger が呼ばれない | spy: `start` / `succeed` / `fail`（sync_jobs ledger） | 3 spy すべて **0 回**（Phase 2 §2.2-4） |
| TC-PV7 | capped（>100 page） | `client.listResponses` が常に `nextPageToken` を返し 100 ページ超走査させる | `capped === true` / `pagesScanned` が 100 page 上限で打ち切り（Phase 2 §2.2-7・DD6） |
| TC-PV8 | estimatedWrites 集計 | `autoPublishEnabled` フラグ別に 2 ケース（off / on）。`estimateResponseWrites` の合計を検算 | `estimatedWrites === Σ estimateResponseWrites(resp, autoPublishEnabled)`。on のとき auto-publish +1 が加算されること（`parseAutoPublishFlag` 共有・Phase 2 §2.2 note） |
| TC-PV9 | formId 未設定 throw | `options.formId` 未指定かつ `env.GOOGLE_FORM_ID` 未設定 | `previewResponseSync` が **throw**（`runResponseSync` と同一の formId 解決・Phase 2 §2.2-1） |
| TC-PV10 | cursor 指定経路 | `options.cursor` 明示指定（fullSync 未指定） | listResponses が指定 cursor を since/pageToken として使う（`runResponseSync` と同一・Phase 2 §2.2-2） |

> **PII 非露出**: TC-PV1..PV10 のいずれも返却 object に `responseEmail` / `responseId` / `questionId` を含めないこと（Phase 2 §2.2-8・不変条件 #7）。assertion で `Object.keys(preview)` が `ResponseSyncPreview` の 6 キーのみであることを確認する。

---

## 3. route テストケース表 — `responses-sync.contract.spec.ts`

配置: `apps/api/src/routes/admin/responses-sync.contract.spec.ts`（既存・追加）。

| TC | シナリオ | リクエスト | 期待値 |
|----|---------|-----------|--------|
| TC-RT1 | dryRun → 200 preview | `POST /admin/sync/responses?dryRun=true`（Bearer 正・client が preview を返すよう mock） | `status 200` / body `{ ok:true, preview:{ status:"preview", dryRun:true, responseCount, estimatedWrites, pagesScanned, capped } }` |
| TC-RT2 | preview 失敗 → 500 | `previewResponseSync`（または `client.listResponses`）が throw | `status 500` / body `{ ok:false, error:"preview_failed" }`（PII を出さない・Phase 2 §2.3） |
| TC-RT3 | 認証は dryRun 前段 | `?dryRun=true` だが Bearer 不一致 / token 未設定 | 既存認証ガードが先に作動し `401`（不一致）/ `500`（token 未設定）。dryRun 分岐へ到達しない（Phase 2 §2.3 「認証は前段」） |
| TC-RT4 | dryRun + fullSync 伝播 | `?dryRun=true&fullSync=true` | `previewResponseSync` が `options.fullSync === true` で呼ばれること（spy で引数検証・Phase 2 §2.3 の `...(fullSync ? { fullSync: true } : {})`） |
| TC-RT5 | dryRun 既定 false（後方互換） | `?fullSync=true`（`dryRun` 指定なし） | dryRun 分岐に入らず既存 `runResponseSync` 経路（200/409/500）が作動。preview 経路を呼ばない |

> TC-RT5 は AC-3（既存契約不退行）の route レベル guard。`dryRun` 未指定で preview 経路が混入しないことを保証する。

---

## 4. frontend schema テスト — `sync-schemas.spec.ts`

配置: `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`（既存・追加）。`describe("SyncPreviewResultSchema / SyncPreviewRunResponseSchema", ...)` を新設。

| TC | 対象 | 入力 | 期待 |
|----|------|------|------|
| TC-S8 | `SyncPreviewResultSchema` valid | `{ status:"preview", dryRun:true, responseCount:3, estimatedWrites:4, pagesScanned:1, capped:false }` | parse 成功・各値保持 |
| TC-S9 | status 誤り拒否 | `{ ...valid, status:"succeeded" }` | **reject**（`z.literal("preview")`） |
| TC-S10 | dryRun:false 拒否 | `{ ...valid, dryRun:false }` | **reject**（`z.literal(true)`） |
| TC-S11 | 余剰キー拒否（.strict） | `{ ...valid, extra:1 }` | **reject**（`.strict()`） |
| TC-S12 | nonnegative / int 違反 | `{ ...valid, responseCount:-1 }` / `{ ...valid, estimatedWrites:1.5 }` | **reject**（`z.number().int().nonnegative()`） |
| TC-S13 | `SyncPreviewRunResponseSchema` valid | `{ ok:true, preview:<valid> }` | parse 成功・`preview.responseCount` 取得可 |
| TC-S14 | `SyncPreviewRunResponseSchema` 異常 | `{ ok:false, preview:<valid> }` / `{ ok:true, preview:{...invalid} }` | **reject**（`ok` は `z.literal(true)`・preview は内側 schema 検証） |

> **既存不変（AC-3）**: 同ファイルの `SyncResultSchema` / `SyncRunResponseSchema` 既存 TC（TC-S1..S7）は 1 件も変更しない。preview schema は **追加 describe** として共存させる。

---

## 5. UI テストケース表 — `ManualFormResyncPanel.spec.tsx`

配置: `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx`（既存・追加 / TC-B2 更新）。

### 5.1 既存 TC（TC-B1..B8・維持。TC-B2 のみ staged 化）

| TC | シナリオ | トリガ | 期待 | 変更 |
|----|---------|--------|------|------|
| TC-B1 | 差分 sync 実行 → 結果表示 | `manual-sync-run` click | `runTriggerMock` が `({}, "/api/admin/sync/responses?fullSync=false")` で呼ばれる / `writeCount` 値 + `run` モード表示 | 維持 |
| TC-B2 | 全件 backfill（preview → confirm 承認） | `manual-sync-backfill-preview` click → preview 表示 → `manual-sync-backfill` click（`confirm` → true） | preview 後に `backfillTriggerMock` が `({}, "...?fullSync=true")` で呼ばれる / `backfill` 表示 | **更新（staged 化・AC-5）** |
| TC-B3 | confirm キャンセル | preview 後 `manual-sync-backfill` click（`confirm` → false） | `backfillTriggerMock` が**呼ばれない**（AC-4） | 維持 |
| TC-B4 | pending 中の二重起動防止 | `h.runState.isLoading = true` で render | `manual-sync-run` / `manual-sync-backfill` / `manual-sync-backfill-preview` の `disabled` が全て `true`（`busy` 配線） | 維持（3 ボタンへ拡張） |
| TC-B5 | 409 sync_in_progress 検知 | `h.runState.error = FetchAuthedError(409, {ok:false,result:{status:"skipped",...}})` で render | `role="status"`「他の sync が実行中です」/ 結果テーブル非描画 | 維持 |
| TC-B6 | HTTP error | `h.runState.error = new Error("sync failed")` で render | `role="alert"` に message / 結果テーブル非描画 | 維持 |
| TC-B7 | schema mismatch（run 経路） | `runTriggerMock.mockResolvedValueOnce({ foo:1 })` → run click | `role="alert"`「sync result schema mismatch」/ 結果テーブル非描画 | 維持 |
| TC-B8 | 差分成功 → onSynced | `onSynced` prop 注入 → run click | `onSynced` が `{ status:"succeeded", writeCount:2 }`（`objectContaining`）で呼ばれる | 維持 |

> **TC-B2 更新理由（test 内コメント + 本表に記録・AC-5）**: 件数プレビュー導入により backfill は `canBackfill` gate（preview 後のみ enable）へ変更。TC-B2 は「preview 実行 → preview 結果表示 → confirm 承認 → `?fullSync=true`」の staged flow で **等価の承認保証**を担保する。confirm 承認後に `?fullSync=true` が呼ばれる不変条件は維持する。

### 5.2 新規 TC（TC-B9..B12）

| TC | シナリオ | トリガ | 期待 |
|----|---------|--------|------|
| TC-B9 | 影響件数を確認 → preview 表示 | `manual-sync-backfill-preview` click（`previewMutation` が `{ ok:true, preview:{ responseCount:7, estimatedWrites:9, pagesScanned:1, capped:false } }` を resolve） | `previewTriggerMock` が `({}, "/api/admin/sync/responses?dryRun=true&fullSync=true")` で呼ばれる / preview パネルに `responseCount=7`（実数）/ `estimatedWrites=9`（「推定」ラベル付き）/ `pagesScanned` / `capped` 表示 |
| TC-B10 | canBackfill gate | (a) 初期 render（preview 未実行）/ (b) preview 成功後 | (a) `manual-sync-backfill` の `disabled === true`（`!canBackfill`）/ (b) preview 成功後に `disabled === false`（enable） |
| TC-B11 | confirm 文言の実数埋込・cancel 不実行 | preview 成功（`responseCount:7,estimatedWrites:9`）→ `manual-sync-backfill` click（`confirm` → false） | `globalThis.confirm` が `全 7 件の回答を再取込します（推定 9 write）。実行しますか?` で呼ばれる / `confirm` false ゆえ `backfillTriggerMock` が**呼ばれない**（AC-4） |
| TC-B12 | preview schema mismatch | `manual-sync-backfill-preview` click（`previewMutation` が `{ ok:true, preview:{ foo:1 } }` を resolve） | `role="alert"`「preview result schema mismatch」/ preview パネル非描画 / `manual-sync-backfill` が `disabled`（`canBackfill=false`・件数取得不可表示・AC-1 代替表示） |

> **capped 表示の補助確認（TC-B9 拡張）**: `preview.capped === true` のケースを追加し「上限到達: 一部のみ集計」注記が描画されることを確認する（Phase 2 §3.2 表示）。

---

## 6. private / internal state テスト方針（[VSCPKR-03]）

- 操作対象は internal state（`mode` / `previewResult` / `activeMode` / `parseError`）だが、**直接 set せず DOM 越しに観測**する。`mode === "preview"` は preview パネルの描画有無で、`canBackfill` は `manual-sync-backfill` の `disabled` 属性で間接検証する（VSCPKR-03 の「private state は表示結果越し」）。
- `lastResult` / `previewResult` を直接書き換えるテストは書かない。preview 表示は `previewMutation.trigger` の resolve 値経由でのみ駆動する。
- `useAdminMutation` の戻り値（`isLoading` / `error`）は**外部依存**。pending・error の検証は hook モックの state 容器（`h.runState` / `h.backfillState` / `h.previewState`）を書き換えて再 render する。
- `window.api` 等のグローバルモックは **`Object.defineProperty`** で差し替える（[Feedback VSCPKR-02]・直接代入で TypeError になるグローバルを回避）。`globalThis.confirm` は `vi.spyOn(globalThis, "confirm").mockReturnValue(true/false)`。
- mutation インスタンス振り分け: `ManualFormResyncPanel` は `useAdminMutation` を **run / backfill / preview の順で 3 回**呼ぶ。`vi.hoisted` の `hookCallCount` で 0→run / 1→backfill / 2→preview に割り当てる（順序が正本）。
- `beforeEach` で全 mock reset（`mockReset` / `hookCallCount = 0` / 既定 resolve 値 / state 初期化 / `confirm` spy）。`afterEach` で `cleanup()` + `vi.restoreAllMocks()`。

---

## 7. 検証コマンド（Red 確認 → 各 TC が fail すること）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/responses-sync.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
```

- 期待（Red）: 新規 TC（TC-PV1..10 / TC-RT1..5 / TC-S8..14 / TC-B9..12）と更新した TC-B2 が **fail**。`previewResponseSync` 未定義・`SyncPreviewResultSchema` 未 export・`manual-sync-backfill-preview` 不在が原因。
- TC-B1/B3..B8 / TC-S1..S7 は既存実装で **green**のまま（不退行ベースライン）。

---

## 完了条件

- [ ] Phase 4 開始前チェック（`pnpm install` + esbuild 整合 [FB-MSO-002]）を明記した
- [ ] TDD Red の方針と命名整合（不変条件 #8・`*.spec.{ts,tsx}` / `*.contract.spec.ts`）を記述した
- [ ] backend TC-PV1..PV10（件数 / no-write / no-lock / no-ledger / capped / estimatedWrites / formId throw）を期待値付きで定義した
- [ ] route TC-RT1..RT5（dryRun 200 / preview_failed 500 / 認証前段 / fullSync 伝播 / 後方互換）を定義した
- [ ] schema TC-S8..S14（preview schema 正常 / status / dryRun / strict / nonnegative / wrapper）を定義した
- [ ] UI TC-B1..B8 維持（TC-B2 staged 化）+ 新規 TC-B9..B12（preview 表示 / canBackfill / confirm 実数埋込 cancel / schema mismatch）を定義した
- [ ] private/internal state 方針（[VSCPKR-03]・`Object.defineProperty` [VSCPKR-02]）を記述した
- [ ] Red 確認コマンドと「新規 TC が fail・既存 TC は green」のベースラインを提示した
