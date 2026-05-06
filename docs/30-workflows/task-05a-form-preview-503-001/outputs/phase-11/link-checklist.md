# link-checklist — task-05a-form-preview-503-001

## workflow 内リンク

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` | `phase-01.md`〜`phase-13.md` | OK |
| `artifacts.json` | `outputs/phase-01/main.md`〜`outputs/phase-13/pr-description.md` | OK |
| `phase-11.md` | `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` / `manual-test-result.md` | OK |
| `phase-12.md` | `outputs/phase-12/main.md` + 6 補助成果物 | OK |

## 実装リンク

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` | `apps/api/src/use-cases/public/get-form-preview.ts` | OK |
| `index.md` | `apps/api/src/repository/schemaVersions.ts` | OK |
| `index.md` | `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | OK |
| `implementation-guide.md` | `apps/api/migrations/0001_init.sql` (`schema_versions` current DDL) | OK |

## aiworkflow-requirements 同期リンク

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `outputs/phase-12/system-spec-update-summary.md` | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | OK |
| `outputs/phase-12/system-spec-update-summary.md` | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | OK |
| `outputs/phase-12/system-spec-update-summary.md` | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | OK |
| `outputs/phase-12/system-spec-update-summary.md` | `.claude/skills/aiworkflow-requirements/references/workflow-task-05a-form-preview-503-001-artifact-inventory.md` | OK |

## mirror parity

`.agents/skills/aiworkflow-requirements` mirror は本ワークツリーの明示対象外。正本は `.claude/skills/aiworkflow-requirements` とし、mirror 差分確認は N/A。
