# workflow-issue-572-attendance-provider-production-runtime-smoke artifact inventory

| 種別 | path | 状態 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/` | implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| root index | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/index.md` | workflow メタ情報 |
| root artifacts | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/artifacts.json` | root / outputs parity required |
| Phase 01 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-01.md` | requirements |
| Phase 02 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-02.md` | acceptance criteria |
| Phase 03 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-03.md` | architecture |
| Phase 04 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-04.md` | api / cli contract |
| Phase 05 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-05.md` | data / state |
| Phase 06 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-06.md` | ui / report layout (NON_VISUAL) |
| Phase 07 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-07.md` | non-functional / observability |
| Phase 08 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-08.md` | security / redaction |
| Phase 09 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-09.md` | test strategy |
| Phase 10 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-10.md` | release / rollout |
| Phase 11 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-11.md` | implementation evidence collection |
| Phase 12 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-12.md` | system spec update / compliance check |
| Phase 13 spec | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/phase-13.md` | PR / closeout |
| Phase 12 main | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/main.md`（※strict 7 files entry）| state entry |
| Phase 12 implementation guide | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/implementation-guide.md` | PR 本文ソース（Phase 13 が参照） |
| Phase 12 system spec update | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/system-spec-update-summary.md` | aiworkflow / task-specification-creator への反映サマリ |
| Phase 12 documentation changelog | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/documentation-changelog.md` | docs 差分記録 |
| Phase 12 unassigned task detection | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/unassigned-task-detection.md` | follow-up タスク検出結果 |
| Phase 12 skill feedback | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/skill-feedback-report.md` | skill 改善提案（Template / Workflow / Documentation 3 findings） |
| Phase 12 compliance check | `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-12/phase12-task-spec-compliance-check.md` | task-spec compliance ゲート結果 |
| production runtime smoke runner（汎用） | `apps/api/scripts/runtime-smoke/run-smoke.sh` | implementation target / 環境共通 entry |
| production runtime smoke runner（production 正本） | `apps/api/scripts/runtime-smoke/run-production-smoke.sh` | implementation target / production GET only |
| production redact filter wrapper | `apps/api/scripts/runtime-smoke/redact-filter-production.sh` | redaction 委譲（SSOT は `scripts/lib/redaction.sh`） |
| api-url guard lib | `apps/api/scripts/runtime-smoke/lib/api-url-guard.sh` | API URL allow-list / production endpoint guard |
| evidence summary lib | `apps/api/scripts/runtime-smoke/lib/evidence-summary.sh` | Phase 11 summary-only evidence 生成 |
| runtime smoke README | `apps/api/scripts/runtime-smoke/README.md` | 実行手順 / exit code / 関連ファイル |
| redaction SSOT | `scripts/lib/redaction.sh` | R-07 production 拡張済（SSOT） |
| runbook（production 正本） | `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | user approval gate / production GET smoke 実行手順 |
| unit test（runtime smoke） | `tests/unit/runtime-smoke.test.sh` | runner / DI-bound array assertion / API URL guard |
| unit test（redaction） | `tests/unit/redaction.test.sh` | R-07 production redaction の正則性検証 |
| Cloudflare API wrapper | `scripts/cf.sh`（`secret list` 等） | implemented wrapper boundary（再利用） |
| aiworkflow lessons | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-572-attendance-provider-production-runtime-smoke-2026-05.md` | L-572-001..003（runner 命名 SSOT / 状態語彙 / Phase 12 path 実在検証） |
| aiworkflow changelog | `.claude/skills/aiworkflow-requirements/changelog/20260508-issue-572-attendance-provider-production-runtime-smoke.md` | sync record |
| aiworkflow task-workflow-active | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #572 行（implemented-local / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING） |
| aiworkflow indexes | `.claude/skills/aiworkflow-requirements/indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` | Issue #572 セクション同期済み |
| 関連 task（昇格対象） | Issue #371 attendanceProvider DI migration | production GET smoke 実行 + 承認後に `PASS_RUNTIME_VERIFIED` 昇格 |

## User Gate

Production GET smoke 実行・redaction grep production log 取得・Issue #371 への runtime evidence 連携・`PASS_RUNTIME_VERIFIED` 昇格・implementation commit / push / PR 作成・production runtime evidence commit（別 PR）はすべて、明示的なユーザー承認まで保留する。本タスクで投入する境界（runner / runbook / redaction SSOT / unit test / Phase 12 strict 7 files）はローカル PASS のみで運用境界を越えない。
