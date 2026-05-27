---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 7
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 7 — 互換性 / 既存資産更新方針

## 1. 起票元 unassigned-task の consumed trace 方針

**対象**: `docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md`

**実施方針**（実施は Phase 13 closeout で行う）:

1. ファイル先頭の **メタ情報テーブル直前** に下記 frontmatter 風ブロックを追記する:

   ```yaml
   ---
   consumed: true
   canonical_workflow: issue-265-forms-api-quota-sa-governance
   consumed_at: 2026-05-26
   issue_refs: ["#265"]
   note: "UT-03 (CLOSED) への申し送りから Forms API quota / SA governance standalone doc へ再フレーム済。"
   ---
   ```

2. 本文の「申し送り先」「組み込み先」セクションに **`canonical_workflow` 参照** を 1 行追記。
3. ファイル自体は **削除しない**（履歴トレース保持 / 不変条件 #5 sync resolver と整合）。

## 2. CLAUDE.md / specs 配下の更新方針

**更新なし**。理由:

- 本 spec は governance / runbook 文書として **standalone** に閉じる。
- CLAUDE.md の不変条件 / フォーム固定値 / シークレット管理ルールはすべて整合済。
- `specs/` 配下の API schema / auth 設計は変更を伴わない。

## 3. 関連スキル（aiworkflow-requirements / task-specification-creator）への波及

**最小限**（Phase 12 skill-feedback-report.md に詳述）:

- aiworkflow-requirements: `references/deployment-secrets-management.md` から本 spec への cross-link 1 行追加を **提案のみ**（実施は Phase 13 範囲外で別途）。
- task-specification-creator: 「申し送り先 task が CLOSED した場合に standalone 化する判断パターン」を patterns-lessons 末尾候補として記録（実施は別 spec）。

## 4. stale ref 補修対象（Phase 13 で実施）

| 参照元 | 現状 | 補修方針 |
| --- | --- | --- |
| `unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md` | 申し送り先 UT-03 のみ参照 | canonical_workflow 参照を追加 |
| `completed-tasks/ut-03-sheets-api-auth-setup/` 配下の U-UT01-06 参照 | あれば「standalone 化」注記を追加 | grep で 0 件確認 → なければ no-op |
| `completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` の MINOR-M-Q-01 | 起票元の MINOR-M-Q-01 記述 | consumed trace 行を追加（実施は Phase 13） |

## 5. 後方互換性

- 本 spec は新規 24 ファイルの追加のみ。既存 doc / コードへの破壊的変更ゼロ。
- 旧 unassigned-task ID `U-UT01-06` は履歴保持のため URL 互換維持。
