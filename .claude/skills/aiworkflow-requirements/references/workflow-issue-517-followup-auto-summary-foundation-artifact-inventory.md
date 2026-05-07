# workflow-issue-517-followup-auto-summary-foundation artifact inventory

| 種別 | path | 状態 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/` | spec_created / implementation / NON_VISUAL |
| root index | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/index.md` | workflow メタ情報 |
| root artifacts | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/artifacts.json` | root / outputs parity required |
| Phase 01 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-01.md` | requirements |
| Phase 02 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-02.md` | acceptance criteria |
| Phase 03 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-03.md` | architecture |
| Phase 04 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-04.md` | api / cli contract |
| Phase 05 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-05.md` | data / state |
| Phase 06 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-06.md` | ui / report layout (NON_VISUAL) |
| Phase 07 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-07.md` | non-functional / observability |
| Phase 08 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-08.md` | security / redaction |
| Phase 09 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-09.md` | test strategy |
| Phase 10 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-10.md` | release / rollout |
| Phase 11 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-11.md` | implementation evidence collection |
| Phase 12 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-12.md` | system spec update / compliance check |
| Phase 13 spec | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/phase-13.md` | PR / closeout |
| Phase 01 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-01/main.md` | requirements output |
| Phase 02 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-02/main.md` | acceptance criteria output |
| Phase 03 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-03/main.md` | architecture output |
| Phase 04 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-04/main.md` | api / cli contract output |
| Phase 05 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-05/main.md` | data / state output |
| Phase 06 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-06/main.md` | ui / report layout output |
| Phase 07 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-07/main.md` | non-functional / observability output |
| Phase 08 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-08/main.md` | security / redaction output |
| Phase 09 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-09/main.md` | test strategy output |
| Phase 10 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-10/main.md` | release / rollout output |
| Phase 11 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-11/main.md` | implementation evidence summary |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-11/evidence/` | actionlint / shellcheck / yaml-syntax / unit-tests / dry-run-stdout / workflow-dispatch-dry-run / duplicate-pr-skip / silent-skip-exit0 / redaction-grep-audit / slack-test-post / permissions.yaml |
| Phase 12 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-12/main.md` | system spec update entry |
| Phase 12 implementation guide | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-12/implementation-guide.md` | PR 本文ソース（Phase 13 が参照） |
| Phase 12 system spec update | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-12/system-spec-update-summary.md` | aiworkflow / task-specification-creator への反映サマリ |
| Phase 12 documentation changelog | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-12/documentation-changelog.md` | docs 差分記録 |
| Phase 12 unassigned task detection | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-12/unassigned-task-detection.md` | follow-up タスク検出結果 |
| Phase 12 skill feedback | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-12/skill-feedback-report.md` | skill 改善提案 |
| Phase 12 compliance check | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-12/phase12-task-spec-compliance-check.md` | task-spec compliance ゲート結果 |
| Phase 13 output | `docs/30-workflows/completed-tasks/issue-517-followup-auto-summary-foundation/outputs/phase-13/main.md` | PR / closeout 出力 |
| GitHub Actions implementation | `.github/workflows/post-release-30day-auto-summary.yml` | 30 日経過後の auto-summary PR 起票ワークフロー（implementation target） |
| 関連 GHA（親契約） | `.github/workflows/post-release-dashboard.yml` | Issue #351 で実装された親 dashboard ワークフロー |
| 関連 GHA（D+7/D+30 reminder） | `.github/workflows/post-release-observation-reminder.yml` | reminder Issue 起票（連携対象） |
| 30day summary script | `scripts/post-release-dashboard/30day-summary.sh` | 30 日経過判定 + 集計 + PR 本文生成 |
| collector implementation | `scripts/post-release-dashboard/collect.sh` | 親 dashboard collector（再利用） |
| collector lib | `scripts/post-release-dashboard/lib/` | aggregate / cf-graphql / cron-status / d1-metrics / format-dashboard / redaction-check |
| collector tests | `scripts/post-release-dashboard/__tests__/` | 30day-summary.test.sh / format-dashboard.test.sh / judgment.test.sh / redaction-check.test.sh / run-all.sh / fixtures |
| collector README | `scripts/post-release-dashboard/README.md` | 運用手順（auto-summary セクション追加） |
| Cloudflare API wrapper | `scripts/cf.sh api-post /client/v4/graphql -d <json>` | implemented wrapper boundary（再利用） |
| aiworkflow GHA spec | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | post-release auto-summary セクション追記（差分反映） |
| aiworkflow changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md` | sync record |
| task-specification-creator phase guide | `.claude/skills/task-specification-creator/references/phase-11-guide.md` | Phase 11 evidence 収集要件の更新（reminder→auto-summary 連携） |
| 親 workflow lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-497-post-release-dashboard-30day-conclusion-2026-05.md` | L-497-001..004（外部時間依存 / file-existence と runtime AC 分離 / 親契約 hardening 同サイクル / 3-fence detection model）— 本 followup の前提教訓 |
| 親 dashboard lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-351-post-release-dashboard-2026-05.md` | Issue #351 の前提教訓 |

## User Gate

Commit / push / PR / real `workflow_dispatch` / scheduled 30 day auto-summary 実行は、明示的なユーザー承認まで保留する。auto-summary PR の自動マージは行わず、必ず人手レビューを経由する。
