# Phase 12 — Compliance Check 仕様

本 spec の Phase 12 成果物は `outputs/phase-12/phase12-task-spec-compliance-check.md` として生成する。canonical 9 headings SSOT（`phase12-compliance-check-template.md` の Required Sections）に **逐語準拠**すること。

## Required Sections（CI gate canonical SSOT 逐語）

1. Summary verdict
2. Changed-files classification
3. `workflow_state` and phase status consistency
4. Phase 11 evidence file inventory
5. Phase 12 strict 7 file inventory
6. Skill/reference/system spec same-wave sync
7. Runtime or user-gated boundary
8. Archive/delete stale-reference gate
9. Four-condition verdict

## 各 section の埋め方（本タスク向け）

| # | 期待内容 |
|---|---------|
| 1 | verdict = `implemented_local_evidence_captured` / Issue #884 OPEN 維持 / docs-only 完了 |
| 2 | 編集ファイル: phase-06 / phase-10 / patterns-lessons-and-pitfalls / unassigned-task / 本 workflow root 配下の Phase 1-13 新規 |
| 3 | `outputs/artifacts.json` root status = `implemented_local_evidence_captured`、Phase 1-12 = `completed`、Phase 13 = `pending_user_approval` と一致 |
| 4 | Phase 11 spec の n/a 1 行テンプレを再掲 |
| 5 | strict 7 ファイル: phase-{01,02,04,05,06,12,13} 全存在を `find` で確認した結果を貼付 |
| 6 | skill `task-specification-creator` への lesson 追記（patterns-lessons-and-pitfalls）が同 PR に含まれることを記録 |
| 7 | runtime gate / user gate なし（docs-only） |
| 8 | unassigned-task → consumed 化 / canonical_workflow pointer 付与 / stale 参照 grep 0 hit |
| 9 | Four-condition: (a) unassigned 0 件化 ✓ (b) skill 同期 ✓ (c) gate green ✓ (d) Issue 状態整合（OPEN 保持）✓ |
