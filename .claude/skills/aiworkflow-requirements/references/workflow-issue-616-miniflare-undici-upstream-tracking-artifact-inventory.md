# Issue #616 Miniflare / undici Upstream Tracking Artifact Inventory

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-577-followup-002-miniflare-undici-upstream-tracking |
| Issue | #616（CLOSED 維持。PR 文脈は `Refs #616` のみ） |
| タスク種別 | implementation / NON_VISUAL / conditional |
| canonical task root | `docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/` |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-577-api-coverage-rerun-miniflare-port-exhaustion/` |
| close-out 日 | 2026-05-11 |
| 状態 | verified_current_no_code_change_pending_pr / Phase 11 read-only evidence captured / Phase 12 strict 7 outputs present / Phase 13 user-gated |

## Current Facts

| 項目 | 正本 |
| --- | --- |
| 現 test:coverage worker cap | `apps/api/package.json#scripts.test:coverage` の `--maxWorkers=1 --minWorkers=1` |
| 追跡 repo | `cloudflare/workers-sdk`, `nodejs/undici`, `cloudflare/workerd` |
| triage keywords | `socket`, `EADDRNOTAVAIL`, `keep-alive`, `agent pool`, `port`, `TIME_WAIT` |
| 採用条件 | `--maxWorkers=2 → 4 → auto` の段階評価。候補 N は連続 3 回 133/133 PASS、0 EADDRNOTAVAIL、coverage regression なし。低い候補が fail した場合、より大きい候補は skip 理由を記録して打ち切る |
| 採用時 script 方針 | `--minWorkers` を削除し、`--maxWorkers=<採用N>` のみを正本化 |
| 改善なし時 | `apps/api/package.json` 未変更、`pkg-unchanged.log` を evidence に保存 |
| 不変条件 | apps/api runtime code / D1 schema / Cloudflare binding は変更しない |

## Phase Outputs

| Phase | 場所 | 主要成果物 |
| --- | --- | --- |
| 1-10 | `outputs/phase-01/main.md` ... `outputs/phase-10/main.md` | 要件定義から最終レビューまで |
| 11 | `outputs/phase-11/main.md`, `outputs/phase-11/evidence/` | release triage / optional A/B planned evidence |
| 12 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | strict outputs |
| 13 | `phase-13.md` | PR 準備 / user approval gate |

## Skill 反映先

| ファイル | 反映内容 |
| --- | --- |
| `references/task-workflow-active.md` | active workflow entry |
| `indexes/quick-reference.md` | quick lookup |
| `indexes/resource-map.md` | resource lookup |
| `changelog/20260511-issue616-miniflare-undici-upstream-tracking.md` | dated changelog |
| `LOGS/_legacy.md` | operation log |

## Validation Chain

| 検証 | 期待 |
| --- | --- |
| `node .claude/skills/task-specification-creator/scripts/validate-schema.js --schema schemas/artifact-definition.json --data docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/artifacts.json` | schema PASS |
| `test -f docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md` | consumed trace present |
| `git diff --stat apps/api/src apps/api/migrations` | 0 diff |
| `rg -n "task-issue-577-followup-002-miniflare-undici-upstream-tracking" .claude/skills/aiworkflow-requirements` | inventory / indexes hit |
