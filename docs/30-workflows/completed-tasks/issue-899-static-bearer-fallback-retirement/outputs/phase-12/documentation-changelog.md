# Documentation Changelog — issue-899-static-bearer-fallback-retirement

## 本 wave で作成・更新したファイル

| ファイル                                                                              | 区分 | 変更概要                                              |
| ------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------- |
| `docs/30-workflows/issue-899-static-bearer-fallback-retirement/index.md`              | NEW  | 仕様書 root（メタ / AC / 順序制約 / DoD）             |
| `docs/30-workflows/issue-899-static-bearer-fallback-retirement/artifacts.json`        | NEW  | metadata / phase12_strict_outputs / verify_commands / gates |
| `docs/30-workflows/issue-899-static-bearer-fallback-retirement/outputs/artifacts.json` | NEW | root/output artifacts parity mirror |
| `docs/30-workflows/issue-899-static-bearer-fallback-retirement/outputs/phase-1..13/`  | NEW  | Phase 1-13 仕様書                                     |
| `docs/30-workflows/issue-899-static-bearer-fallback-retirement/outputs/phase-12/` 7 file | NEW/EDIT | strict 7 outputs。implementation-guide.md は validator 必須構成へ補正 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`           | EDIT | active workflow ledger に本 root を登録               |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-899-static-bearer-fallback-retirement-artifact-inventory.md` | NEW | artifact inventory を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `indexes/resource-map.md` | EDIT | quick lookup / canonical task root に本 root を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` / `LOGS/_legacy.md` / `changelog/20260525-issue899-static-bearer-fallback-retirement-spec.md` | EDIT/NEW | aiworkflow 正本履歴を同期 |

## 実装 PR で更新予定（本仕様書 PR には含まれない）

| ファイル                                                                                                | 区分 | 変更概要                                                  |
| ------------------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------- |
| `.github/workflows/runtime-smoke-staging.yml`                                                          | EDIT | static fallback / freshness warn-only 物理撤去 + fail-fast |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | EDIT | fallback / 即時運用復旧 section 削除、物理削除手順追加    |
| `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`       | EDIT | §6 状態を「完了済み」へ更新                              |

## validator 結果（2026-05-25 実測）

| validator                          | 結果                |
| ---------------------------------- | ------------------- |
| `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/issue-899-static-bearer-fallback-retirement --json` | PASS（12/12 checks OK） |
| `pnpm gate-metadata:validate --require-gates-for-changed docs/30-workflows/issue-899-static-bearer-fallback-retirement/artifacts.json docs/30-workflows/issue-899-static-bearer-fallback-retirement/outputs/artifacts.json` | PASS（ERROR:0） |
| `pnpm verify:phase12-compliance`   | PASS                |
| `bash scripts/verify-pr-ready.sh`  | 実装 PR 作成時に実行（本 wave は commit / PR 禁止） |

## 4 点同期記録

- `artifacts.json` の `metadata.taskId` / `canonical_root` / `phase12_strict_outputs` / `gates.evidence_path` は本 dir path で統一
- `index.md` のメタ表 / Phase 構成表 / artifacts.json `phases` 配列は phase 数・state すべて一致
- 本仕様書 commit には workflow 実装変更を含めないが、aiworkflow 正本索引は同 wave で同期済み
- 関連 issue #899 は CLOSED 維持・state 変更しない
