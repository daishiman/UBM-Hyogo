---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 12
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 12 — Canonical 9 headings

## 1. Phase 12 goal

issue #265 / U-UT01-06 を「UT-03 申し送り」から「Forms API quota / SA governance standalone doc」へ再フレームし、AC-1〜AC-5 を Forms API 文脈で再記述したうえで、docs-only スコープでの spec 一式（24 ファイル）を物理配置する。中学生レベルの説明として「水道の使用量に上限がある（quota）／鍵を共有しすぎない（SA 分離）／使う量が増えたら水道メーターを別契約に分ける（project 切替）」のアナロジーで整理する。

## 2. Implementation summary

- 実装区分: **ドキュメントのみ**。コード変更なし。
- 親タスク UT-01（Sheets→D1）は **Google Forms API** へ移行済。runtime backoff / `QUOTA` 分類 / cron は既実装。
- 旧申し送り先 UT-03 は CLOSED → standalone governance doc へ再フレーム。
- 出力: 24 ファイル（root index + artifacts + Phase 1-13 root pointer + outputs/phase-N 13 + outputs/phase-12 strict 7 + outputs/artifacts mirror）。
- AC-1〜AC-5 の達成手段は Phase 3 で設計、Phase 11 sub-doc 7 件で実装サイクル時に確定。

## 3. Evidence inventory

- 配分表設計: `outputs/phase-3/phase-3.md` §1
- SA 分離 policy 設計: `outputs/phase-3/phase-3.md` §2
- project 切替 trigger 設計: `outputs/phase-3/phase-3.md` §3
- ops runbook ToC: `outputs/phase-3/phase-3.md` §4
- 余裕率計算: `outputs/phase-4/phase-4.md` §3（暫定 0.2〜0.6%）
- grep gate 設計: `outputs/phase-4/phase-4.md` §1
- link check 設計: `outputs/phase-4/phase-4.md` §2

## 4. Phase 11 evidence file inventory

| # | Path | Status |
| --- | --- | --- |
| 1 | outputs/phase-11/phase-11.md | present |
| 2 | outputs/phase-12/main.md | present |
| 3 | outputs/phase-12/implementation-guide.md | present |
| 4 | outputs/phase-12/unassigned-task-detection.md | present |
| 5 | outputs/phase-12/system-spec-update-summary.md | present |
| 6 | outputs/phase-12/documentation-changelog.md | present |
| 7 | outputs/phase-12/skill-feedback-report.md | present |
| 8 | outputs/phase-12/phase12-task-spec-compliance-check.md | present |
| 9 | outputs/phase-11/quota-allocation-table.md | pending |
| 10 | outputs/phase-11/sa-separation-policy.md | pending |
| 11 | outputs/phase-11/project-switch-trigger.md | pending |
| 12 | outputs/phase-11/ops-runbook.md | pending |
| 13 | outputs/phase-11/manual-smoke-log.md | pending |
| 14 | outputs/phase-11/link-checklist.md | pending |
| 15 | outputs/phase-11/secret-grep-log.md | pending |

## 5. Documentation sync

- CLAUDE.md / `docs/00-getting-started-manual/specs/` への更新: **なし**（理由は `system-spec-update-summary.md`）。
- 起票元 unassigned-task への consumed trace: Phase 13 closeout で追記（`outputs/phase-7/phase-7.md` §1）。
- aiworkflow-requirements / task-specification-creator skill への波及: 最小限（`skill-feedback-report.md` 参照）。

## 6. Skill feedback promotion

`skill-feedback-report.md` 参照。本 spec は **新規 lessons なし**。task-specification-creator の patterns-lessons へ昇格する候補は「申し送り先 task が CLOSED した場合に standalone 化する判断パターン」1 件のみ（実施は別 spec）。

## 7. Unassigned task detection

`unassigned-task-detection.md` 参照。**unassigned task: 0 件**。候補なし。新規 follow-up は発行しない。

## 8. Phase 12 task spec compliance check

`phase12-task-spec-compliance-check.md` 参照。canonical 9 headings 自己チェックは **PASS**。strict 7 ファイル物理配置 PASS。

## 9. Phase 13 handoff

- `outputs/phase-13/phase-13.md` で completed-tasks 移動 / consumed trace 追記 / stale ref 補修方針を確定。
- 実装サイクル時に Phase 11 sub-doc 7 件を追加 → 全 Gate 確認 → completed-tasks 移動 → PR 作成（user-gated）。

## 判断ログ

| 日付 | 判断 | 理由 |
| --- | --- | --- |
| 2026-05-26 | 旧 U-UT01-06 を standalone 化 | 旧申し送り先 UT-03 が CLOSED。Forms API 移行で文脈変化済 |
| 2026-05-26 | CLAUDE.md / specs 更新なし | governance / runbook 文書として standalone に閉じる |
| 2026-05-26 | unassigned task 0 件 | 追加すべき follow-up なし。Phase 11 sub-doc 7 件は本 spec 内の延長作業 |
| 2026-05-26 | NON_VISUAL | docs-only タスクで screenshot 対象なし |
