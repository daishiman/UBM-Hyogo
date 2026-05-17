# Phase 6: テスト拡充

> Phase: 6 / 13
> 名称: テスト拡充

---

## 目的

Phase 4 の TC-01〜10 に加え、回帰ガードと境界ケースを補強する。

---

## 追加テスト項目

### TC-11: 双方向 cross-check の網羅

- 検証: Matrix A の全 88 セルに対して Matrix B 側に対応する記載があるか、bidirectional に確認
- 失敗パターン: Matrix A で「必須」のセルが Matrix B で「強関与」バケツに入っている等の category drift

### TC-12: WARN/FAIL ペアの層別影響整合

- 検証: WARN/FAIL を持つタスクが Matrix A で「無関係」のみの層に対して、section 5 で影響として記載されていないこと
- 失敗パターン: 「無関係」層に対する影響が誤記載

### TC-13: readiness 判定根拠の明記

- 検証: section 8 の各層 readiness に判定根拠（参照タスク ID と理由）が明記されている
- 失敗パターン: READY / AT_RISK / BLOCKED のラベルだけで根拠が欠落

### TC-14: 表記揺れ regression guard

- 検証: 「必須」「強関与」「軽関与」「無関係」以外の語（「必要」「関与あり」など）が matrix セル内に出現しないこと
- 失敗パターン: 表記揺れによる分類解釈の曖昧化

### TC-15: 19 routes 完全網羅確認

- 検証: section 2 で列挙される routes が公開 6 + 会員 2 + 管理 8 + 共通 3 = 19 件と一致
- 失敗パターン: route 重複 / 欠落

---

## カバレッジ対象範囲（Feedback BEFORE-QUIT-002）

本タスクは docs-only のためコードカバレッジは N/A。代わりに「matrix セル充足率」と「双方向一致率」を Phase 7 で計測する。

| 指標 | 目標 |
|------|------|
| セル充足率 | 88/88 = 100% |
| 双方向一致率 | 100% |
| WARN/FAIL 集約取りこぼし率 | 0% |

---

## 実施手順

Phase 5 完了後、TC-11〜15 を順に実行。不合格があれば Phase 5 に戻って修正。
