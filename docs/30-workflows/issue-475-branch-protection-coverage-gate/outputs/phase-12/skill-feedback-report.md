# Skill Feedback Report — Issue #475

## テンプレ改善

| ID | 内容 | 提案 |
| --- | --- | --- |
| TF-1 | branch protection 系タスクは `taskType=implementation` だがコード差分が docs + 外部 API 操作のみで Phase 6/7 が完全適用外になる | **今回反映済み**: 本 workflow 内で "settings-only implementation" として Phase 6/7 を維持確認に縮約。skill 本体への恒久昇格は repeated pattern になった時点で判断 |
| TF-2 | Phase 13 PR と Phase 11 runtime evidence の境界が settings-only タスクで曖昧（`gh api PUT` を Phase 11 実行に組み込むべきか Phase 5 に置くべきか） | **今回反映済み**: Gate A（external PUT）と Gate B（git publish）を分離。skill 本体変更は不要 |

## ワークフロー改善

| ID | 内容 | 提案 |
| --- | --- | --- |
| WF-1 | unassigned-task ファイルから Issue → 仕様書化への昇格時、unassigned-task 側のステータス更新ルールが未明記 | **今回反映済み**: source unassigned-task に transferred path を追記 |
| WF-2 | branch protection drift の検証コマンドが `bash` + `jq` の inline で複雑化しがち | **no-op**: Issue #475 は 1 回限りの settings apply で、共通 script は過剰設計。Phase 2/11 に inline deterministic command を固定 |
| WF-3 | Gate A 外部適用後に artifacts / index / aiworkflow indexes が pending のまま残ると close-out 判定が割れる | **今回反映済み**: `runtime_evidence_captured_gate_b_pending` を workflow / artifacts / indexes / compliance に同期 |

## ドキュメント改善

| ID | 内容 | 提案 |
| --- | --- | --- |
| DF-1 | `deployment-branch-strategy.md` の current applied 表が更新タイミングを明記する列を持たない | **今回反映済み**: current applied と Gate B pending 境界を分離。実適用後の current applied 表更新は fresh GET evidence で行う |
| DF-2 | UT-19 (`UT-19-github-branch-protection-manual-apply.md`) を後続タスクが reuse する流れが多いため、共通 runbook 化候補 | **no-op**: Phase 2/5/10/11 に必要手順を埋め込み済み。独立 runbook 化は現時点で重複を増やす |

## routing summary

| 種別 | 件数 | 扱い |
| --- | --- | --- |
| 今回 workflow 内で反映 | 5 | TF-1 / TF-2 / WF-1 / WF-3 / DF-1 |
| no-op（過剰設計回避） | 2 | WF-2 / DF-2 |
| 新規 unassigned-task 化 | 0 | 今回サイクル内で必要な改善は完了済み |
