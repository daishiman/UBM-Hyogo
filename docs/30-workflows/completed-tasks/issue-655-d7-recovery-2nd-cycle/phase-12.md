# Phase 12 — Close-out compliance

## 目的

`verify-phase12-compliance` gate を満たすため必須 7 outputs を生成し、本タスクが Phase 12 の close-out 規約に整合することを示す。

## 中学生レベル概念説明

「壊れた監視を直してから、もう一度 7 日間ちゃんと動くか観察するタスク」です。
1 回目の観察で記録が抜けたため、抜けた理由を分類して、必要なら直してから、2 回目の観察を最初からやり直します。1 回目と 2 回目の記録が混ざらないよう、ファイル名に `recovery` を付けて分けるのが最大の工夫です。

## Phase 12 必須 7 outputs

| # | 種別 | path |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` |
| 2 | implementation-guide | `outputs/phase-12/implementation-guide.md` |
| 3 | phase12-task-spec-compliance-check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 4 | system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` |
| 5 | skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` |
| 6 | unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` |
| 7 | documentation-changelog | `outputs/phase-12/documentation-changelog.md` |

## 各 outputs 要点

### main.md
- recovery 完走で達成したこと / 残課題 / SSOT 4 ファイル更新 PR-B のリンク

### implementation-guide.md
- PR-A の差分一覧 (Phase 5 の 5-1〜5-5)
- D'+0 確定手順 (Phase 9-1)
- D'+7 集計 workflow_dispatch コマンド (Phase 10)

### phase12-task-spec-compliance-check.md
- canonical heading SSOT (skill `phase12-compliance-check-template.md`) の Required Sections 9 項目を逐語準拠
- 3-state verdict vocabulary (`spec_created` / `runtime_pending` / `completed`) を使用、`PASS` 単独表記禁止
- placeholder token grep 0 件 (token-sized / 09b-token-value / token-mix)
- dirty-code 検査: `git status apps/ packages/` 出力を転記

### system-spec-update-summary.md
- SSOT 4 ファイル (observability-monitoring / task-workflow-active / 親 #549 phase-13 / 15-infrastructure-runbook) の更新差分要約 (PR-B)

### skill-feedback-report.md
- recovery 2 周目運用で得た苦戦パターン (1 周目 / 2 周目 evidence 分離 / D'+0 reset / max 2 周ガード) を skill `references/observability-monitoring.md` への昇格候補として記録

### unassigned-task-detection.md
- max 2 周ガードで打ち切りに至った場合、3 周目 escalation 用の unassigned-task を起票 (条件付き)
- 該当しない場合は "なし" 明記

### documentation-changelog.md
- `15-infrastructure-runbook.md` / `observability-monitoring.md` / `task-workflow-active.md` / `phase-13.md` の各 absolute path 列挙
- canonical path validator 実行記録 (コマンド + exit code + 件数)

## 完了条件

- [ ] 7 outputs が `outputs/phase-12/` に存在 (PR-A 時点で `runtime_pending` 境界付きで完成。PR-B では runtime evidence と SSOT 昇格内容を更新)
- [ ] `verify-phase12-compliance` CI gate が PR-A / PR-B の両方で green
- [ ] PR-A 単体では workflow root は `spec_created`、Phase 12 outputs は `completed (spec close-out)`、runtime evidence は `runtime_pending`。PR-B merge 後に業務状態 `pass_runtime_synced` を SSOT に記録
