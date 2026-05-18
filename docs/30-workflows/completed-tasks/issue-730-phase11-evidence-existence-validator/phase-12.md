# Phase 12 — 完了同期

## 1. Phase 12 strict 7 ファイル

`docs/30-workflows/issue-730-phase11-evidence-existence-validator/outputs/phase-12/` 配下に以下を作成する。

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `main.md` | Phase 12 概要・完了サマリ |
| 2 | `implementation-guide.md` | Part 1〜11 の実装ガイド（各 Part 本文 ≥ 3 行、必須 key sections 含む — heading-only PASS 不可） |
| 3 | `system-spec-update-summary.md` | `references/phase-11-non-visual-alternative-evidence.md` への validator 仕様セクション追記サマリ |
| 4 | `documentation-changelog.md` | docs / skill / spec の更新差分 changelog |
| 5 | `unassigned-task-detection.md` | 関連 unassigned-task (`task-27-followup-002-phase11-evidence-existence-validator.md`) の `currentViolations` 解消結果 |
| 6 | `skill-feedback-report.md` | `task-specification-creator` skill に対する feedback（本タスクで追加した validator 仕様の昇格状況） |
| 7 | `phase12-task-spec-compliance-check.md` | 9 canonical heading + Phase 11 evidence inventory + 4-condition verdict |

## 2. canonical heading SSOT 厳守

`phase12-task-spec-compliance-check.md` には以下 9 heading を canonical 順序で含める:

1. Summary verdict
2. Changed-files classification
3. `workflow_state` and phase status consistency
4. Phase 11 evidence file inventory
5. Phase 12 strict 7 file inventory
6. Skill/reference/system spec same-wave sync
7. Runtime or user-gated boundary
8. Archive/delete stale-reference gate
9. Four-condition verdict

## 3. Phase 11 evidence inventory（自己記述）

```markdown
## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| NON_VISUAL phase11 main | `outputs/phase-11/main.md` | present |
| NON_VISUAL manual evidence | `outputs/phase-11/manual-test-result.md` | present |
| NON_VISUAL smoke log | `outputs/phase-11/manual-smoke-log.md` | present |
| NON_VISUAL link checklist | `outputs/phase-11/link-checklist.md` | present |
```

本タスクで追加する validator が、この同じ表を `pnpm verify:phase12-compliance` で検証して exit 0 にすることが Gate-B の合格条件（self-verification）。

## 4. 3-state Verdict

| Condition | Verdict |
| --- | --- |
| 矛盾なし | `completed (local implementation and focused test PASS)` |
| 漏れなし | `completed (strict outputs and ledgers present)` |
| 整合性あり | `completed (state synced; command evidence captured)` |
| 依存関係整合 | `completed (source unassigned consumed; ledgers synced)` |

## 5. workflow_state 遷移

`spec_created` → 実装後 `implemented_local_evidence_captured`。GitHub-hosted CI green 後の final close は Phase 13 user gate 後に扱う。

## 6. unassigned-task / ledger 同期

- `docs/30-workflows/unassigned-task/task-27-followup-002-phase11-evidence-existence-validator.md` の status を `completed`（実装済み）に更新
- `.claude/skills/task-specification-creator/changelog/` に本タスク entry を 1 行追加（task-spec-creator 自身の skill 改善 reference）

## 7. 同 wave 必須同期

| 対象 | 同期内容 |
| --- | --- |
| `references/phase-11-non-visual-alternative-evidence.md` | validator 仕様セクション追記 |
| `references/phase12-compliance-check-template.md` | heading 構造変更なしを Phase 12 で確認 |
| `scripts/lib/phase12-compliance/` | コード本体 |
| `scripts/__tests__/fixtures/phase12-compliance/` | fixture |
