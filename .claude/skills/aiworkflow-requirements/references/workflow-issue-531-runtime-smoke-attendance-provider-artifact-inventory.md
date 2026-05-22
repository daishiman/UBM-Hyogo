---
name: Workflow Issue #531 attendanceProvider staging runtime smoke — artifact inventory
description: Issue #531 staging runtime smoke wave の成果物台帳。Phase 1-13 strict outputs、smoke scripts、Phase 11 placeholder、parent linkage の正本逆引きを提供する
type: reference
---

# Workflow Issue #531 attendanceProvider staging runtime smoke — artifact inventory

> Current canonical root: `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/`
> Historical root (do-not-cite): なし（本 wave で初出）
> Parent (state-bound, do-not-mutate-on-spec): `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/`
> wave: 2026-05-07 / spec_created / implementation / NON_VISUAL / runtime_evidence_pending_user_credentials
> Issue: #531（CLOSED 維持。PR 文脈は `Refs #531`）

## 1. Root artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/index.md` | meta / purpose / scope / dependencies / refs / AC / phase index |
| `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/artifacts.json` | root artifacts metadata（runtime_state = `pending_user_credentials`） |
| `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/artifacts.json` | outputs artifacts metadata（root と phase status vocabulary 一致） |

## 2. Phase 1-13 specification files

| Path | Role |
| --- | --- |
| `phase-01.md` | scope / out-of-scope / NON_VISUAL declaration |
| `phase-02.md` | AC ↔ Phase mapping、route inventory 参照、DI-bound vs inventory-only 軸 |
| `phase-03.md` | ADR: runtime smoke strategy（`outputs/phase-03/adr-runtime-smoke-strategy.md`） |
| `phase-04.md` | 検証方法（jq contract / curl / staging endpoint） |
| `phase-05.md` | 実装計画（smoke script / redact filter） |
| `phase-06.md` | 実装手順 |
| `phase-07.md` | 静的検証（shellcheck）`outputs/phase-07/shellcheck.log` |
| `phase-08.md` | local 検証（dry-run / 単体） |
| `phase-09.md` | 統合検証 |
| `phase-10.md` | リスクと対策（POST 副作用 / PII / secret hygiene / parent state 早期昇格 抑止） |
| `phase-11.md` | runtime evidence path（`outputs/phase-11/evidence/runtime-smoke.log` placeholder + lint/test/typecheck/build/grep-gate） |
| `phase-12.md` | strict 7 files manifest + elegant review |
| `phase-13.md` | commit / push / PR の user-gated 手順 |

## 3. Phase 12 strict outputs（7 + elegant review）

| Path | Role |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 main |
| `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル |
| `outputs/phase-12/system-spec-update-summary.md` | resource-map / quick-reference / task-workflow-active 同期サマリ |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 unassigned task なし（候補 3 件は no-op 理由付き） |
| `outputs/phase-12/documentation-changelog.md` | 変更ファイル台帳 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 10 項目 PASS（artifacts parity / strict 7 / runtime honesty / parent boundary 含む） |
| `outputs/phase-12/skill-feedback-report.md` | テンプレ / ワークフロー / ドキュメント の 3 改善依頼 |
| `outputs/phase-12/elegant-review-evidence.md` | 30 methods compact + 4-condition gate（矛盾 / 漏れ / 整合性 / 依存関係 全 PASS） |

## 4. Phase 11 evidence ledger

| Path | Role |
| --- | --- |
| `outputs/phase-11/main.md` | evidence index |
| `outputs/phase-11/evidence/typecheck.log` | local typecheck PASS |
| `outputs/phase-11/evidence/lint.log` | local lint PASS |
| `outputs/phase-11/evidence/test.log` | local test PASS |
| `outputs/phase-11/evidence/build.log` | local build PASS |
| `outputs/phase-11/evidence/grep-gate.log` | secret / PII grep gate PASS |
| `outputs/phase-11/evidence/runtime-smoke.log` | `pending_user_credentials` placeholder（live PASS は credential 提供後に上書き） |

## 5. Implementation source-of-truth

| Path | Role |
| --- | --- |
| `scripts/smoke/runtime-attendance-provider.sh` | GET-only staging smoke runner。raw body は `mktemp` + `trap rm`、persistent evidence は summary-only |
| `scripts/smoke/redact.sh` | persistent evidence redaction filter |
| `apps/api/src/routes/admin/members.ts` | DI-bound provider path（admin detail）参照元（変更なし） |
| `apps/api/src/routes/me/index.ts` | DI-bound provider path（me profile）参照元（変更なし） |

## 6. Skill reflection / same-wave sync

| Path | Sync target |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Issue #531 workflow 行 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | attendanceProvider runtime smoke 早見 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `pnpm indexes:rebuild` で再生成済 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `pnpm indexes:rebuild` で再生成済 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #531 行 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-531-runtime-smoke-attendance-provider-2026-05.md` | L-ISSUE531-001..005 |
| `.claude/skills/aiworkflow-requirements/changelog/20260507-issue531-runtime-smoke-attendance-provider.md` | 本 changelog |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 2026-05-07 entry |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | `v2026.05.07-issue531-runtime-smoke-attendance-provider` |

## 7. Scope notes

- POST self-request routes (`/me/attendance` POST 等) は inventory-only。GET 以外を実行する smoke を本 wave で増設しない
- production runtime smoke は permanent ban（unassigned-task-detection.md で no-op 判断）
- CI 連携は credential 配置ポリシーが定まった後の別 wave（unassigned-task-detection.md 参照）
- 親 Issue #371 state は live runtime PASS 後にのみ `PASS_RUNTIME_VERIFIED` へ昇格
- 本 wave で `apps/api/src` の endpoint surface / D1 schema / Google Form 仕様の変更は無し

## 8. Related tasks

| Path | Relation |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/index.md` | 親 workflow（runtime evidence boundary を本 wave に委譲） |
| `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/unassigned-task/runtime-smoke-attendance-provider-migration.md` | 起票元 unassigned task（本 wave で consume） |
| `docs/30-workflows/unassigned-task/task-issue-531-ci-runtime-smoke-attendance-provider-001.md` | 後続 unassigned: CI 統合（credential 配置ポリシー確定後・user-gated by Phase 13） |
| `docs/30-workflows/unassigned-task/task-issue-531-production-runtime-smoke-attendance-provider-001.md` | 後続 unassigned: production runtime smoke（user 明示承認後・親 issue-371 state を `PASS_RUNTIME_VERIFIED` に昇格させる前提条件） |
