# Phase 12 — ドキュメント同期

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. 同期対象（実施済み）

| 対象 | 操作 | 状況 |
|------|------|------|
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | issue-247 行追加 | 完了 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | issue-247 row 追加 | 完了 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active 節追加 | 完了 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-247-...-artifact-inventory.md` | 新規 inventory | 完了 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | regression guard 節追加 | 完了 |
| `pnpm indexes:rebuild` | 索引再生成 | 検証フェーズで実行 |

本 Phase 12 では pending sync を残さず、実装・正本同期・evidence を同一 wave で完了する。

## 2. strict 7 ファイル

`outputs/phase-12/` に下記を配置（既に作成済み）:

- `main.md`
- `implementation-guide.md`
- `system-spec-update-summary.md`
- `documentation-changelog.md`
- `unassigned-task-detection.md`
- `skill-feedback-report.md`
- `phase12-task-spec-compliance-check.md`

## 3. unassigned source の扱い

`docs/30-workflows/unassigned-task/UT-06-FU-A-open-next-config-regression-tests.md` を consumed source として扱う。削除は行わず、artifact inventory / task-workflow-active から trace 可能にする。

## 4. DoD

- strict 7 すべて配置済み
- compliance-check は canonical 9 見出し逐語含む
- `verify:phase12-compliance` / `gate-metadata:validate` ローカル PASS
