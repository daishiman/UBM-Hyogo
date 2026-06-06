**[実装区分: 実装仕様書 / implementation_mode: new]**

# Phase 6 — テスト拡充

## 目的

Phase 4 の正常系 RED → Phase 5 GREEN を踏まえ、fail path（failed / skipped 経路の `durationMs`）、欠落 fallback、既存表示・契約の退化 guard を厚くする。AC-1（3 経路）/ AC-3（`-` fallback）/ AC-4（退化しない）/ AC-5（回帰テスト）/ AC-6（contract）を確実にカバーする。

## 補助 command（focused）

```bash
# backend
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --root=../.. --config=vitest.config.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/responses-sync.contract.spec.ts

# frontend
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx
```

## 拡充テストケース

### A. backend fail path / 計時境界 — `sync-forms-responses.contract.spec.ts`

> Phase 4 の TC-D3（failed）/ TC-D4（skipped）を踏まえ、計時の正しさと経路網羅を強化する。

| TC番号 | 経路 | 内容 | 期待値 |
|--------|------|------|--------|
| TC-D6 | failed | client が listResponses で throw する経路で `durationMs` が増分付き（increasing mock step=10ms）→ 正の整数 | `status==="failed"` かつ `durationMs >= 10` かつ整数。`error` が設定済み |
| TC-D7 | skipped | 2 回連続実行で 1 回目 lock 保持中に 2 回目を skipped にし、skipped の `durationMs` が非負整数 | `status==="skipped"` かつ `durationMs >= 0` かつ整数 |
| TC-D8 | 全経路共通 | `durationMs` は `Number.isInteger` を満たす（`getTime()` 差は常に整数だが回帰 guard として固定） | 3 経路すべてで `Number.isInteger(result.durationMs) === true` |
| TC-D9 | succeeded | `now` 注入なし（実 `Date`）でも `durationMs` が定義され非負（実行時間ゼロ近傍を許容） | `result.durationMs >= 0` かつ `typeof === "number"`（注入なし経路の smoke）|

> TC-D9 は `options.now` を渡さず `new Date()` 実体を使う経路の最小確認。実時間は極小なので `>= 0` のみ検証する。

### B. schema 欠落 fallback / 境界 — `sync-schemas.spec.ts`

| TC番号 | 内容 | 期待値 |
|--------|------|--------|
| TC-S14 | `durationMs: 0`（境界・最小非負）を受理する | `SyncResultSchema.safeParse({ ...validSyncResult, durationMs: 0 }).success === true` |
| TC-S15 | `durationMs` が文字列は reject（型不一致） | `SyncResultSchema.safeParse({ ...validSyncResult, durationMs: "100" }).success === false` |
| TC-S16 | skipped result（409 相当）に `durationMs` を載せても wrapper が通る | `SyncRunResponseSchema.safeParse({ ok:false, result:{ status:"skipped", jobId:"j", processedCount:0, writeCount:0, cursor:null, durationMs: 5, skippedReason:"x" } }).success === true` |

### C. UI 欠落 fallback / 退化 guard — `ManualFormResyncPanel.spec.tsx`

| TC番号 | 内容 | 期待値 |
|--------|------|--------|
| TC-B13 | backfill 経路でも `durationMs` 行が表示される（run だけでなく backfill でも追従） | backfill trigger mock が durationMs 付き result を返す → `screen.findByText("durationMs")` 成功・値表示 |
| TC-B14 | `durationMs` 欠落（undefined）時に隣接 `<dd>` が `-`（cursor 値と衝突させない設計で検証） | durationMs 未指定の result で run 実行後、durationMs ラベルの `<dt>` の `nextElementSibling`（`<dd>`）テキストが `"-"` |
| TC-B15 | `durationMs: 0` を表示できる（falsy だが `?? "-"` で `0` を保持） | result に `durationMs: 0` → `durationMs` 行の値が `"0"`（`-` ではない。`??` は `0` を fallback しない）|
| TC-B16 | 既存全行 + mode + skippedReason 表示の非退化（包括 guard） | durationMs 行追加後も `status`/`jobId`/`processedCount`/`writeCount`/`cursor`/`mode` の各ラベルが存在 |

> **TC-B15 の意図**: `result.durationMs ?? "-"` は nullish 合体なので `0` は `0` のまま表示される（`||` ではないため falsy 落ちしない）。これが Phase 5 実装の意図どおりであることを固定する回帰テスト。

### D. contract 退化 guard — `responses-sync.contract.spec.ts`

| TC番号 | 内容 | 期待値 |
|--------|------|--------|
| TC-A07 | 200 succeeded で body の `result` 全フィールド（durationMs 含む）が mock と一致 | `await res.json()` の `result` が mock オブジェクトと deep equal（durationMs 含む素通し）|
| TC-A08 | AC-5（fullSync/cursor 透過）が durationMs 追加後も維持 | 既存 AC-5 テストが green のまま（`lastCall[1].fullSync === true`）|

## 退化 guard 一覧（AC-4）

| 保護対象 | 担当 TC |
|----------|---------|
| backend 既存フィールド（processedCount/writeCount/cursor/status/jobId） | TC-D2（Phase 4）+ 既存 backend ケース |
| schema `.strict()` が未知キーを reject | TC-S10（Phase 4）+ 既存 TC-S* |
| schema union（ok:false + non-skipped reject 等） | 既存 TC-S7 + TC-S16 |
| UI 既存行・409・HTTP error 非描画 | 既存 TC-B5/B6/B7 + TC-B16 |
| route 200/409/500 分岐 | 既存 T-A-* + TC-A04〜A08 |

## 完了条件（Phase 6 DoD）

- [ ] backend TC-D6〜D9 を追加し green。
- [ ] schema TC-S14〜S16 を追加し green。
- [ ] UI TC-B13〜B16 を追加し green。
- [ ] contract TC-A07〜A08 を追加し green。
- [ ] 補助 command（上記）で 4 ファイルすべて green を確認したログを残す。
- [ ] fail path（failed / skipped）の `durationMs` が両方カバーされている。
- [ ] 欠落 fallback（`-`）と `durationMs: 0` 保持の両方がカバーされている。
