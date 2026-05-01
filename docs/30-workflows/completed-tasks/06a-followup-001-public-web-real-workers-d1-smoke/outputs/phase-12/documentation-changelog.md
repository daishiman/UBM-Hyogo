# documentation-changelog（spec_created 段階）

## サマリ

本タスクで作成・更新したドキュメント一覧。**実コード変更・migration・commit/push は本タスクのスコープ外**で、すべて Markdown 仕様書のみ。

## 新規作成ファイル（本タスクで作成）

### タスク仕様書 root

- `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/index.md`（前段で作成済み）
- `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/artifacts.json`（前段で作成済み）

### Phase 1〜10 仕様書（前段で作成済み）

- `phase-01.md` 〜 `phase-10.md`
- `outputs/phase-01/main.md`
- `outputs/phase-02/main.md`, `outputs/phase-02/d1-binding-flow.mmd`
- `outputs/phase-03/main.md`
- `outputs/phase-04/main.md`, `outputs/phase-04/curl-matrix.md`
- `outputs/phase-05/main.md`, `outputs/phase-05/runbook.md`
- `outputs/phase-06/main.md`
- `outputs/phase-07/main.md`, `outputs/phase-07/ac-matrix.md`
- `outputs/phase-08/main.md`
- `outputs/phase-09/main.md`
- `outputs/phase-10/main.md`

### Phase 11〜13 仕様書（本 SubAgent で作成）

- `phase-11.md`
- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
- `outputs/phase-11/evidence/`（ディレクトリのみ。実 evidence は smoke 実行時に追記）
- `phase-12.md`
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`（本ファイル）
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `phase-13.md`
- `outputs/phase-13/main.md`
- `outputs/phase-13/local-check-result.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-template.md`
- `outputs/phase-13/pr-info.md`
- `outputs/phase-13/pr-creation-result.md`

## 更新予定ファイル（pending — 別 PR）

- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`

詳細は `system-spec-update-summary.md` 参照。

## 同一 wave 更新ファイル（本レビューで追加）

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`

## Issue / PR メタ情報

| 項目 | 値 |
| --- | --- |
| 関連 Issue | #273（**CLOSED のまま再オープンしない**） |
| 本 PR の Issue 参照 | `Refs #273`（`Closes #273` 禁止） |
| PR ステージ | spec_created（仕様書のみ） |
| 後続 PR | smoke 実 evidence 追記 / system spec 反映（別 PR） |

## 不変条件 trace

- 不変条件 #5: 仕様書全体で `apps/web` → `apps/api` → D1 経路を明記
- 不変条件 #6: GAS prototype を smoke 対象外として明記
