# Skill Feedback Report

## テンプレ改善

external-time-dependent implementation では、`spec_created` / `implemented_local_runtime_pending` / `pass_boundary_synced_runtime_pending` の3段階を Phase 11 template に明示すると false green を防げる。

## ワークフロー改善

Gate 条件は prose だけでなく `artifacts.json.metadata.gateConditions` と index の decision table の双方に置く。FPR と tuning cost は「ML 比較開始条件」と「threshold 継続条件」を分ける。

## ドキュメント改善

NON_VISUAL evidence guide に offline replay JSON と secret leakage grep の clean/positive 両 fixture evidence 例を追加すると、ML/evaluation 系タスクで再利用できる。

## Promotion status

同 wave では `task-specification-creator` の `LOGS/_legacy.md` に提案を記録済み。template/reference 本体への昇格は、今回の Issue #515 固有実装を検証したあと、複数タスクで再利用可能な一般則として別途 promotion する。現時点では Phase 11 証跡の実体化と本 workflow 内の契約補正を優先し、skill 本体の構造変更は行わない。
