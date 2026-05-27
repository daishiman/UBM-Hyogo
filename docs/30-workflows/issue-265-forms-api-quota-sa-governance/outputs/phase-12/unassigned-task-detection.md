---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 12
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 12 — Unassigned task detection

## 結論

**unassigned task: 0 件**

候補なし。本 spec から新規 follow-up は発行しない。

## 検出プロセス

| # | 観点 | 検出結果 |
| --- | --- | --- |
| 1 | 親タスク UT-01 の未消化項目 | なし。UT-01 は CLOSED 済で Forms API 移行で再フレーム済 |
| 2 | 旧申し送り先 UT-03 の残課題 | なし。UT-03 CLOSED。本 spec が standalone 代替 |
| 3 | AC-1〜AC-5 の積み残し | Phase 11 sub-doc 7 件は本 spec 内の延長作業（実装サイクル）— 新規 task ではない |
| 4 | UT-08（監視）連携 | UT-08 側で完結。本 spec は閾値の根拠提供のみで未消化なし |
| 5 | UT-25（Secrets）連携 | UT-25 側で完結。本 spec は雛形提供のみで未消化なし |
| 6 | 別 API 同居 / project 切替の即時対応 | trigger 設計済（Phase 3-§3）。発火していないため新規 task 不要 |
| 7 | コード変更を要する事項 | **なし**（runtime backoff / `QUOTA` 分類 / cron すべて既実装） |

## 候補却下の根拠

| 仮想候補 | 却下理由 |
| --- | --- |
| 「Forms API quota dashboard 実装」 | UT-08 のスコープ。本 spec は閾値根拠の提供のみで、新規 follow-up は UT-08 側にぶら下げる |
| 「SA rotation 自動化」 | 現状手動 rotation で十分。自動化要件は未顕在 |
| 「project 切替 dry-run スクリプト」 | trigger 発火していないため不要。発火時に新規 task 化 |
| 「Forms API quota 監視 alert 設定」 | UT-08 範囲 |

## 起票元 unassigned-task の取り扱い

起票元 `U-UT01-06-gcp-quota-allocation-handoff.md` は **本 spec で消費**（consumed）する。Phase 13 closeout で `consumed: true` frontmatter を追記する。新たな unassigned-task として再起票はしない。
