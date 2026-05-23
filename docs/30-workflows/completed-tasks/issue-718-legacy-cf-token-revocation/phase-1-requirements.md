# Phase 1 Requirements

## Goal

Retire the legacy long-lived Cloudflare deploy token after Issue #640 step-scoped token cutover without breaking backend, D1, audit, deploy, or manual recovery paths.

## Required Inputs

| Input | Source | Status |
| --- | --- | --- |
| GitHub Issue | `gh issue view 718` | closed / source spec points to unassigned task |
| Source unassigned task | `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md` | consumed by this workflow |
| Parent workflow | `docs/30-workflows/completed-tasks/issue-640-oidc-cf-token-cutover/` | implemented-local-runtime-pending |
| Skill references | task-specification-creator / aiworkflow-requirements / automation-30 | applied |

## Functional Requirements

- Produce a repository-wide inventory of `CLOUDFLARE_API_TOKEN` references before any revocation.
- Classify each reference as compatible step-scoped usage, legacy dependency, historical documentation, or generated index.
- Record GitHub secret names only; never record values.
- Record 1Password item names and status only; never record item values or `op://` secret content.
- Require saved user approval before Cloudflare token revocation or GitHub secret deletion.
- Update canonical deployment secret inventory in the same wave.

## Non-Functional Requirements

- NON_VISUAL evidence only.
- Redaction is a blocking quality gate.
- Runtime / external mutation evidence remains `runtime_pending_user_gate` until Gate C is executed.
- Commit, push, and PR creation remain user-gated.

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 1 |
| status | completed |

## 目的

Issue #718 の要件と Gate C 境界を確定する。

## 実行タスク

- Source Issue / source unassigned / parent workflow を確認する。
- 機能要件と非機能要件を定義する。

## 参照資料

- `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`
- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`

## 成果物

- `phase-1-requirements.md`

## 完了条件

- Gate C user approval boundary が明記されている。
