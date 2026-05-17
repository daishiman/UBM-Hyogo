# Phase 4 成果物: クリティカルパス

## 依存グラフ

```
T1 (isolateId top 採番)
   │
   ▼
T2 (helper sha256Hex12 / logKvOperationError 実装)
   │
   ├──────────────┐
   ▼              ▼
T3 (get try/catch + fail-open)   T4 (put catch JSON 化)
   │              │
   └──────┬───────┘
          ▼
        T5 (vitest 4 ケース追加)
          │
          ├─ 並列可 ─ T6 (既存 TC-KV-05 削除)
          ▼
        T7 (runbook 追記)
          │
          ▼
        T8 (typecheck / lint / test 全 PASS)
```

## 区間別累積時間

| 区間 | サブタスク | 累積時間 | 備考 |
| --- | --- | --- | --- |
| 前提整備 | T1 + T2 | 0.75h | isolateId 採番 + helper 実装 |
| emit 接続 | T3 + T4 | 0.75h（並列可） | `get` fail-open 化 + `put` catch 置換。T2 完了後は並列実行可 |
| テスト追加 | T5 + T6 | 1.25h | vitest 4 ケース + 既存 TC-KV-05 削除 |
| runbook | T7 | 0.5h | 運用手順追記 |
| 品質ゲート | T8 | 0.25h | typecheck / lint / test 全 PASS |
| **合計** | T1〜T8 | **3.5h** | 半営業日想定 |

## クリティカルパス上の制約

1. **T2 → T3 / T4**: helper が定義されていない状態で emit 接続を書くと型エラー。必ず T2 完了後。
2. **T3 / T4 → T5**: テストを書く時点で実装が動いていること。両方完了後に T5 着手。
3. **T5 → T7**: runbook の grep コマンド例・schema 表は実装と整合している必要がある。テスト PASS で実装が固まってから runbook を確定する。
4. **T7 → T8**: 全変更を含めた状態で品質ゲートを実行する。

## 並列化可能区間

- **T3 と T4**: T2 完了後、両者は同一ファイルの別箇所変更なので並列実装可（ただし保存時に conflict 注意）。
- **T5 と T6**: 同一ファイル `alert-relay.spec.ts` の別箇所変更。T6 は TC-KV-05 削除のみのため軽量。順序入れ替え可だが「T5 で新規ケースを追加 → T6 で旧ケース削除」の順が conflict 回避上推奨。

## ブロッカー候補

| ブロッカー | 影響範囲 | 対応 |
| --- | --- | --- |
| `crypto.subtle.digest` が test 環境で動かない | T5 全ケース失敗 | `@cloudflare/vitest-pool-workers` 設定確認、または Node 20+ Web Crypto fallback 確認 |
| `vi.spyOn(console, "warn")` leak で他テスト false-positive | 既存 ROUTE-* / TC-* テスト fail | `afterEach(() => vi.restoreAllMocks())` を describe 直下に必ず追加 |
| `event` 文字列の typo | 後段 logpush filter 契約 break | T2 helper のリテラル `"alert_relay_kv_op_failed"` を T5 アサーションでも同一文字列で固定 |
