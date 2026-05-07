# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

Issue #515 の要件を確定する。親 Issue #408 が出力する HIGH/MEDIUM/LOW 閾値判定の運用観測を踏まえ、ML 化の **着手 Gate** と **本サイクルで実装するスコープ**（classifier 抽象 + offline evaluation harness + redacted feature extractor）を切り分ける。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 1-1 | Gate-A〜D と decision table を確定する |
| 1-2 | 本サイクル scope を ML-ready abstraction / redacted evaluation に限定する |
| 1-3 | raw source store と redacted dataset の境界を定義する |

## 真の論点

- 論点 1: 本タスクを今回サイクルで「ML 化そのもの」まで進めるか、「ML 化を可能にする抽象化と評価基盤」までで止めるか
  - 結論: 学習データは parent #408 の 90 日運用観測に依存するため、本サイクルは **抽象化 + 評価基盤 + threshold rollback path** に閉じる（CONST_007 例外条件 1: 外部依存待ち）
- 論点 2: classifier 切替のデフォルトをどちらにするか
  - 結論: `CF_AUDIT_CLASSIFIER` 未指定時は `threshold` を維持（後方互換性 / production 影響ゼロ）
- 論点 3: secret leakage の防止粒度
  - 結論: feature 抽出時に IP は `/24` bucket、UA は category 化、actor_email は SHA-256(secret + email) hash、Token id は捨てる。grep test で生値混入を検出する
- 論点 4: 既存 `severity-classifier.ts` をリネームするか、新 module でラップするか
  - 結論: 既存ファイルは触らず、`classifier/threshold.ts` で wrap（rollback と diff 最小化）

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | ML 化の前提となる抽象化を先に整え、Gate 通過後は学習済みモデルを差すだけで切替可能にする |
| 実現 | 既存 `analyze.ts` への classifier 注入 + 新ディレクトリ `classifier/` `features/` `evaluation/` 追加。学習・本番切替は別タスク |
| 整合 | parent #408 の Issue 起票 / 出力形式は完全互換（threshold をデフォルトに固定） |
| 運用 | rollback は `CF_AUDIT_CLASSIFIER=threshold` の env 戻し 1 行 |

## Gate decision table

| 判定状態 | 条件 | 結論 |
| --- | --- | --- |
| threshold 継続 | FPR ≤ 5% かつ tuning cost < 4h/month | ML 切替しない |
| threshold 再調整 | FPR > 5% かつ baseline 7 日 | baseline 30〜90 日で再調整 |
| ML 比較開始 | 90 日 evidence あり、FPR > 5% または tuning cost ≥ 4h/month | redacted dataset + offline replay で比較 |
| production ML 切替 | offline replay で改善、fallback rate 許容、rollback 承認済み | Gate 後 follow-up |

## 確定要件

- `Classifier` interface を `scripts/cf-audit-log/classifier/types.ts` に新規定義
- `ThresholdClassifier` は既存 `severity-classifier.ts` のロジックを 100% 互換でラップ
- `MLClassifier` は skeleton + threshold fallback。モデル本体は別タスク
- redacted feature extractor で IP /24 / hour-of-day / action category / status_class / actor_role を出力
- offline replay と secret leakage grep を CLI として提供
- D1 `cf_audit_log` に `classifier_used` / `classifier_version` / `confidence` カラム追加
- `.github/workflows/cf-audit-log-monitor.yml` に env 渡しを追加（既定値 `threshold`）

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

- [ ] Gate-A〜D の条件を `outputs/phase-01/main.md` に記述
- [ ] 本サイクル実装スコープ（classifier 抽象 + evaluation + feature extractor）を確定
- [ ] 親 Issue #408 出力との後方互換ポリシー（threshold をデフォルト）を明記
- [ ] secret leakage 防止の redaction 方針を明記

## 出力

- `outputs/phase-01/main.md`

## 成果物/実行手順

- `index.md` の Gate decision table と整合することを確認する。
- 実装時は `CF_AUDIT_CLASSIFIER` 既定値 `threshold` を維持する。

## 参照資料

- `index.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-ml-anomaly.md`
- `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/index.md`

## 統合テスト連携

- 本 Phase は要件確定のみ。test 追加は Phase 9 で計画する。
