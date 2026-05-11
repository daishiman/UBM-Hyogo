# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

Issue #587 の要件を確定する。親 Issue #549（production ML switch / completed）の成果を前提に、**次世代 ML model artifact の rotation**（candidate evaluation → canary → promotion → rollback）を再現可能にする運用基盤を整える本サイクルスコープを切り分ける。次世代 model の学習・選定、artifact フォーマット選定、自動 rotation スケジューラは本サイクルでは扱わない。

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
| 1-1 | Gate-R0〜R3（着手 Gate）と decision table を確定する |
| 1-2 | 本サイクル scope を `rotation scripts + canary workflow contract + runbook + SSOT 同期 + leakage grep gate 流用` に限定する |
| 1-3 | precision/recall proxy / fallback rate / p95 latency / leakage hits の 4 観測軸を確定する |

## 真の論点

- 論点 1: 本タスクで次世代 artifact の実投入まで「実行」するのか、それとも rotation scripts と runbook 整備までで止めるのか
  - 結論: rotation scripts、canary workflow（`workflow_dispatch`）、runbook、SSOT 同期を本サイクルで整備し、実 promotion（`..._PROD` op 参照値の差し替え）と本投入は Gate-R0〜R3 通過後の別サイクルで行う。CONST_007 例外条件 1（外部依存待ち）。
- 論点 2: candidate path を `..._PROD` と並走させるか、`..._PROD` を直接書き換えるか
  - 結論: 並走方式を採用。新設 `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE` を canary 期間中のみ使用し、promotion 時に `..._PROD` を書き換える PR を出す。canary 期間中に `..._PROD` を直接書き換えない。
- 論点 3: rotation の自動化レベル
  - 結論: 本サイクルでは **`workflow_dispatch` で手動起動**、`inputs.candidatePath` に op 参照を渡す方式に限定。自動 rotation スケジューラは Phase 12 で未タスクとして起票。
- 論点 4: canary 期間と判定基準
  - 結論: canary は staging で **offline replay 1 hour 分 + leakage grep 1 回** の dry-run に閉じる。production への投入は別サイクルで判断。precision/recall proxy が baseline を下回らない / fallback rate < 5% / p95 latency が 1.5x 以内 / leakage hits = 0 を Gate-R1〜R2 とする。
- 論点 5: D1 列 `classifier_version` の取り扱い
  - 結論: `classifier_version` 列は親 #515 で追加済み・forward-safe。本タスクで rotation 時に値が変わることを SSOT に明記するが、**schema 変更は行わない**。
- 論点 6: raw feature dataset の取り扱い
  - 結論: 起票元 unassigned-task の備考に従い **保存・配布禁止**。grep evidence で commit / artifact upload に混入していないことを確認する。

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | 次世代 ML model 投入時の品質劣化リスクを candidate evaluation + canary で事前に検知し、forward-safe rollback で復旧コストを最小化する |
| 実現 | rotation scripts 2 本 + canary workflow 1 本 + runbook 1 本で完結。新規 module は `scripts/cf-audit-log/rotation/` に閉じる |
| 整合 | 親 #549 / #515 の Classifier interface / D1 列 / leakage grep を変更せず、追加 step として組む |
| 運用 | rollback は `..._PROD` op 参照値を 1 つ前の path に戻す PR 1 行で完結。D1 列は残置（forward-safe） |

## Gate decision table

| 判定状態 | 条件 | 結論 |
| --- | --- | --- |
| candidate 評価 OK | Gate-R1〜R2 すべて通過 | promotion PR を作成（`..._PROD` op 参照値書き換え）。merge は Gate-R3 後 |
| candidate 破棄 | Gate-R1 不成立（precision/recall proxy 劣化） | candidate 破棄。FU-03-C #548 へ差し戻し |
| canary fail | leakage grep positive | promotion 不可。candidate 破棄 + secret revoke runbook |
| promotion 後 rollback | hourly run で fallback rate / FP / FN いずれかが許容超 | `..._PROD` を 1 つ前の path に戻す PR を即時作成 |

## 確定要件

- 新規 script `artifact-canary.ts` で staging 上の candidate を offline replay + leakage grep する dry-run を提供する
- 新規 script `rotation-evidence-collector.ts` で canary / baseline / rollback evidence を JSON 集約する
- 新規 workflow `cf-audit-log-artifact-canary.yml` で `workflow_dispatch` 起動の canary を提供する
- 新設 `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_CANDIDATE` 参照のみ。実値は記載しない
- runbook `docs/30-workflows/runbooks/ml-model-artifact-rotation.md` で 4 段（candidate evaluation / canary / promotion / rollback）を 1 ページに記述
- SSOT 同期: observability-monitoring / deployment-secrets-management / 15-infrastructure-runbook
- D1 列 `classifier_version` の forward-safe 性を staging migration list で再確認（破壊的 DOWN は実施しない）
- raw feature dataset 不混入の grep evidence を取得

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

- [ ] Gate-R0〜R3 の条件を `outputs/phase-01/main.md` に記述
- [ ] 本サイクル実装スコープ（rotation scripts + canary workflow + runbook + leakage grep gate 流用 + SSOT 同期）を確定
- [ ] 親 #549 / #515 の Classifier interface / D1 列 / leakage grep を変更しない方針を明記
- [ ] forward-safe rollback の 1 step（`..._PROD` 戻し / D1 列残置 / candidate 破棄）を明記

## 出力

- `outputs/phase-01/main.md`

## 成果物/実行手順

- `index.md` の Gate decision table と整合することを確認する。
- 次世代 artifact の実 promotion は Gate-R0〜R3 通過後の実装サイクルで作成する。本サイクルでは contract と SSOT 同期までに限定する。

## 参照資料

- `index.md`
- `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-02.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/index.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- 本 Phase は要件確定のみ。test 追加は Phase 9 で計画する。

## Next Phase

- [Phase 2](phase-02.md): 既存実装調査
