# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

Issue #548（FU-03-C: ML モデル選定）の要件を確定する。親 #515 で導入された classifier 抽象を前提に、本サイクルで実装する **3 モデル候補** と **選定基準** および **着手 Gate** を切り分ける。FU-03-A の Gate-A/B/C 判定 + FU-03-B の 90 日 dataset を前提とするが、本サイクル仕様策定はそれと独立に完結させる。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 1-1 | 着手 Gate（FU-03-A 完了 + FU-03-B dataset 完成）と本サイクル代替（synthetic fixture）を定義 |
| 1-2 | モデル候補 3 種（Isolation Forest / XGBoost / Workers AI）の選定理由を記述 |
| 1-3 | 選定基準（precision / recall / fallback rate / latency p95）を定量化 |
| 1-4 | production switch を本サイクル外（FU-03-D）として明示 |

## 真の論点

- 論点 1: モデル候補数を 3 に絞る根拠
  - 結論: pure offline 実行可能（IF / XGBoost）+ Cloudflare 公式推論（Workers AI）の 3 軸で十分。Random Forest / DNN は (1) artifact が肥大、(2) 推論 latency p95 ≥ 500ms 制約に乗らない可能性が高く本サイクルでは除外
- 論点 2: 本サイクルで本番 dataset を待たずに何を確定できるか
  - 結論: 4 classifier の比較 harness、selection criteria のロジック、3 ML classifier 実装、training スクリプト、unit test、synthetic fixture での comparison report までを本サイクルで完結させる。本番 dataset への差し替えは FU-03-B 完了後の 1 行変更で可能
- 論点 3: production switch を含めるか
  - 結論: 含めない。FU-03-D 別タスク。本タスクは「意思決定材料を揃える」までで止める（CONST_007）
- 論点 4: Workers AI の quota / latency をどう test するか
  - 結論: 実 fetch は mock。`fetch` を `vi.spyOn` で差し替えて quota error / 200 OK / timeout の 3 パスを test
- 論点 5: 選定基準の同点処理
  - 結論: precision 優先 → latency 昇順 → fallback rate 昇順 の 3 段階 tie-breaker

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | Gate 通過後に「設定変更のみ」で production switch 可能な状態にする。意思決定の客観性を確保 |
| 実現 | 親 #515 の Classifier interface / offline-replay / leakage grep を再利用。新規追加は 9 ファイル + 5 test |
| 整合 | 親 #515 SSOT / interface / fallback ポリシーと完全互換。production 既定値は `threshold` を維持 |
| 運用 | comparison report は CI 上でも生成可能（synthetic fixture）。本番 dataset への切替は CLI flag のみ |

## 着手 Gate（前提）

| Gate | 条件 | 本サイクルでの扱い |
| --- | --- | --- |
| 前提 1 | FU-03-A (#546) Gate-A/B/C 判定完了 | 本サイクル仕様策定とは独立。実装の comparison 本番実行は前提 1 通過後 |
| 前提 2 | FU-03-B redacted 90 日 dataset 完成 | synthetic fixture（同 schema）で本サイクル代替 |
| 前提 3 | 親 #515 classifier interface / leakage grep 再利用可能 | 確定（親 PR merged 前提） |

## 選定基準（定量化）

| 指標 | 閾値 | 測定方法 |
| --- | --- | --- |
| precision | ≥ baseline (threshold) + 5pt | comparison harness output |
| recall | ≥ baseline (threshold) | comparison harness output |
| fallback rate | ≤ 1%（model load 失敗 + inference error の合算） | comparison harness output |
| latency p95 | ≤ 500ms | per-event timing 計測（performance.now()） |
| latency p50 | 参考値（cut-off なし） | 同上 |

同点時: precision 優先 → latency p95 昇順 → fallback rate 昇順。

## 確定要件

- 3 ML classifier（IsolationForest / XGBoost / WorkersAI）を `Classifier` interface に準拠させ、factory に追加
- 4 classifier 比較 harness を `model-comparison.ts` として新規実装
- 選定基準ロジックを `selection-criteria.ts` として新規実装
- training script 2 本（IF / XGBoost）で model artifact JSON を生成
- synthetic 90 日 fixture を `tests/fixtures/cf-audit/labeled-90day.jsonl` に追加
- production switch は本サイクル外（FU-03-D 起票）

## artifacts.json metadata

```json
{
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created"
}
```

## AC（再掲）

index.md AC-1〜AC-12 を本 Phase で確定とする。

## 完了条件

- [ ] 着手 Gate（前提 1〜3）を `phase-01.md` に明記
- [ ] モデル候補 3 種の選定理由を明記
- [ ] 選定基準 4 指標の閾値を定量化
- [ ] FU-03-D 先送り理由を明記

## 出力

- `phase-01.md`

## 成果物/実行手順

- `index.md` の前提 Gate と整合することを確認
- 実装時は `CF_AUDIT_CLASSIFIER` 既定値 `threshold` を維持

## 参照資料

- `index.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/index.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/phase-01.md`

## 統合テスト連携

- 本 Phase は要件確定のみ。test 追加は Phase 9 で計画する

## 依存Phase参照

なし（最初の Phase）。
