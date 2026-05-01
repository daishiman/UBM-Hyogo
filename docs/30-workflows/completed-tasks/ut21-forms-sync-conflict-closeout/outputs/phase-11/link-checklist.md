# Phase 11 Output: Cross-Link Checklist（死活確認）

## メタ

| 項目 | 値 |
| --- | --- |
| 検証手段 | `test -e <相対 path>` を本リポジトリ root（`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260430-154504-wt-3`）から実行 |
| 実行日時 (UTC) | 2026-04-30T08:13:52Z |
| 対象 | 本仕様書（`docs/30-workflows/ut21-forms-sync-conflict-closeout/`）から参照される外部リンク + 内部 phase 間 cross-link |
| 期待 | MISSING 0 件 |
| 結果 | **MISSING 0 件 / PASS** |

## §1. 内部 cross-link（本仕様書ディレクトリ内）

| # | リンク先（root 相対） | 用途 | 判定 |
| --- | --- | --- | --- |
| 1 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md` | タスク index | OK |
| 2 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/artifacts.json` | 機械可読サマリー | OK |
| 3 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-11.md` | 本 Phase 仕様 | OK |
| 4 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-01/main.md` | 要件定義 | OK |
| 5 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-02/migration-matrix-design.md` | 移植マトリクス | OK |
| 6 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-02/no-new-endpoint-policy.md` | 新設禁止方針 | OK |
| 7 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-03/main.md` | 設計レビュー | OK |
| 8 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-04/test-strategy.md` | テスト戦略 | OK |
| 9 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md` | 実装ランブック / 03a・03b・04c・09b への patch 案 | OK |
| 10 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-06/failure-cases.md` | 異常系検証 | OK |
| 11 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-07/ac-matrix.md` | AC × smoke 対応 | OK |
| 12 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-08/main.md` | DRY 化 / SSOT | OK |
| 13 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-09/main.md` | 品質保証サマリ | OK |
| 14 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-09/rg-verification-log.md` | rg 棚卸しログ | OK |
| 15 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-09/skill-integrity-audit.md` | skill 整合性監査 | OK |
| 16 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-10/go-no-go.md` | GO 判定 | OK |
| 17 | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/artifacts.json` | outputs 集約メタ | OK |

> 内部 17 件すべて存在。

## §2. unassigned-task 配下（姉妹 close-out / 後続派生 / legacy）

| # | リンク先 | 役割 | 判定 |
| --- | --- | --- | --- |
| 1 | `docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md` | 原典 close-out スペック | OK |
| 2 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 姉妹 close-out（同形式） | OK |
| 3 | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | UT-21 当初仕様（legacy） | OK |
| 4 | `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md` | 後続 U02（audit table 要否判定） | OK |
| 5 | `docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md` | 後続 U04（real-env smoke 再実行） | OK |
| 6 | `docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md` | 後続 U05（実装パス境界再整理） | OK |

> unassigned-task 6 件すべて存在。

## §3. 02-application-implementation 配下（移植先）

| # | リンク先 | 役割 | 状態 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | schema sync 正本（完了済） | completed-tasks 配下に移管済 | OK（completed-tasks 経由で参照可能） |
| 2 | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | response sync 正本（完了済） | completed-tasks 配下に移管済 | OK |
| 3 | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/` | admin backoffice API（未実装ディレクトリ） | 本ワークツリーには未存在（将来タスク） | N/A（Phase 5 patch 案は将来適用 / 既知制限 #1 として委譲済み） |
| 4 | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | cron / runbook / smoke 正本 | 本ワークツリーに存在 | OK |
| 5 | `docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/index.md` | staging deploy smoke | 本ワークツリーに存在 | OK |
| 6 | `docs/30-workflows/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/index.md` | production deploy smoke | 本ワークツリーに存在 | OK |
| 7 | `docs/30-workflows/02-application-implementation/07c-parallel-meeting-attendance-and-admin-audit-log-workflow/index.md` | admin audit log workflow | 本ワークツリーに存在 | OK |
| 8 | `docs/30-workflows/02-application-implementation/_design/phase-2-design.md` | 02 全体設計（scope 列挙） | 本ワークツリーに存在 | OK |

> 04c のみ N/A（将来作成予定タスクであり、本 close-out が patch 案を前段で確定する。Phase 5 implementation-runbook §04c 参照）。Phase 12 `documentation-changelog.md` の cross-link 章で「04c 作成時に patch 案を反映する」旨を明記済み（既知制限 #1）。

## §4. .claude/skills/aiworkflow-requirements 配下

| # | リンク先 | 役割 | 判定 |
| --- | --- | --- | --- |
| 1 | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | current facts（UT-21 close-out 済追記済） | OK |
| 2 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | endpoint 仕様参照 | OK |
| 3 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-03a-parallel-forms-schema-sync.md` | 03a 学び | OK |
| 4 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-03b-response-sync-2026-04.md` | 03b 学び | OK |

## §5. apps/api（実装正本・読み取り専用）

| # | リンク先 | 役割 | 判定 |
| --- | --- | --- | --- |
| 1 | `apps/api/src/jobs/sync-forms-responses.ts` | Forms response sync 正本実装 | OK |
| 2 | `apps/api/src/sync/schema/index.ts` | schema sync 正本実装 entry | OK |

## §6. docs/00-getting-started-manual（参考）

| # | リンク先 | 役割 | 判定 |
| --- | --- | --- | --- |
| 1 | `docs/00-getting-started-manual/specs/01-api-schema.md` | フォーム schema 参考 | OK |
| 2 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 構成参考 | OK |

## 集計

| 区分 | 件数 |
| --- | --- |
| OK | 32 |
| N/A（既知制限委譲済み） | 1（04c：未実装ディレクトリ） |
| **MISSING（死リンク）** | **0** |

## 判定

- **PASS**: 死リンク 0 件。N/A 1 件（04c）は既知制限 #1 として Phase 12 へ委譲済み。Phase 12 `documentation-changelog.md` への記載対象。
