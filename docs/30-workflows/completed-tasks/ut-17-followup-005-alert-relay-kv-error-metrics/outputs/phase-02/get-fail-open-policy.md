# Phase 2 成果物: `get` fail-open 化方針

> AC-5, AC-10 紐付け。本タスク唯一の意図的 behaviour change を文書化する。

## 1. 現状（変更前）

`apps/api/src/routes/internal/alert-relay.ts:66` の `get` 呼出は try/catch で囲まれていない:

```typescript
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
```

このため `env.ALERT_DEDUP_KV.get` が throw した場合、Hono の unhandled error として上流に伝播し、handler から 500 系のレスポンスが返ることになる。実質的に **fail-closed**（KV 障害時に Slack 配信が止まる）として動作している。

## 2. 変更後

```typescript
let seen: string | null = null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (err) {
  await logKvOperationError("get", err, dedupeKey);
  // seen は null のまま → 通常配信続行
}
```

- catch 後 `seen` は初期値 `null` のまま続行
- `if (seen !== null)` の dedupe 判定（行 67-69）を素通り → 通常配信パスへ進む
- Slack 配信は実行される（fail-open）

## 3. 採用理由

### 3.1 運用インパクトの非対称性

| 失敗モード | 影響 |
| --- | --- |
| fail-closed（現状 / 500 返却） | Cloudflare Notifications → alert-relay 配信失敗 → **アラート遅延 / 欠落** |
| fail-open（本タスクで採用） | KV dedupe スキップ → **稀に Slack 重複配信**が発生する可能性 |

アラート遅延 / 欠落は本番障害の検知遅れに直結し、Slack 重複配信より運用インパクトが圧倒的に大きい。

### 3.2 原典 6.3 章との整合

原典指示書 6.3 章「`try/catch` で例外を握り潰す危険性」セクションで以下が明示されている:

> **KV `get` 失敗時に fail-closed (500 系) にする選択肢は取らない**。`get` 失敗で Slack を止めるとアラート遅延の方が運用インパクトが大きいため、fail-open + 警告ログのままにする。

本設計はこの指示と完全整合する。

### 3.3 観測可能性の確保

握り潰しが見落としを生まないよう、catch 内で必ず `logKvOperationError("get", ...)` を呼んで構造化ログを emit する。これにより:

- 後段 logpush から `op:"get"` 失敗の発生率を集計可能
- runbook で `grep alert_relay_kv_op_failed | grep '"op":"get"'` で異常検知可能
- 「fail-open しているが見えていない」状態にはならない

## 4. 唯一の意図的 behaviour change である根拠

本タスクで変更されるのは以下 4 箇所のみ:

| 変更点 | behaviour change |
| --- | --- |
| module top `isolateId` 採番 | なし（read-only 副作用） |
| `logKvOperationError` helper 追加 | なし（呼ばれなければ発火しない） |
| `get` を try/catch + fail-open 化 | **あり**（本セクション） |
| `put` catch を helper 呼出に置換 | なし（戻り値完全一致） |

したがって **本タスクで唯一の意図的 behaviour change は `get` の fail-open 化** である。これは:

- AC-10 の例外条項（「`get` 失敗時を除く」）に明示
- Phase 3 design-review.md の R-2 観点で承認
- Phase 12 documentation-changelog に記録対象として申し送る

## 5. 起こり得るリスクと緩和

| リスク | 緩和策 |
| --- | --- |
| KV 障害時に Slack 重複配信が増える | 構造化ログで `op:"get"` 失敗を観測可能化。runbook に「直近 1 時間で 10 件超なら調査開始」のしきい値を設定 |
| fail-open 化に気付かないまま重複が常態化 | `event: "alert_relay_kv_op_failed"` を後段 dashboard 化（UT-17-FU-006）の filter anchor として利用 |
| 既存テストが 500 期待で書かれていた | 既存 `__tests__/alert-relay.spec.ts` を Phase 7 で再点検。500 期待 case があれば fail-open 期待に書き換える方針を Phase 7 で確定 |

## 6. テスト方針（Phase 7 申し送り）

- 新規 T-01: `KV.get` throw 時に Slack 配信が継続し、最終レスポンスが `200` であることを assert
- 既存 case で `KV.get` throw → 500 を期待しているものがあれば書き換え対象
- 既存成功パスは温存（behaviour change なし）

## 7. AC マッピング

| AC | 該当節 |
| --- | --- |
| AC-5 | 第 2 節「変更後」 / 第 3.3 節「観測可能性の確保」 |
| AC-10 | 第 4 節「唯一の意図的 behaviour change」 |
