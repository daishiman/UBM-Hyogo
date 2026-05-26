# regression-evidence-ci-gate-foundation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `regression-evidence-ci-gate-foundation` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| workflow_state | `spec_created` |
| canonical role | `ui-prototype-design-system-foundation/serial-07-regression-evidence` の top-level execution root |
| upstream prerequisite | `serial-00` から `serial-06-form-response-binding` までの green completion |
| runtime boundary | Playwright visual baseline 生成、Phase 11 evidence 取得、commit、push、PR、branch protection mutation は user-gated |

## 目的

serial-00 から serial-06 で構築した UI prototype alignment の成果が後続 PR で退行しないよう、Playwright visual 4 screens と CI gate 6 件を固定する。既存の sub-workflow `docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/` は上流の設計出典として扱い、本 root を今後の実行正本にする。

## Phase 構成

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `phase-01-requirements.md` | spec_created |
| 2 | `phase-02-architecture.md` | spec_created |
| 3 | `phase-03-task-breakdown.md` | spec_created |
| 4 | `phase-04-data-contract.md` | spec_created |
| 5 | `phase-05-implementation-guide.md` | spec_created |
| 6 | `phase-06-test-strategy.md` | spec_created |
| 7 | `phase-07-quality-gates.md` | spec_created |
| 8 | `phase-08-dod.md` | spec_created |
| 9 | `phase-09-risks.md` | spec_created |
| 10 | `phase-10-local-verification.md` | spec_created |
| 11 | `phase-11-evidence-inventory.md` | runtime_pending |
| 12 | `phase-12-compliance.md` | spec_created |
| 13 | `phase-13-commit-pr-draft.md` | pending_user_approval |

## Canonical Outputs

| 種別 | パス |
| --- | --- |
| root artifacts | `artifacts.json` |
| output artifacts mirror | `outputs/artifacts.json` |
| Phase 12 compliance | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| aiworkflow artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-regression-evidence-ci-gate-foundation-artifact-inventory.md` |

## User-Gated Operations

- Playwright visual snapshot baseline の実生成と PNG コミット
- `outputs/phase-11/` の実ログ・スクリーンショット evidence 取得
- branch protection への required status check 追加
- commit、push、PR 作成
