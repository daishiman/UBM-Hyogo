<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 12 -->

[実装区分: 実装仕様書]

# Phase 12 — ドキュメント同期

## 0. 入口の役割

本ファイルは Phase 12（ドキュメント同期）の入口である。Phase 12 の strict 7 成果物は
`outputs/phase-12/` に集約しているため、本ファイルは索引と close-out ルールのみを持つ。

## 1. strict 7 成果物リンク（`outputs/phase-12/`）

| # | ファイル | 役割 |
| --- | -------- | ---- |
| 1 | [`outputs/phase-12/main.md`](outputs/phase-12/main.md) | Phase 12 総括・索引 |
| 2 | [`outputs/phase-12/implementation-guide.md`](outputs/phase-12/implementation-guide.md) | 中学生レベル + 技術者レベルの実装ガイド（PR 本文流用元） |
| 3 | [`outputs/phase-12/system-spec-update-summary.md`](outputs/phase-12/system-spec-update-summary.md) | 正本仕様への影響評価（影響なし） |
| 4 | [`outputs/phase-12/documentation-changelog.md`](outputs/phase-12/documentation-changelog.md) | 本 workflow で作成/更新したドキュメント一覧 |
| 5 | [`outputs/phase-12/unassigned-task-detection.md`](outputs/phase-12/unassigned-task-detection.md) | 未タスク検出レポート（0 件） |
| 6 | [`outputs/phase-12/skill-feedback-report.md`](outputs/phase-12/skill-feedback-report.md) | skill / template / docs 改善フィードバック |
| 7 | [`outputs/phase-12/phase12-task-spec-compliance-check.md`](outputs/phase-12/phase12-task-spec-compliance-check.md) | canonical 9 見出し準拠チェック |

## 2. 現在状態

- `workflow_state = implemented_local_evidence_captured`。実コード差分は本サイクル内で反映済み。
- 変更対象 2 ファイル（`apps/web/playwright.config.ts` / `apps/web/playwright/tests/members-ux-clarity.spec.ts`）は status=`present`。
- Phase 11 evidence（24 PNG / `manual-test-result.md`）は status=`present`。
- strict 7 ドキュメント（この群）は status=`present`。

## 3. implemented local close-out ルール

- 本 Phase 12 は実装・検証・正本同期の close-out であり、commit・PR は実行しない。
- `artifacts.json` の `workflow_state` は `implemented_local_evidence_captured` とし、Gate-C のみ pending にする。
- workflow root の削除・移動はしない（新規作成のみ）。
- aiworkflow-requirements / task-specification-creator への知見反映を同 wave で実施する。

## DoD

- [ ] strict 7 が `outputs/phase-12/` に揃っている
- [ ] 各ファイルが canonical 構成（compliance-check は 9 見出し逐語）に準拠
- [ ] workflow_state を implemented_local_evidence_captured に同期している
- [ ] user-gated 境界（commit/push/PR/staging baseline/Issue state）が明記されている
