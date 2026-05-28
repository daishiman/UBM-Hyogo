# Phase 12: ドキュメント同期

[実装区分: 実装仕様書]

## 同期対象（same-wave）

| Target | 操作 |
|--------|------|
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | `/admin/schema` 節を新 UI 構造に同期（page-head / current revision / stats grid-4 / panel / grid-2） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 workflow を `implemented_local_evidence_captured` 行で追記 |
| `.claude/skills/aiworkflow-requirements/references/workflow-admin-schema-page-prototype-alignment-and-diff-fetch-fix-artifact-inventory.md` | 新規作成（root path / scope / artifacts / Lessons 節） |
| `.claude/skills/aiworkflow-requirements/changelog/20260527-admin-schema-page-prototype-alignment-and-diff-fetch-fix.md` | 新規作成（背景 / Lane A-E 概要 / 関連 spec） |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 1 行 ref 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 1 行 ref 追加 |
| `.claude/skills/task-specification-creator/SKILL-changelog.md` | dated エントリ追加（lessons があれば） |

## strict 7 outputs (`outputs/phase-12/`)

| File | 役割 |
|------|------|
| `main.md` | サイクル概要 + state + 検証 |
| `implementation-guide.md` | 実装ガイド（PR 本文の元） |
| `system-spec-update-summary.md` | system spec 差分要約 |
| `phase12-task-spec-compliance-check.md` | canonical 9 headings 準拠 compliance check |
| `documentation-changelog.md` | 本サイクルでの doc 変更ログ |
| `unassigned-task-detection.md` | unassigned=0 検出明示 |
| `skill-feedback-report.md` | skill 反映フィードバック |

## CI gate（Phase 12 完了で再走査）

- `verify:phase12-compliance`
- `gate-metadata:validate`
- `indexes:rebuild`

## Phase 11 evidence inventory（Phase 11 完了時に更新）

未取得状態では `Status=pending`、authenticated runtime 実施後に `present` へ書き換え。
