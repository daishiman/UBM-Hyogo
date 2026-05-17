# Phase 7: カバレッジ確認

> Phase: 7 / 13
> 名称: カバレッジ確認
> 対象範囲: `MVP-3LAYER-TASK-MAPPING.md` のセル / 集約 / 双方向の充足率

---

## カバレッジ指標

| 指標 | 算出方法 | 目標 | 証跡 |
|------|---------|------|------|
| セル充足率 | (88 - 空欄セル数) / 88 | 100% | `outputs/phase-7/coverage.md` |
| 双方向一致率 | (Matrix A セル数 - Matrix B 不一致セル数) / Matrix A セル数 | 100% | 同上 |
| WARN/FAIL 集約取りこぼし率 | (task-23 WARN/FAIL 件数 - 未集約件数) / task-23 WARN/FAIL 件数 | 0%（取りこぼしなし） | 同上 |
| 19 routes 網羅率 | 列挙 routes / 19 | 100% | 同上 |

---

## 算出手順

1. 生成済み `MVP-3LAYER-TASK-MAPPING.md` を読み込む
2. Matrix A 22 行 × 4 列を走査し空欄 / 表記揺れをカウント
3. Matrix A と Matrix B の bidirectional 一致をチェック
4. section 5 と task-23 結果を突合
5. section 2 の routes を 19 と突合

---

## 対象範囲の明示（Feedback BEFORE-QUIT-002）

本 Phase 7 のカバレッジ対象は **`MVP-3LAYER-TASK-MAPPING.md` の構造的充足**のみ。task-01〜22 の実装コード自体のカバレッジは対象外（task-23 / task-25 の責務）。

---

## 完了条件

- 全 4 指標が目標達成
- `outputs/phase-7/coverage.md` に算出結果が記録されている
