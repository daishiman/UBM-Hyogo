# Phase 2 — 設計

**[実装区分: 実装仕様書 / implementation_mode: new]**

## 1. 責務境界（producer / consumer）

| ロール | 主体 | 責務 | 非責務 |
|--------|------|------|--------|
| Producer（値の生成） | `runResponseSync()`（`apps/api/src/jobs/sync-forms-responses.ts`） | 処理開始〜終了の経過ミリ秒を計測し `durationMs` を `ResponseSyncResult` に詰めて返す | 表示形式の整形・フォーマットは行わない |
| Pass-through（素通し） | `route.post("/sync/responses")`（`responses-sync.ts`） | `runResponseSync()` の result を `c.json({ ok, result })` でそのまま返す | durationMs を計測・加工しない（変更不要） |
| Parser（契約検証） | `SyncResultSchema` / `SyncRunResponseSchema`（`manual-sync.ts`） | レスポンスを zod で検証し `durationMs` を optional として受容する | 値の生成・計測はしない |
| Consumer（表示） | `ManualFormResyncPanel`（`*.client.tsx`） | `resultRows()` で durationMs を行として描画。欠落時 `-` fallback | durationMs を計測しない |

- **状態所有権**: `durationMs` の値の所有者は backend（producer）。frontend は表示のみの consumer。計測ロジックを 2 か所に分散させない。

## 2. 計時設計（3 経路返却）

`runResponseSync()` 内で計時を完結させる。route/UI では計測しない。

### 2.1 計時の起点

```ts
// runResponseSync() 冒頭（既存 L116 の now 解決の直後）
const now = options.now ?? (() => new Date());
const startedAt = now().getTime();   // ← 追加: 計測起点
```

- `options.now?: () => Date` は既存の注入ポイント（テスト決定論性に既に使われている）。`startedAt` も同じ `now()` を経由させることで、テストで `now` を固定 → durationMs を決定論的に検証できる。
- `Date.now()` を直接呼ばず、必ず `now().getTime()` を経由する（注入可能性を維持）。

### 2.2 3 経路の return への durationMs 付与

`ResponseSyncResult` の 3 つの return すべてに `durationMs: now().getTime() - startedAt` を追加する。

| 経路 | 既存 return 位置 | durationMs 追加 |
|------|-----------------|----------------|
| skipped（lock 取得失敗の早期 return） | L154-162 | `durationMs: now().getTime() - startedAt` |
| failed（catch 内 return） | L225-232 | `durationMs: now().getTime() - startedAt` |
| succeeded（末尾 return） | L268-274 | `durationMs: now().getTime() - startedAt` |

- 各経路で **return 直前に** 終了時刻を取得する（`now().getTime()`）。経過時間 = 終了時刻 - `startedAt`。
- `now()` が固定された場合は差分 0（非負）。実運用では monotonic でない壁時計だが、テスト互換性と既存注入規約を優先する。AC-1 は「非負整数」を要求するため、`getTime()` の差分（ミリ秒・整数）でそのまま満たす（負値は実質発生しないが、設計意図として `Math.max(0, …)` の防御は任意。本タスクでは追加しない＝既存注入規約に依存し副作用を増やさない）。

### 2.3 型定義の変更

```ts
// ResponseSyncResult（既存 L99-107）に追加
export interface ResponseSyncResult {
  readonly status: "succeeded" | "failed" | "skipped";
  readonly jobId: string;
  readonly processedCount: number;
  readonly writeCount: number;
  readonly cursor: string | null;
  readonly durationMs: number;        // ← 追加（backend は常に供給するため required）
  readonly skippedReason?: string;
  readonly error?: string;
}
```

- backend は 3 経路すべてで必ず durationMs を返すため、`ResponseSyncResult` 側では **required**（`number`）とする。
- frontend schema 側は **optional**（後述）。これは後方互換のための非対称性であり意図的（旧レスポンス・将来の別経路に対する parse-safe 性を確保）。

## 3. schema 追加順序（実装順序）

| 順 | 作業 | 理由 |
|----|------|------|
| 1 | `SyncResultSchema` に `durationMs` を **optional** で追加（`manual-sync.ts`） | optional のため、durationMs を返さない既存レスポンス・テスト mock でも parse が壊れない（parse-safe）。先に追加しても退行ゼロ |
| 2 | backend `runResponseSync()` が 3 経路で durationMs を返却（`sync-forms-responses.ts`） | producer が値を供給開始。route は素通しのため自動伝播 |
| 3 | UI `resultRows()` に durationMs 行追加（`*.client.tsx`） | consumer が表示。`result.durationMs ?? "-"` で欠落耐性 |

- この順序により、各ステップ単独でも既存テストが green を保つ（schema optional → backend supply → UI display）。同一 PR でまとめてコミットする。

### 3.1 schema 差分

```ts
export const SyncResultSchema = z
  .object({
    status: z.enum(["succeeded", "failed", "skipped"]),
    jobId: z.string(),
    processedCount: z.number().int().nonnegative(),
    writeCount: z.number().int().nonnegative(),
    cursor: z.string().nullable(),
    durationMs: z.number().int().nonnegative().optional(),  // ← 追加
    skippedReason: z.string().optional(),
  })
  .strict();   // ← 維持（未知キーは引き続き reject）
```

- `.strict()` を維持するため、`durationMs` を schema に明示追加しないと backend が返す durationMs で parse が **失敗**してしまう。これが AC-2 が必須である理由（`.strict()` と新フィールドの整合）。
- `SyncRunResponseSchema`（union）は `SyncResultSchema` を内包するため、追加で変更不要。union 構造（200 = ok:true / 409 = ok:false かつ status==="skipped"）は退化しない（AC-4）。

### 3.2 UI 差分

```ts
function resultRows(result: SyncResult) {
  return [
    ["status", result.status],
    ["jobId", result.jobId],
    ["processedCount", result.processedCount],
    ["writeCount", result.writeCount],
    ["cursor", result.cursor ?? "-"],
    ["durationMs", result.durationMs ?? "-"],   // ← 追加（欠落時 "-" fallback）
  ] as const;
}
```

- 既存の `<dl>` レンダリングループ（L142-147）がそのまま新行を描画する。グリッドは `md:grid-cols-4` で自動折り返し。新規 primitive・新規スタイル追加なし。

## 4. データフロー

```
runResponseSync(env, opts)
  ├─ startedAt = now().getTime()          [producer 計測起点]
  ├─ skipped 経路 → { ..., durationMs }    [3経路すべてで付与]
  ├─ failed  経路 → { ..., durationMs }
  └─ succeeded経路 → { ..., durationMs }
        │
        ▼  ResponseSyncResult { durationMs: number, ... }
route.post("/sync/responses")
  └─ c.json({ ok, result })               [pass-through・変更不要]
        │
        ▼  HTTP 200 / 409 / 500 body
ManualFormResyncPanel.applyResponse(raw)
  └─ SyncRunResponseSchema.safeParse(raw)  [parser・durationMs optional 受容]
        │
        ▼  SyncResult { durationMs?: number, ... }
resultRows(result)
  └─ ["durationMs", result.durationMs ?? "-"]  [consumer 表示・"-" fallback]
        │
        ▼  <dl> の <dt>durationMs</dt><dd>{値}</dd>
```

## 5. 因果ループ

### バランスループ B-1（性能フィードバック）

```
再取込実行 → durationMs 計測・表示 → 管理者が所要時間を認知
  → 異常に長い場合 backfill 頻度/タイミングを調整 → 過負荷を抑制
  → 次回 durationMs が低下（バランス: 所要時間を一定域に収める）
```

- 本タスクは「durationMs 計測・表示」のエッジを成立させ、上記運用フィードバックループを初めて閉じる。値が存在しない現状ではループが断絶している。

## 6. SubAgent lane（3 並列以下 + 直列 validation）

| Lane | 担当 | 対象ファイル | 依存 |
|------|------|-------------|------|
| Lane A（backend producer） | `ResponseSyncResult` 型 + `runResponseSync()` 3 経路計時 | F-1（`sync-forms-responses.ts`） | なし（先頭で着手可） |
| Lane B（frontend schema + UI） | `SyncResultSchema` optional 追加 + `resultRows()` 行追加 | F-2（`manual-sync.ts`）, F-3（`*.client.tsx`） | schema optional は parse-safe のため Lane A と並列可 |
| Lane C（test 全層） | contract spec / sync-schemas spec / panel spec の回帰テスト追加 | F-4, F-5, F-6 | Lane A/B の型・schema 確定後に締める |
| Validation（直列） | typecheck / lint / 3 spec の green 確認 | 全ファイル | Lane A/B/C 完了後 |

- lane は 3 並列。validation lane は直列で最後に締める（skill ベストプラクティス遵守）。
- 1 サイクル 1 PR（CONST_007）。backend / frontend を分割コミットしない。

## 7. validation path

```bash
# 型チェック
mise exec -- pnpm typecheck

# lint（HEX 直書き等含む）
mise exec -- pnpm lint

# apps/api 契約テスト（AC-6）
mise exec -- pnpm --filter @ubm-hyogo/api test -- responses-sync.contract

# apps/web schema テスト（AC-5）
mise exec -- pnpm --filter @ubm-hyogo/web test -- sync-schemas

# apps/web panel テスト（AC-3/AC-5）
mise exec -- pnpm --filter @ubm-hyogo/web test -- ManualFormResyncPanel
```

> 全件 `pnpm test` は重いため、targeted run（上記 3 ファイル指定）を Phase 4/5/6 で使用する。

## 8. 設計上の確認事項（既存基盤との関係）

| 確認 | 結論 |
|------|------|
| `sync/types.ts` `DiffSummary.durationMs` を流用するか | 流用しない。diff sync 経路の型であり resync は非経由（O-2）。命名のみ揃える |
| `sync/audit.ts` `withSyncMutex` の計時を流用するか | 流用しない。resync は `acquireSyncLock` 経路で `withSyncMutex` を通らない（O-2） |
| `sync/manual.ts:87` の `durationMs: 0` を直すか | 直さない。別 sync 経路の別関心（O-3） |
| route 変更が必要か | 不要。result 素通しで自動伝播（O-1） |
| `ResponseSyncResult` を required にして frontend を optional にする非対称は妥当か | 妥当。backend は常時供給（required）、frontend は後方互換のため optional（parse-safe）。意図的な非対称 |
