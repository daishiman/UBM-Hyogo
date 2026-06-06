**[実装区分: 実装仕様書 / implementation_mode: new]**

# Phase 5 — 実装（GREEN）

## 目的

Phase 4 で追加した RED テストを GREEN にする最小実装を行う。backend で `durationMs`（取込所要時間・非負整数ミリ秒）を計測して `ResponseSyncResult` の 3 経路すべてで返し、frontend の zod schema・UI 表示行をそれに追従させる。**backend + frontend を 1 サイクルで完結**させ、先送りしない。

## 不変条件（再掲・厳守）

- D1 への直接アクセスは `apps/api` に閉じる（本実装は backend 計時のみで D1 アクセスを増やさない）。
- 色は扱わない（HEX 直書き禁止の対象外。`durationMs` 行は既存 `<dl>` のスタイルをそのまま流用）。
- route `apps/api/src/routes/admin/responses-sync.ts` は result 素通しのため **変更不要**。
- 実装の実行（commit / PR / staging deploy）は user-gated。本仕様書は手順記述のみ。

## 新規作成 / 修正ファイルパス一覧（[Feedback RT-03] 必須）

| 区分 | パス | 変更概要 |
|------|------|----------|
| 修正 | `apps/api/src/jobs/sync-forms-responses.ts` | `ResponseSyncResult` に `durationMs` 追加（required）。`runResponseSync` に計時行追加。3 return に `durationMs` 付与 |
| 修正 | `apps/web/src/features/admin/diagnostics/manual-sync.ts` | `SyncResultSchema` に `durationMs: z.number().int().nonnegative().optional()` 追加（`.strict()` 維持）|
| 修正 | `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | `resultRows` に `["durationMs", result.durationMs ?? "-"]` 行追加 |
| （新規作成なし） | — | 新規ソースファイルは作らない。新規はテストのみ（Phase 4 / Phase 6） |

> 修正対象は 3 ファイルのみ。route / proxy / 型 barrel は触らない。

## 各ファイルの差分方針

### 1. backend: `apps/api/src/jobs/sync-forms-responses.ts`

#### 1-A. 型: `ResponseSyncResult`（99-107行）

`durationMs` を **required** で追加する（contract mock が必ず付与する前提に揃え、3 経路すべてで返す不変条件をコンパイル時に担保するため）。

before:
```ts
export interface ResponseSyncResult {
  readonly status: "succeeded" | "failed" | "skipped";
  readonly jobId: string;
  readonly processedCount: number;
  readonly writeCount: number;
  readonly cursor: string | null;
  readonly skippedReason?: string;
  readonly error?: string;
}
```

after（方針）:
```ts
export interface ResponseSyncResult {
  readonly status: "succeeded" | "failed" | "skipped";
  readonly jobId: string;
  readonly processedCount: number;
  readonly writeCount: number;
  readonly cursor: string | null;
  readonly durationMs: number; // 取込開始から終了までの所要ミリ秒（非負整数）
  readonly skippedReason?: string;
  readonly error?: string;
}
```

> required にすることで、3 経路のいずれかで `durationMs` を付け忘れると `tsc` が fail し、AC-1（3 経路すべてで返す）を機械的に保証できる。

#### 1-B. 計時起点: `runResponseSync`（116行直後）

`const now = options.now ?? (() => new Date());`（116行）の **直後** に開始時刻を記録する。

after（方針・116行直後に 1 行追加）:
```ts
  const now = options.now ?? (() => new Date());
  const startedAt = now().getTime(); // 計時起点（durationMs 用）
```

> `now()` は `acquireSyncLock` の `now` 引数（139行）等で複数回呼ばれるが、`startedAt` 専用に 1 回呼ぶ。固定 mock では同一値、increasing mock では単調増加するため、終了時 `now()` との差は常に `>= 0`。

#### 1-C. skipped return（154-162行）

`durationMs: now().getTime() - startedAt,` を追加する。

after（方針）:
```ts
    return {
      status: "skipped",
      jobId,
      processedCount: 0,
      writeCount: 0,
      cursor: null,
      durationMs: now().getTime() - startedAt,
      skippedReason: "another response sync is in progress",
    };
```

#### 1-D. failed return（225-232行）

after（方針）:
```ts
    return {
      status: "failed",
      jobId,
      processedCount: processed,
      writeCount: writes,
      cursor,
      durationMs: now().getTime() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
```

#### 1-E. succeeded return（268-274行）

after（方針）:
```ts
  return {
    status: "succeeded",
    jobId,
    processedCount: processed,
    writeCount: writes,
    cursor,
    durationMs: now().getTime() - startedAt,
  };
```

> **計時セマンティクス**: `now()` が Date を返す `() => Date` 注入のため、`now().getTime()` で epoch ミリ秒を取得し差分を計算する。実運用（注入なし）では `new Date()` の差で実所要時間になる。差分が負になるのは注入 mock が時刻を巻き戻した場合のみで、本仕様の increasing/固定 mock では発生しない。万一のために `Math.max(0, now().getTime() - startedAt)` で clamp してもよい（AC-1 の非負保証を堅くする選択肢。採用する場合は 3 経路すべてに同一適用）。

### 2. frontend schema: `apps/web/src/features/admin/diagnostics/manual-sync.ts`

`SyncResultSchema`（3-12行）の `.object({...})` 内、`skippedReason` の直後・`.strict()` の前に `durationMs` を追加する。

after（方針）:
```ts
export const SyncResultSchema = z
  .object({
    status: z.enum(["succeeded", "failed", "skipped"]),
    jobId: z.string(),
    processedCount: z.number().int().nonnegative(),
    writeCount: z.number().int().nonnegative(),
    cursor: z.string().nullable(),
    durationMs: z.number().int().nonnegative().optional(),
    skippedReason: z.string().optional(),
  })
  .strict();
```

> **optional の理由**: backend は required で返すが、frontend schema を optional にすることで「過去レスポンス / 旧 backend からの欠落」に耐性を持たせる（AC-3 の `-` fallback と整合）。`.strict()` は維持し、未知キーは引き続き reject する。`SyncRunResponseSchema`（16-24行）は `SyncResultSchema` を参照しているため自動的に追従し、変更不要。

### 3. frontend UI: `ManualFormResyncPanel.client.tsx`

`resultRows`（34-42行）の配列に、`cursor` 行の **後** に `durationMs` 行を追加する。

after（方針）:
```ts
function resultRows(result: SyncResult) {
  return [
    ["status", result.status],
    ["jobId", result.jobId],
    ["processedCount", result.processedCount],
    ["writeCount", result.writeCount],
    ["cursor", result.cursor ?? "-"],
    ["durationMs", result.durationMs ?? "-"],
  ] as const;
}
```

> `result.durationMs` は schema が optional のため型上 `number | undefined`。`?? "-"` で欠落時 `-` を表示する（AC-3）。`<dl>` 描画ループ（142-147行）は label/value を汎用描画するため UI 側のループ変更は不要。`SyncResult` 型は `z.infer<typeof SyncResultSchema>` 由来のため、schema 修正だけで `durationMs?: number` が自動的に型に乗る。

## 入出力・副作用

- **入力**: `runResponseSync` の `options.now`（注入可能・テストで決定論化）。
- **出力**: `ResponseSyncResult.durationMs`（非負整数ミリ秒）。route 経由で `{ ok, result }` wrapper に乗って frontend に届く。
- **副作用**: なし（計時は純粋な時刻差。D1 書込・ネットワークを増やさない）。`sync_jobs` ledger（`succeed`/`fail`）の引数は変更しない（durationMs は result にのみ載せ、ledger schema は変えない）。

## DoD（Phase 5 完了条件）

- [ ] `apps/api/src/jobs/sync-forms-responses.ts`: `ResponseSyncResult.durationMs` 追加 + 計時起点 1 行 + 3 return への付与が完了。
- [ ] `apps/web/src/features/admin/diagnostics/manual-sync.ts`: `SyncResultSchema` に `durationMs` optional 追加・`.strict()` 維持。
- [ ] `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`: `resultRows` に durationMs 行追加。
- [ ] ビルド成功: `mise exec -- pnpm --filter @ubm-hyogo/api build`（tsc --noEmit）/ web typecheck が通る。
- [ ] Phase 4 の RED テスト（TC-D1〜D5 / TC-S8〜S13 / TC-B9〜B12 / TC-A04〜A06）が GREEN になる。
- [ ] 既存テスト（TC-S1..S7 / TC-B1..B8 / 既存 backend / 既存 contract）が引き続き green（退化なし）。
- [ ] route / proxy は無変更（`git diff --name-only` に `responses-sync.ts` が含まれないこと）。
- [ ] HEX 直書きを追加していない（色を扱わない変更）。

### 想定動作（手動確認の観点。実機操作は Phase 11 / user-gated）

- 管理パネルの「フォーム回答の再取込」で差分 sync を実行すると、結果テーブルに `durationMs` 行が表示され、ミリ秒の整数値が出る。
- 旧レスポンス等で `durationMs` が欠落している場合は `-` が表示される。
- 409（他 sync 実行中）/ HTTP error 時は従来どおり結果テーブルを描画しない（durationMs 行も出ない）。
