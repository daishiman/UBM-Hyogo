# Phase 2 — 設計

**[実装区分: 実装仕様書 / implementation_mode: new]**

> 本 Phase は後続 Phase 4〜13 の **SSOT（Single Source of Truth）**。契約・関数シグネチャ・状態所有権を
> ここで固定する。実装・テストはすべて本 Phase の定義に従う。

---

## 1. システム思考 / 因果・責務境界

### 因果ループ（バランスループ）

> 「破壊的 backfill の不安 → 件数の事前確認欲求 → dry-run プレビュー → 実数提示で承認の確信 →
> 安全な実行」。プレビューが古い（stale）と確信が崩れるため、**preview 後に他操作が走ったら preview を無効化**
> するバランスを設ける（`canBackfill` を `mode === "preview"` に gate）。

### 責務境界（状態所有権）

| レイヤ | 責務 | 所有する状態 |
|--------|------|-------------|
| UI（`ManualFormResyncPanel`） | ボタン操作・confirm・結果/件数表示・staleness gate | `lastResult` / `previewResult` / `mode` / `activeMode` / `parseError` |
| diagnostics（`manual-sync.ts`） | wire 契約の zod 宣言（`apps/api` 非 import） | 型・schema・path 定数 |
| proxy（`route.ts`） | server-only Bearer 注入（無改変） | — |
| route（`responses-sync.ts`） | `?dryRun` 分岐・認証 | — |
| job（`sync-forms-responses.ts`） | Forms API 読取・件数集計（preview）/ 書込（run・既存） | sync_jobs ledger（run のみ）/ sync lock（run のみ） |

> **混在禁止**: preview は job レイヤの **read-only** 集計に閉じる。UI へ集計ロジックを置かない（AC-2）。

---

## 2. backend 契約（SSOT）

### 2.1 `ResponseSyncPreview` 型（`sync-forms-responses.ts` に追加）

```ts
export interface ResponseSyncPreview {
  readonly status: "preview";        // run の "succeeded"/"failed"/"skipped" と区別する固定リテラル
  readonly dryRun: true;             // 常に true（BackfillResult の dryRun:boolean と整合）
  readonly responseCount: number;    // 実数: listResponses をページングして数えた "処理対象" response 数
  readonly estimatedWrites: number;  // 推定: 対象 response の estimateResponseWrites 合計（UI で "推定" とラベル）
  readonly pagesScanned: number;     // ページング走査ページ数（capped 判定の根拠）
  readonly capped: boolean;          // safetyCounter 上限(100)に達して打ち切ったか
}
```

### 2.2 `previewResponseSync(env, options)` 関数（`sync-forms-responses.ts` に追加）

```ts
export interface ResponseSyncPreviewOptions {
  readonly fullSync?: boolean;       // true=全件(cursor=null から) / false=差分(lastCursor から)
  readonly cursor?: string;
  readonly client: GoogleFormsClient;
  readonly formId?: string;
}

export async function previewResponseSync(
  env: ResponseSyncEnv,
  options: ResponseSyncPreviewOptions,
): Promise<ResponseSyncPreview>;
```

**実装規約（不変条件 #3 read-only を厳守）:**

1. `formId` 解決は `runResponseSync` と同一（`options.formId ?? env.GOOGLE_FORM_ID`・未設定は throw）。
2. cursor 決定は `runResponseSync` と同一ロジックを **共有**: `fullSync` → `null` / `cursor` 指定 → それ / それ以外 → `readLastCursor(env.DB)`（読取のみ）。
3. `acquireSyncLock` を **呼ばない**（preview は read-only ゆえ二重起動防止対象外）。
4. `start` / `succeed` / `fail`（sync_jobs ledger）を **呼ばない**。
5. `processResponse` を **呼ばない**（D1 write ゼロ）。
6. `options.client.listResponses` で `runResponseSync` と同じ since/pageToken でページングし、各 response について:
   - `highWater` フィルタ（`isAfterHighWater`）を `runResponseSync` と同条件で適用し、対象外は数えない。
   - `responseEmail` が無い response は `processResponse` が skip（writeCount 0）するため **responseCount に数えない**（実挙動に整合）。
   - 対象 response は `responseCount += 1` / `estimatedWrites += estimateResponseWrites(resp, autoPublishEnabled)`。
7. write cap（200）による早期打ち切りは preview では適用しない（影響全体を見せるため）。代わりに `safetyCounter > 100` で `capped = true` にして打ち切る（`runResponseSync` のループ overflow guard と同値の上限）。
8. PII を一切返さない（件数のみ）。例外時は throw せず route 側で 500 に変換（§2.3）。

> **autoPublishEnabled**: `parseAutoPublishFlag(env)` を共有して `estimateResponseWrites` の +1 を整合させる。

### 2.3 route 分岐（`responses-sync.ts`）

```ts
const dryRun = c.req.query("dryRun") === "true";   // 既定 false（後方互換）
const fullSync = c.req.query("fullSync") === "true";
const cursor = c.req.query("cursor");
const client = deps.buildClient(c.env);

if (dryRun) {
  try {
    const preview = await previewResponseSync(c.env, {
      client,
      ...(fullSync ? { fullSync: true } : {}),
      ...(cursor !== undefined ? { cursor } : {}),
    });
    return c.json({ ok: true, preview }, 200);
  } catch (err) {
    return c.json({ ok: false, error: "preview_failed" }, 500);  // PII を出さない
  }
}
// 既存 run 経路（不変）
const opts = { trigger: "admin" as const, client, ...(fullSync ? { fullSync: true } : {}), ...(cursor !== undefined ? { cursor } : {}) };
const result = await runResponseSync(c.env, opts);
// ...既存 200/409/500 分岐（不変）
```

- 認証（`SYNC_ADMIN_TOKEN` Bearer）は既存ガードの **前段**で実行（dryRun 分岐より前）。無改変。
- proxy（`route.ts`）の `needsSyncAdminBearer` は path 判定のみで query を見ないため、`?dryRun=true` でも Bearer 注入が効く。**無改変**。

---

## 3. frontend 契約（SSOT）

### 3.1 schema（`diagnostics/manual-sync.ts` に追加 — 既存は不変）

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

> `SyncResultSchema` / `SyncRunResponseSchema` / `SYNC_RESPONSES_PATH` は **1 文字も変更しない**（AC-3）。

### 3.2 UI staged flow（`ManualFormResyncPanel.client.tsx`）

**状態（state ownership）:**

```ts
const [lastResult, setLastResult] = useState<SyncResult | null>(null);
const [previewResult, setPreviewResult] = useState<SyncPreviewResult | null>(null);
const [mode, setMode] = useState<"run" | "backfill" | "preview" | null>(null);
const [activeMode, setActiveMode] = useState<"run" | "backfill" | "preview" | null>(null);
const [parseError, setParseError] = useState<string | null>(null);
```

**mutation hook**: 既存 2 つに加え preview 用 1 つ（`useAdminMutation<unknown>(SYNC_RESPONSES_PATH, "POST", {...})`）。

**staleness gate:**

```ts
const canBackfill = previewResult !== null && mode === "preview";
```

- preview 実行成功 → `mode="preview"` / `previewResult=...` → backfill ボタン enable。
- 差分 sync または backfill 実行 → `mode` が "run"/"backfill" になり `canBackfill=false`（preview は consume・stale 化）。実行時に `setPreviewResult(null)` でも明示クリアする。

**ボタン構成（3 ボタン）:**

| testid | label | variant | disabled | 経路 |
|--------|-------|---------|----------|------|
| `manual-sync-run` | 差分 sync | primary | `busy` | `?fullSync=false`（既存・不変） |
| `manual-sync-backfill-preview` | 影響件数を確認 | soft | `busy` | `?dryRun=true&fullSync=true`（新規） |
| `manual-sync-backfill` | 全件 backfill | danger | `busy \|\| !canBackfill` | `?fullSync=true`（既存・preview gate を追加） |

**preview 実行:**

```ts
const runPreview = async () => {
  setParseError(null);
  setActiveMode("preview");
  try {
    const raw = await previewMutation.trigger({}, `${SYNC_RESPONSES_PATH}?dryRun=true&fullSync=true`);
    const parsed = SyncPreviewRunResponseSchema.safeParse(raw);
    if (!parsed.success) { setPreviewResult(null); setMode(null); setParseError("preview result schema mismatch"); return; }
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
  if (!globalThis.confirm(msg)) return;       // AC-4: cancel で early return（不実行）
  setParseError(null);
  setPreviewResult(null);                      // preview consume
  const raw = await backfillMutation.trigger({}, `${SYNC_RESPONSES_PATH}?fullSync=true`);
  applyResponse(raw, "backfill");
};
```

**表示:**

- `mode === "preview"` のとき preview パネル: `responseCount`（実数）/ `estimatedWrites`（「推定」ラベル付き）/ `pagesScanned` / `capped`（true なら「上限到達: 一部のみ集計」注記）。
- `mode === "run" | "backfill"` のとき既存 `resultRows(lastResult)` 結果テーブル（不変）。
- preview 失敗時は `parseError` を `role="alert"` で表示し、件数取得不可を明示（AC-1 の代替表示）。

---

## 4. ステップ間 state 引き渡しテーブル（[Feedback W1-02b-2]）

| 起点操作 | 更新する state | `canBackfill` への影響 |
|---------|---------------|----------------------|
| 影響件数を確認 成功 | `previewResult=preview` / `mode="preview"` | true（backfill 可能に） |
| 影響件数を確認 失敗 | `previewResult=null` / `mode=null` / `parseError` | false |
| 差分 sync 実行 | `lastResult=result` / `mode="run"` | false（preview 無効化） |
| 全件 backfill 実行 | `previewResult=null` / `lastResult=result` / `mode="backfill"` | false（再 preview 必須） |

---

## 5. 設計判断（D7 再判断を含む）

| ID | 判断 | 根拠 |
|----|------|------|
| DD1 | preview は `runResponseSync` への dryRun フラグ追加ではなく **別関数 `previewResponseSync`** で実装 | `runResponseSync` は lock/ledger/write cap/PII redact の重い不変条件を持つ。dryRun 分岐を内挿すると回帰リスク大。pagination helper のみ共有し write path と分離（責務境界） |
| DD2 | preview の影響単位は `responseCount`（実数）主・`estimatedWrites`（推定）従 | AC-2（実数）を満たす。write 数は `estimateResponseWrites` のヒューリスティックゆえ「推定」と明示 |
| DD3 | **D7 再判断**: 自前 dialog を採らず staged 2 段（dry-run ボタン → confirm 文言に実数埋め込み） | 親 Task B Phase 3 §5 D7「自前 dialog は over-scope」を維持。`globalThis.confirm` 継続で D7 整合。`BackfillPublishStatePanel` の staged パターンと UX 統一 |
| DD4 | backfill は preview 後のみ enable（`canBackfill` gate） | AC-1（承認前に件数提示）を構造的に保証。`BackfillPublishStatePanel.canApply` と同設計 |
| DD5 | preview は常に `fullSync=true` scope を見る | backfill が `?fullSync=true` のため、preview も全件 scope を提示して整合させる |
| DD6 | preview の write cap 無効化・`capped`(>100 page) で打ち切り | 影響全体を見せるのが目的。ただし暴走防止に `runResponseSync` と同じ 100 page 上限を共有 |

---

## 6. 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 要素 | 再利用 | 備考 |
|------|--------|------|
| `Button` / `AdminSectionCard` | ✅ 再利用 | 新規 primitive を生やさない（不変条件: prototype alignment §3） |
| dry-run UI パターン | ✅ `BackfillPublishStatePanel` を踏襲 | `mode` / `activeMode` / `canX` gate / 結果テーブル構造 |
| pagination helper | ✅ `sync-forms-responses.ts` 内既存関数を共有 | `parseHighWaterCursor` / `isAfterHighWater` / `maxHighWater` / `estimateResponseWrites` / `parseAutoPublishFlag` |
| 自前 dialog component | ❌ 不採用 | DD3（D7 再判断） |

---

## 完了条件

- [x] 因果ループ・責務境界・状態所有権を固定した
- [x] backend 契約（`ResponseSyncPreview` / `previewResponseSync` / route 分岐）を SSOT 化した
- [x] frontend 契約（preview schema / staged UI flow / staleness gate）を SSOT 化した
- [x] ステップ間 state 引き渡しテーブルを定義した（[Feedback W1-02b-2]）
- [x] 設計判断 DD1..DD6（D7 再判断含む）を記録した
- [x] 既存コンポーネント再利用可否を判定した（[FB-SDK-07-1]）
