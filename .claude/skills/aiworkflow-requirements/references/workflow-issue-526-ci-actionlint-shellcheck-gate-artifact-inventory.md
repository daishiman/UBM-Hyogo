# Issue #526 CI actionlint / shellcheck gate Artifact Inventory

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | issue-526-ci-actionlint-shellcheck-gate |
| タスク種別 | implementation / NON_VISUAL |
| canonical task root | `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` |
| close-out 日 | 2026-05-08 |
| 状態 | implemented-local / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 pending_user_approval |
| Issue | #526 / #350（CLOSED 維持。PR 文脈は `Refs #526, Refs #350` のみ） |
| 起票元 | `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` |

## Current Facts

| 項目 | 正本 |
| --- | --- |
| CI owner | `.github/workflows/ci.yml` |
| dedicated job | `workflow-shell-lint` |
| required context path | 既存 required context `ci` 内の `pnpm observation:lint` |
| local reproduction | `pnpm observation:lint` |
| lint対象 workflow | `.github/workflows/post-release-observation-reminder.yml`, `.github/workflows/ci.yml` |
| lint対象 shell | `scripts/observation/*.sh`, `scripts/observation/test/*.sh` |
| shell unit | `scripts/observation/test/test-create-reminder-issue.sh` |
| scope boundary | reminder workflow の schedule / workflow_dispatch / Issue 作成副作用は変更しない |
| runtime boundary | GitHub Actions runtime evidence / branch protection PUT / commit / push / PR は user approval 後 |

## Phase Outputs

root `artifacts.json` と `outputs/artifacts.json` は full mirror で parity 維持。

| Phase | 場所 | 主要成果物 |
| --- | --- | --- |
| 1-10 | `outputs/phase-01/main.md` ... `outputs/phase-10/main.md` | 要件定義から最終レビューまで |
| 11 | `outputs/phase-11/main.md`, `outputs/phase-11/evidence/` | NON_VISUAL local evidence |
| 12 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | strict outputs |
| 13 | `phase-13.md` | PR 準備 / user approval gate |

## Skill 反映先

| ファイル | 反映内容 |
| --- | --- |
| `SKILL.md` | v2026.05.08 change history row |
| `references/deployment-gha.md` | `workflow-shell-lint` と required `ci` path の current facts |
| `references/post-release-long-term-observation.md` | post-release observation lint gate contract |
| `references/task-workflow-active.md` | active workflow entry |
| `references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` | 苦戦箇所 / 再発防止 |
| `references/lessons-learned.md` | lessons hub link |
| `indexes/quick-reference.md` | quick lookup |
| `indexes/resource-map.md` | resource lookup |
| `indexes/topic-map.md` | generated heading map |
| `changelog/20260508-issue526-ci-actionlint-shellcheck-gate.md` | dated changelog |

## Validation Chain

| 検証 | 期待 |
| --- | --- |
| `cmp artifacts.json outputs/artifacts.json` | root/outputs parity 0 diff |
| `pnpm observation:lint` | shellcheck + actionlint + shell unit PASS |
| `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | indexes regenerated |
| `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js` | structure PASS |
| `diff -qr .claude/skills/aiworkflow-requirements /Users/dm/.agents/skills/aiworkflow-requirements` | mirror sync 後 0 diff |

