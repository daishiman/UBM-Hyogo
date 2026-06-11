# Phase 11 manual smoke log — issue-1175-524-rotation-notify-retirement-reconcile

> NON_VISUAL / docs-only / implemented_local_evidence_captured。本ログは #524 本文編集・ミラー整合後の検証コマンド実測値を記録する。

## source-level 検証（実行済み）

| # | コマンド | 期待結果 | 実測 |
| --- | --- | --- | --- |
| VC-01 | `gh issue view 524 --json body -q .body \| grep -c "Issue #407"` | `0` | `0` PASS |
| VC-02 | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-reminder.yml"` | `0` | `0` PASS |
| VC-03 | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-runbook.md"` | `0` | `0` PASS |
| VC-04 | `gh issue view 524 --json body -q .body \| grep -c "2026-06-08 更新"` | `1` | `1` PASS |
| VC-05 | `grep -cE "cf-token-rotation-reminder.yml\|cf-token-rotation-runbook.md" docs/30-workflows/issues/issue-524.md` | `0` | `0` PASS |
| VC-06 | `gh issue view 1175 --json state -q .state` | `CLOSED` | `CLOSED` PASS |
| RC-01 | `gh issue view 524 --json body -q .body \| grep -c "Issue #351"` | `1` | `1` PASS |
| RC-02 | `gh issue view 524 --json body -q .body \| grep -c "Issue #484"` | `1` | `1` PASS |
| RC-03 | `gh issue view 524 --json body -q .body \| grep -c "ubm-hyogo-ops"` | `>= 1` | `4` PASS |

## 実行境界

| 操作 | 性質 | 状態 |
| --- | --- | --- |
| `gh issue edit 524` の実行 | outward-facing（リモート issue 本文 mutation） | 2026-06-10 実行済み |
| 検証コマンドの実走 | 編集後の確認 | VC-01〜06 / RC-01〜03 PASS |

> 初回検証で撤廃注記に削除済み workflow exact path を含めたため VC-02/VC-05 が失敗した。注記は親タスク root へのリンクに集約し、dangling path 0 件と経緯説明を両立した。
