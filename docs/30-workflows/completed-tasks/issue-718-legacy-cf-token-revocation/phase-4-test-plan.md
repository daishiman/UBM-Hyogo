# Phase 4 Test Plan

## Static Checks

| Check | Command | Expected |
| --- | --- | --- |
| Workflow root exists | `test -f docs/30-workflows/issue-718-legacy-cf-token-revocation/artifacts.json` | exit 0 |
| Strict Phase 12 files exist | `find docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12 -maxdepth 1 -type f` | 7 canonical files |
| Secret redaction | `rg -n 'token value|account id|secret value|suffix' docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs` | no leaked values; descriptive terms only |
| Ledger sync | `rg -n 'issue-718-legacy-cf-token-revocation|issue-640-followup-002' .claude/skills/aiworkflow-requirements docs/30-workflows/unassigned-task` | live + consumed references classified |

## Runtime Checks

Runtime checks are Gate C only:

- Confirm legacy token is revoked in Cloudflare dashboard.
- Confirm new step-scoped token paths remain green.
- Confirm GitHub legacy secret names are absent or replaced.
- Confirm 1Password item status matches operator decision.

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 4 |
| status | completed |

## 目的

静的検証と Gate C runtime 検証の境界を定義する。

## 実行タスク

- Static checks を列挙する。
- Runtime checks を Gate C に分離する。

## 参照資料

- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- `phase-4-test-plan.md`

## 完了条件

- Gate C 前に実行可能な検証だけが static checks に入っている。
