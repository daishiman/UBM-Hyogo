# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

Issue #549 の要件を確定する。親 Issue #515（ML-ready abstraction）と FU-03-C #548（offline replay）の成果を前提に、**production env 切替**（`CF_AUDIT_CLASSIFIER=threshold` → `=ml`）と **post-switch 7 日 observation** / **forward-safe rollback** の本サイクルスコープを切り分ける。学習データ取得・モデル学習・artifact フォーマット選定は本サイクルでは扱わない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 1-1 | Gate-A〜D（着手 Gate）と decision table を確定する |
| 1-2 | 本サイクル scope を `production env switch + 7 日観測 + forward-safe rollback + leakage grep gate` に限定する |
| 1-3 | Issue 起票数 / fallback rate / leakage grep / p95 latency の 4 観測軸を確定する |

## 真の論点

- 論点 1: 本タスクで production switch まで本当に「実行」するのか、それとも PR diff と runbook 整備までで止めるのか
  - 結論: `.github/workflows/cf-audit-log-monitor.yml` の env 変更、observation script、rollback runbook の実装 contract を本サイクルで整備し、実装 PR と merge は Gate-A〜C 通過 + rollback approval/governance evidence 後の別サイクルで行う。CONST_007 例外条件 1（外部依存待ち）。
- 論点 2: model artifact 配布経路を R2 / Workers AI binding のどちらにするか
  - 結論: 本サイクルでは選択肢を runbook に列挙するに留め、確定は FU-03-C #548 の成果に従う（artifact フォーマット選定は scope out）。`ML_MODEL_PATH` は `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` 参照で抽象化。
- 論点 3: rollback の自動化レベル
  - 結論: rollback は **手動 1 step（env を `threshold` へ戻す PR）** に閉じる。自動 rollback は誤動作リスクが高く、production では採用しない。fallback rate alert は通知のみ。
- 論点 4: 7 日観測の最小 evidence 形式
  - 結論: hourly JSON snapshot（`outputs/phase-11/observation/{hour}.json`）+ 日次サマリ（`outputs/phase-11/observation/day-{n}.md`）+ 終端サマリ（`outputs/phase-11/observation/summary-7day.md`）。
- 論点 5: D1 列の forward-safe 性
  - 結論: 親 #515 で追加済みの `classifier_used` / `classifier_version` / `confidence` は本タスクで **削除しない・変更しない**。staging migration list で再確認のみ実施。

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | ML 切替を実運用に乗せ、7 日観測で誤検知・見逃しを定量的に判定する基盤を整える |
| 実現 | workflow YAML の env 変更 + observation script 追加 + rollback runbook で完結。新規 module は `scripts/cf-audit-log/observation/` に閉じる |
| 整合 | 親 #515 の Classifier interface / D1 列 / leakage grep を変更せず、追加 step として組む |
| 運用 | rollback は env 1 行 + revert PR。D1 列は残置（forward-safe） |

## Gate decision table

| 判定状態 | 条件 | 結論 |
| --- | --- | --- |
| 切替実行 | Gate-A〜C すべて通過 | production env を `ml` へ merge |
| 切替延期 | Gate-A 不成立（offline replay で改善が確認できない） | threshold 継続。stage で artifact 再評価 |
| 切替後 rollback | 7 日観測で FP / FN / fallback rate / leakage grep のいずれかが許容超 | env を `threshold` に戻す PR を即時作成 |
| 部分継続 | fallback rate のみ閾値超 | env を `threshold` に戻し、FU-03-C で artifact 再選定 |

## 確定要件

- production env で `CF_AUDIT_CLASSIFIER=ml` / `ML_MODEL_PATH=op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` を設定する PR を準備する（merge は Gate 後）
- `scripts/cf-audit-log/observation/post-switch-monitor.ts` を新規追加し、hourly JSON snapshot + 日次サマリ + 7 日終端サマリを出力する
- `scripts/cf-audit-log/observation/fallback-rate-alert.ts` を新規追加し、fallback rate > 5% を 3 hour 連続超で GitHub Issue 起票
- `secret-leakage-grep.ts`（親 #515 既存）を hourly post-step に組み込み、検出時 hourly run を fail させる
- rollback runbook を `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に 3 step で追記
- SSOT 同期: observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook
- D1 列の forward-safe 性を staging migration list で再確認（破壊的 DOWN は実施しない）

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
- [ ] 本サイクル実装スコープ（env 切替 PR + observation + rollback runbook + leakage grep gate）を確定
- [ ] 親 #515 の Classifier interface / D1 列 / leakage grep を変更しない方針を明記
- [ ] forward-safe rollback の 3 step（env 戻し / D1 列残置 / artifact 不整合は Issue 起票）を明記

## 出力

- `outputs/phase-01/main.md`

## 成果物/実行手順

- `index.md` の Gate decision table と整合することを確認する。
- production env 切替 PR は Gate-A〜C 通過後の実装サイクルで作成する。本サイクルでは contract と SSOT 同期までに限定する。

## 参照資料

- `index.md`
- `docs/30-workflows/completed-tasks/issue-515-production-ml-switch.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/index.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- 本 Phase は要件確定のみ。test 追加は Phase 9 で計画する。
