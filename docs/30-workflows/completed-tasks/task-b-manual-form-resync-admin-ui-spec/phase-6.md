# Phase 6 — テスト拡充（fail path / 回帰 guard の確認 + 拡充候補）

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> Phase 4 で写像した landed test に対し、fail path（409 / HTTP error / schema mismatch）と
> 回帰 guard が既存 TC で十分カバーされているかを確認する。
> `verify_existing` のため、**カバー済み**は「現状確認」、**未カバー**は「拡充候補」として明示分離する。
> 拡充候補の実装可否は user-gated（本フェーズでテストコードは追加しない・正本記述に留める）。

---

## 1. fail path カバレッジ現状確認（カバー済み）

| fail path | カバー TC | 検証内容 |
|-----------|----------|---------|
| 409 sync_in_progress（差分経路） | TC-B5 | `FetchAuthedError(409, {ok:false,result:{status:"skipped",...}})` → `role="status"`「他の sync が実行中です」/ テーブル非描画 |
| HTTP error（汎用 Error） | TC-B6 | `role="alert"` に message / テーブル非描画 |
| 受信 schema mismatch | TC-B7 | `{foo:1}` → `parseError` を `role="alert"` 表示 / テーブル非描画 |
| confirm キャンセル（副作用抑止） | TC-B3 | `backfillTriggerMock` 未呼出 |
| pending 二重起動防止 | TC-B4 | run / backfill 双方 `disabled` |
| status enum 逸脱 | TC-S4 | `running` を reject（`SyncResult` から除外） |
| nonnegative 違反 | TC-S5 | `writeCount:-1` を reject |
| 409 refine（ok:false の status 制約） | TC-S7 | `ok:false` + `status:"succeeded"` を reject |

> → fail path の主要分岐（409 / error / parse 失敗 / confirm 拒否 / pending / schema 不正）は
> **既存 TC で網羅済み**。本タスクのスコープ（landed 実装の回帰確認）として追加 Red は不要。

---

## 2. 回帰 guard としての位置づけ（現状確認）

- `SyncRunResponseSchema` の `.strict()` + 2 枝 union + 409 refine が **契約 drift 検出器**として機能する。
  backend が 200/409 の body 形を変えれば TC-S2/S3/S7 のいずれかが落ちる。
- `parseInProgress` の 409 判定（`status !== 409` early return + `result.status === "skipped"` 限定）は
  TC-B5 が回帰 guard。409 以外の status や skipped 以外の result を inProgress 扱いしないことを保証。
- proxy パス（`needsSyncAdminBearer`）の `?fullSync=false` / `?fullSync=true` クエリは
  TC-B1 / TC-B2 が trigger 引数の完全一致で固定（差分/全件のクエリ取り違え回帰を検出）。

---

## 3. 拡充候補（未カバー・user-gated）

> 以下は landed test に**存在しない**枝。回帰価値はあるが、本タスクのスコープ外であり
> 過剰実装を避けるため候補列挙に留める。実装は user 承認時のみ。

| 候補 ID | 未カバー枝 | 価値 | 過剰判定 |
|---------|-----------|------|---------|
| EXT-1 | **backfill 経路の 409**（`h.backfillState.error` に 409 を設定し inProgress 表示） | 中（`inProgress` は `runMutation.error ?? backfillMutation.error` の合算判定。backfill 側の 409 表示が未検証） | 採用検討可（差分経路 TC-B5 とほぼ対称・コスト小） |
| EXT-2 | **cursor null の表示**（`cursor: null` で結果テーブルが `"-"` を描画） | 低（`resultRows` の `result.cursor ?? "-"` 分岐。現行 SUCCESS fixture は `cursor:"cursor-1"`） | 低価値・描画詳細 |
| EXT-3 | **onSynced 未指定時の no-op**（prop 省略時に成功しても throw しない） | 低（`onSynced?.()` の optional call。TC-B1 は実質省略パスを通るが onSynced の no-op を明示 assert していない） | 既存 TC-B1 が暗黙に通過済み・明示 assert は冗長 |
| EXT-4 | **skippedReason 表示**（成功結果に `skippedReason` がある場合の `<dt>/<dd>` 追加描画） | 低（`lastResult.skippedReason ?` 分岐。skipped は通常 409 で error 扱いのため成功テーブルに出る機会が少ない） | 低発生頻度 |
| EXT-5 | **backfill 成功時の onSynced**（TC-B8 は差分経路のみ。backfill 経路の `onSynced` 呼出は未検証） | 中（`applyResponse` は共通関数だが mode="backfill" 経由の callback 未 assert） | 採用検討可（共通関数のため回帰価値は限定的） |

> **採用推奨度**: EXT-1 / EXT-5 のみ「採用検討可」（fail/callback の対称性補完）。
> EXT-2/3/4 は描画詳細・低発生頻度で、現状の coverage を踏まえると追加コストに見合わない。

---

## 4. 検証コマンド（拡充判断の前提として現状を再確認）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

---

## 完了条件

- [x] fail path（409 / HTTP error / schema mismatch / confirm 拒否 / pending）のカバー済み TC を現状確認した
- [x] 回帰 guard としての schema strict / refine / proxy クエリ固定の役割を記述した
- [x] 未カバー枝を拡充候補（EXT-1..EXT-5）として列挙し、カバー済みと明示分離した
- [x] 各拡充候補の価値と過剰判定を示し、採用推奨度（EXT-1/EXT-5 のみ検討可）を提示した
- [x] 本フェーズではテストコードを追加せず、実装可否を user-gated とすることを明記した
