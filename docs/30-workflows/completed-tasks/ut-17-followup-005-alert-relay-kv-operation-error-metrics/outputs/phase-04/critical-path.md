# Phase 4 成果物: クリティカルパス

## 実行順序図

```
        ┌─────────────┐
        │  T-08 (runbook)  │  ← 並行可（実装非依存）
        └─────────────┘

T-01 (isolateId) ─┐
                  ├─→ T-04 (logKvOperationError) ─┬─→ T-05 (KV.get try/catch) ─┐
T-02 (textEncoder)│                              │                              ├─→ T-07 (テスト追加) ─→ T-09 (品質ゲート)
                  ├─→ T-03 (computeDedupeKeyHash)│                              │
                  │                              └─→ T-06 (KV.put 置換) ─────┘
                  ↑                                                            ↑
                  └────────────── T-03 は T-02 依存                             │
                                                                                │
                                                  T-08 (runbook) ─────────────┘ (T-09 で同時検証)
```

## クリティカルパス

**T-01 / T-02 → T-03 → T-04 → (T-05 // T-06) → T-07 → T-09**

T-08 (runbook) は実装と並行可だが、T-09 品質ゲートで grep evidence (`alert_relay_kv_op_failed` field 表) も併せて確認する。

## ステップ別所要時間（参考）

| ステップ | 想定 | 備考 |
| --- | --- | --- |
| T-01〜T-04 | 30 分 | helper + isolateId + hash 算出 |
| T-05〜T-06 | 15 分 | emit point 改修 (snippet 通り置換) |
| T-07 | 60 分 | 7 ケース追加 + 既存 regression 確認 |
| T-08 | 20 分 | runbook section 追記 |
| T-09 | 15 分 | typecheck / lint / build / test 実行 |

## ボトルネック

- T-04 (`logKvOperationError`) と T-07 (テスト追加) が単一責務上の最大ブロック。helper シグネチャと test の `vi.spyOn(console, 'warn')` を Phase 6 で snippet 化することでリスクを抑える。
- T-07 で既存 case (ROUTE-04 / ROUTE-05 / TC-KV-01) の regression が出る可能性。`beforeEach` での spy clear / `afterEach` での restore を統一適用して leak を防ぐ。

## Phase 5 への申し送り

- 実装計画書 (`implementation-plan.md`) では T-01〜T-09 をそのまま section 単位で記述する
- 完成形 snippet は Phase 6 (`implementation-steps.md`) に集約し、Phase 5 では interface / 依存ライブラリのみ記述
