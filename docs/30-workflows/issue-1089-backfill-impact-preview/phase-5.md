# Phase 5 — 実装

**[実装区分: 実装仕様書 / implementation_mode: new]**

> Phase 4 で Red にしたテストを Green にする実装フェーズ。実装は Phase 2（SSOT）の契約・関数シグネチャ・
> 状態所有権に**厳密に従う**。本 Phase はコードそのものではなく、擬似コード・手順・実行/DoD を仕様として固定する。
> 既存契約（`SyncResultSchema` / `?fullSync` / run 経路）は **1 文字も変更しない**（AC-3）。

---

## 1. 新規作成 / 修正ファイルパス一覧（[Feedback RT-03] / Phase 1 §5 整合）

| パス | 区分 | 実装内容 |
|------|------|---------|
| `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | `ResponseSyncPreview` 型 + `ResponseSyncPreviewOptions` 型 + `previewResponseSync(env, options)` 追加。pagination helper（`parseHighWaterCursor` / `isAfterHighWater` / `maxHighWater` / `estimateResponseWrites` / `parseAutoPublishFlag`）を共有。write / lock / ledger 非実行 |
| `apps/api/src/routes/admin/responses-sync.ts` | 編集 | `c.req.query("dryRun") === "true"` 分岐で `previewResponseSync` を呼び `{ ok:true, preview }` を返す。失敗は `{ ok:false, error:"preview_failed" }` 500。既存 `?fullSync`/`?cursor`/run 経路は不変 |
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | 編集 | `SyncPreviewResultSchema` / `SyncPreviewRunResponseSchema` / 型 追加。`SyncResultSchema` / `SyncRunResponseSchema` / `SYNC_RESPONSES_PATH` は不変 |
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 編集 | preview ボタン（`manual-sync-backfill-preview`）/ preview 件数表示パネル / `canBackfill` gate / confirm 文言への実数埋め込み / preview staleness クリア |

> backend 2 + frontend 2 = 計 4 ファイル編集。新規ファイルは作らない。`apps/web` は zod 再宣言で契約を持ち `apps/api` を import しない（不変条件 #5）。

---

## 2. backend 実装手順

### 2.1 `ResponseSyncPreview` 型（Phase 2 §2.1）

```ts
export interface ResponseSyncPreview {
  readonly status: "preview";
  readonly dryRun: true;
  readonly responseCount: number;
  readonly estimatedWrites: number;
  readonly pagesScanned: number;
  readonly capped: boolean;
}

export interface ResponseSyncPreviewOptions {
  readonly fullSync?: boolean;
  readonly cursor?: string;
  readonly client: GoogleFormsClient;
  readonly formId?: string;
}
```

### 2.2 `previewResponseSync(env, options)` 擬似コード（Phase 2 §2.2 の実装規約 8 項目を手順化）

```text
function previewResponseSync(env, options):
  # 1. formId 解決（runResponseSync と同一・未設定 throw）
  formId = options.formId ?? env.GOOGLE_FORM_ID
  if not formId: throw Error("GOOGLE_FORM_ID is not configured")

  # 2. cursor 決定（runResponseSync と同一・読取のみ）
  if options.fullSync:        since = null
  elif options.cursor != undefined: since = options.cursor
  else:                       since = await readLastCursor(env.DB)   # 読取のみ・write しない

  # autoPublish フラグ共有（estimateResponseWrites の +1 整合）
  autoPublishEnabled = parseAutoPublishFlag(env)
  highWater = parseHighWaterCursor(since)

  responseCount = 0
  estimatedWrites = 0
  pagesScanned = 0
  capped = false
  pageToken = null
  safetyCounter = 0

  # 6. listResponses をページング（runResponseSync と同じ since/pageToken）
  loop:
    safetyCounter += 1
    # 7. capped: safetyCounter > 100 で打ち切り（runResponseSync の overflow guard と同値）
    if safetyCounter > 100:
      capped = true
      break
    page = await options.client.listResponses(formId, { since, pageToken })
    pagesScanned += 1
    for resp in page.responses:
      # 6a. highWater フィルタ（runResponseSync と同条件）
      if not isAfterHighWater(resp, highWater): continue
      # 6b. responseEmail 無は processResponse が skip → 数えない（実挙動整合）
      if not resp.responseEmail: continue
      responseCount += 1
      estimatedWrites += estimateResponseWrites(resp, autoPublishEnabled)
    pageToken = page.nextPageToken
    if not pageToken: break

  # 8. PII を返さない（件数のみ）
  return { status: "preview", dryRun: true, responseCount, estimatedWrites, pagesScanned, capped }
```

> **禁止呼び出し（不変条件 #3・read-only）**: `acquireSyncLock`（規約 3）/ `start`・`succeed`・`fail`（sync_jobs ledger・規約 4）/ `processResponse`（D1 write・規約 5）を **一切呼ばない**。write cap（200）による早期打ち切りも適用しない（規約 7）。例外は throw せず route 側で 500 に変換（§2.3 / 規約 8）。

### 2.3 route 分岐（Phase 2 §2.3 / `responses-sync.ts`）

```text
# 認証ガード（SYNC_ADMIN_TOKEN Bearer）は既存どおり dryRun 分岐より前段で実行（無改変）
dryRun  = c.req.query("dryRun")  === "true"   # 既定 false（後方互換）
fullSync = c.req.query("fullSync") === "true"
cursor  = c.req.query("cursor")
client  = deps.buildClient(c.env)

if dryRun:
  try:
    preview = await previewResponseSync(c.env, {
      client,
      ...(fullSync ? { fullSync: true } : {}),
      ...(cursor !== undefined ? { cursor } : {}),
    })
    return c.json({ ok: true, preview }, 200)
  catch err:
    return c.json({ ok: false, error: "preview_failed" }, 500)   # PII を出さない

# 既存 run 経路（不変・触らない）
opts = { trigger: "admin", client, ...(fullSync ? {fullSync:true}:{}) , ...(cursor!==undefined ? {cursor}:{}) }
result = await runResponseSync(c.env, opts)
# ...既存 200 / 409 / 500 分岐（不変）
```

> proxy（`app/api/admin/[...path]/route.ts`）の `needsSyncAdminBearer` は path 判定のみで query を見ないため、`?dryRun=true` でも Bearer 注入が効く。**無改変**（Phase 2 §2.3）。

---

## 3. frontend 実装手順

### 3.1 schema 追加（Phase 2 §3.1・既存不変を強調）

`diagnostics/manual-sync.ts` に **追加のみ**。`SyncResultSchema` / `SyncRunResponseSchema` / `SYNC_RESPONSES_PATH` は **1 文字も変更しない**（AC-3）。

```ts
export const SyncPreviewResultSchema = z
  .object({
    status: z.literal("preview"),
    dryRun: z.literal(true),
    responseCount: z.number().int().nonnegative(),
    estimatedWrites: z.number().int().nonnegative(),
    pagesScanned: z.number().int().nonnegative(),
    capped: z.boolean(),
  })
  .strict();
export type SyncPreviewResult = z.infer<typeof SyncPreviewResultSchema>;

export const SyncPreviewRunResponseSchema = z
  .object({ ok: z.literal(true), preview: SyncPreviewResultSchema })
  .strict();
```

### 3.2 UI staged flow（Phase 2 §3.2・`ManualFormResyncPanel.client.tsx`）

**状態（state ownership）:**

```ts
const [lastResult, setLastResult] = useState<SyncResult | null>(null);
const [previewResult, setPreviewResult] = useState<SyncPreviewResult | null>(null);
const [mode, setMode] = useState<"run" | "backfill" | "preview" | null>(null);
const [activeMode, setActiveMode] = useState<"run" | "backfill" | "preview" | null>(null);
const [parseError, setParseError] = useState<string | null>(null);
```

**mutation hook**: 既存 run / backfill の 2 つに加え、preview 用 1 つ（`useAdminMutation<unknown>(SYNC_RESPONSES_PATH, "POST", {...})`）を **run / backfill / preview の順**で宣言する（Phase 4 §6 のモック振り分け順と一致）。`@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）。

**staleness gate:**

```ts
const canBackfill = previewResult !== null && mode === "preview";
const busy = runMutation.isLoading || backfillMutation.isLoading || previewMutation.isLoading;
```

**preview 実行（`runPreview`）:**

```ts
const runPreview = async () => {
  setParseError(null);
  setActiveMode("preview");
  try {
    const raw = await previewMutation.trigger({}, `${SYNC_RESPONSES_PATH}?dryRun=true&fullSync=true`);
    const parsed = SyncPreviewRunResponseSchema.safeParse(raw);
    if (!parsed.success) {
      setPreviewResult(null); setMode(null);
      setParseError("preview result schema mismatch");
      return;
    }
    setPreviewResult(parsed.data.preview);
    setMode("preview");
  } finally { setActiveMode(null); }
};
```

**backfill 実行（confirm 文言に実数埋め込み・D7 整合）:**

```ts
const runBackfill = async () => {
  const count = previewResult?.responseCount ?? null;
  const msg = count !== null
    ? `全 ${count} 件の回答を再取込します（推定 ${previewResult!.estimatedWrites} write）。実行しますか?`
    : "Google Forms 回答を fullSync=true で再取込します。実行しますか?";
  if (!globalThis.confirm(msg)) return;   // AC-4: cancel で early return（不実行）
  setParseError(null);
  setPreviewResult(null);                  // preview consume（stale 化）
  const raw = await backfillMutation.trigger({}, `${SYNC_RESPONSES_PATH}?fullSync=true`);
  applyResponse(raw, "backfill");          // mode="backfill" へ（canBackfill=false）
};
```

**3 ボタン構成（Phase 2 §3.2 表）:**

| testid | label | variant | disabled | 経路 |
|--------|-------|---------|----------|------|
| `manual-sync-run` | 差分 sync | primary | `busy` | `?fullSync=false`（既存・不変） |
| `manual-sync-backfill-preview` | 影響件数を確認 | soft | `busy` | `?dryRun=true&fullSync=true`（新規 / `runPreview`） |
| `manual-sync-backfill` | 全件 backfill | danger | `busy \|\| !canBackfill` | `?fullSync=true`（既存・`runBackfill` / preview gate 追加） |

**preview 表示パネル（`mode === "preview"`）:**

- `responseCount`（実数・主指標）
- `estimatedWrites`（「推定」ラベル付き・従指標・AC-2 で UI 推定でないことを明示）
- `pagesScanned`
- `capped === true` のとき「上限到達: 一部のみ集計」注記

**staleness クリア:**

- 差分 sync（`runMutation` 経由 `applyResponse(raw, "run")`）実行時に `mode="run"` へ → `canBackfill=false`。`setPreviewResult(null)` でも明示クリアする。
- backfill 実行時に `setPreviewResult(null)` + `mode="backfill"`（再 preview 必須・Phase 2 §4）。

**表示分岐の優先順位:** `parseError`（`role="alert"`・件数取得不可表示）> `mode==="preview"`（preview パネル）> `mode==="run"|"backfill"`（既存 `resultRows(lastResult)` 結果テーブル・不変）。

> 色は OKLch トークン（`var(--ubm-color-*)`）のみ・HEX 直書き禁止（不変条件 #2）。`Button` / `AdminSectionCard` を再利用し新規 primitive を生やさない（Phase 2 §6）。

---

## 4. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/responses-sync.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
mise exec -- pnpm lint
```

---

## 5. DoD（Definition of Done）

- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` / `--filter @ubm-hyogo/web typecheck` が型エラー 0。
- Phase 4 の新規/更新 TC（TC-PV1..10 / TC-RT1..5 / TC-S8..14 / TC-B2 staged / TC-B9..12）が全て **green**。
- 既存 TC（TC-B1/B3..B8 / TC-S1..S7）が不退行（AC-3/AC-5）。
- `mise exec -- pnpm lint` が違反 0（HEX 直書き / `no-restricted-globals` 含む）。
- `git diff dev...HEAD --name-only` が §1 の 4 ファイルのみ（D1 migration / Form schema / `processResponse` 改変なし）。

---

## 完了条件

- [ ] 新規/修正ファイルパス一覧（§1・Phase 1 §5 整合）を提示した
- [ ] `previewResponseSync` の擬似コードを実装規約 8 項目（lock/ledger/processResponse 非呼出を明記）として手順化した
- [ ] `ResponseSyncPreview` / `ResponseSyncPreviewOptions` 型と route dryRun 分岐（Phase 2 §2.3）を記述した
- [ ] schema 追加（既存不変を強調）と UI staged flow（`runPreview`/`runBackfill`/`canBackfill`/3 ボタン/preview パネル/staleness クリア）を Phase 2 §3 のコード断片付きで記述した
- [ ] 実行コマンド（api/web typecheck・targeted vitest・lint）を提示した
- [ ] DoD（型 OK・対象テスト green・既存不退行・4 ファイル限定差分）を定義した
