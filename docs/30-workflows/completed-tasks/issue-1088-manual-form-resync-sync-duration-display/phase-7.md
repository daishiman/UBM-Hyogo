**[実装区分: 実装仕様書 / implementation_mode: new]**

# Phase 7 — カバレッジ確認

## 目的

issue #1088 の変更面（backend 計時行 / schema フィールド / UI 表示行）に限定して line / branch カバレッジを実測し、変更ブロックが Phase 4-6 のテストで保護されていることを可視化する。**変更したブロック以外は対象外**とする（[Feedback BEFORE-QUIT-002]）。

## カバレッジ対象範囲（変更面のみ）

| ファイル | 変更ブロック | 計測対象 |
|----------|-------------|----------|
| `apps/api/src/jobs/sync-forms-responses.ts` | `runResponseSync` 内の計時行（`const startedAt = now().getTime();`）と 3 つの return オブジェクトに付与した `durationMs: now().getTime() - startedAt`（skipped/failed/succeeded） | 計時起点行 + 3 return の `durationMs` 式の line + 3 経路 branch |
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | `SyncResultSchema` の `durationMs: z.number().int().nonnegative().optional()` 行 | schema 行の line（parse 成功/失敗の評価が通ること）|
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | `resultRows` の `["durationMs", result.durationMs ?? "-"]` 行 | 当該行の line + `?? "-"`（値あり / 欠落）の branch |

> **対象外**: 上記以外の `runResponseSync` 本体ロジック（ページング・lock・writeCap・cap-alert）、`SyncResultSchema` の既存フィールド、`ManualFormResyncPanel` の既存描画・409 ハンドリングは本タスクの変更ブロックではないため、カバレッジ目標の対象外とする（既存テストが既に担保）。

## 計測コマンド

> coverage は app 単位で取得し、`--coverage.include` で対象ファイルに絞る。Node 24 を確実に使うため `mise exec --` 経由。

### backend

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --root=../.. --config=vitest.config.ts --coverage \
  --coverage.include="apps/api/src/jobs/sync-forms-responses.ts" \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/responses-sync.contract.spec.ts
```

### frontend

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --root=../.. --config=vitest.config.ts --coverage \
  --coverage.include="apps/web/src/features/admin/diagnostics/manual-sync.ts" \
  --coverage.include="apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx" \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx
```

## 変更ブロックの実測目標

| 変更ブロック | line 目標 | branch 目標 | 担保 TC |
|-------------|-----------|-------------|---------|
| backend 計時起点行（`startedAt`） | 100% | — | TC-D1〜D9（全 `runResponseSync` 呼び出しで通過）|
| backend succeeded return `durationMs` | 100% | 経路 hit | TC-D1/D2/D5/D8/D9 |
| backend failed return `durationMs` | 100% | 経路 hit | TC-D3/D6/D8 |
| backend skipped return `durationMs` | 100% | 経路 hit | TC-D4/D7/D8 |
| schema `durationMs` 行 | 100% | parse 成功/失敗の両分岐 | TC-S8〜S16 |
| UI `resultRows` durationMs 行 | 100% | `?? "-"`（値あり / undefined）の両 branch | TC-B9（値あり）/ TC-B14（undefined → `-`）/ TC-B15（0 保持）|

> **branch 重点**: UI の `result.durationMs ?? "-"` は nullish 合体で 2 分岐（左辺評価値 / 右辺 `"-"`）。TC-B9（値あり=左辺）と TC-B14（undefined=右辺）で両方を hit する。`durationMs: 0`（TC-B15）は左辺評価で `0` を保持する経路の追加証跡。backend の 3 return は 3 経路 branch を skipped/failed/succeeded の各 TC で網羅する。

## 実測値の記録

Phase 7 完了時、上記コマンドの coverage 出力から **変更ブロック周辺の line / branch 実測値** を証跡として残す（[Feedback 5]）。例:

- `runResponseSync` の `durationMs` 付与 3 行: line 100% / 当該 return branch hit 3/3。
- `SyncResultSchema` の `durationMs` 行: line 100%。
- `resultRows` の durationMs 行: line 100% / `?? "-"` branch 2/2。

> 全体カバレッジ %（ファイル全体）は参考値として記録するが、**合否判定は変更ブロックの line/branch hit**で行う。変更ブロック以外の未到達行は本タスクの責務外として明記する。

## 完了条件（Phase 7 DoD）

- [ ] backend / frontend の coverage コマンドを実行した。
- [ ] 変更ブロック（backend 計時 4 箇所 / schema 1 行 / UI 1 行）の line が 100% hit。
- [ ] backend 3 return 経路 branch が 3/3 hit、UI `?? "-"` branch が 2/2 hit。
- [ ] 変更ブロック以外を対象外とした旨を証跡に明記した。
- [ ] 実測 line/branch 値を記録した。
