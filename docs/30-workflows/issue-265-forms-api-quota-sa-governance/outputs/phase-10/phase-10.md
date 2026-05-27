---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 10
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 10 — go/no-go 判定

## 1. Go 条件（すべて満たすこと）

| # | 条件 | 検証手段 | 期待 |
| --- | --- | --- | --- |
| G-1 | AC-1: 配分表完成 + 余裕率 ≤ 70% | Phase 11 `quota-allocation-table.md` + `manual-smoke-log.md` | 数値 fix |
| G-2 | AC-2: SA 分離原則文書化 | Phase 11 `sa-separation-policy.md` | 3 軸表 + 現状判定 |
| G-3 | AC-3: project 切替 trigger 明文化 | Phase 11 `project-switch-trigger.md` | 3 trigger 表 + 手順 |
| G-4 | AC-4: ops runbook 雛形完成 | Phase 11 `ops-runbook.md` | 8 章揃え |
| G-5 | AC-5: 実値非混入 grep 0 件 | Phase 11 `secret-grep-log.md` | grep #1〜#3 = 0 件 |
| G-6 | canonical 9 headings 一致 | Phase 12 `phase12-task-spec-compliance-check.md` | PASS |
| G-7 | strict 7 物理配置 | `ls outputs/phase-12/` | 7 ファイル |
| G-8 | unassigned task 0 件 | Phase 12 `unassigned-task-detection.md` | 「0 件」明記 |
| G-9 | gate-metadata:validate green | `pnpm gate-metadata:validate` | OK |
| G-10 | verify:phase12-compliance green | `pnpm verify:phase12-compliance` | OK |

## 2. No-go 条件（1 つでも該当で停止）

- 実値混入が発覚（G-5 fail）
- canonical 9 headings 不一致（G-6 fail）
- strict 7 欠落（G-7 fail）
- 余裕率 70% 超（G-1 fail）

## 3. 本 spec の go/no-go ステータス

| 段階 | ステータス |
| --- | --- |
| spec_created（本 commit） | **Go**（G-6 / G-7 / G-8 / G-9 / G-10 を docs scope で満たす想定） |
| implementation（Phase 11 sub-doc 7 件配置） | 別サイクルで G-1〜G-5 確定 |
| closeout（Phase 13） | G-1〜G-10 すべて green 後に completed-tasks へ移動 |

## 4. 判定責任

solo dev 運用のため Phase 12 compliance-check と gate-metadata の両方を機械検証する。人手レビューは grep 結果と canonical headings の self-walkthrough のみ。
