# Documentation Changelog

## 変更日: 2026-04-26

### 新規作成（outputs/phase-01〜12）

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| outputs/phase-01/main.md | 新規 | 要件定義 |
| outputs/phase-02/main.md | 新規 | 設計サマリー |
| outputs/phase-02/runtime-topology.md | 新規 | runtime 構成図（key ledger） |
| outputs/phase-02/version-policy.md | 新規 | version policy（key ledger） |
| outputs/phase-03/main.md | 新規 | 設計レビュー |
| outputs/phase-04/main.md | 新規 | 事前検証手順 |
| outputs/phase-05/main.md | 新規 | セットアップ実行 |
| outputs/phase-05/foundation-bootstrap-runbook.md | 新規 | 構築 runbook（key ledger） |
| outputs/phase-06/main.md | 新規 | 異常系検証 |
| outputs/phase-07/main.md | 新規 | 検証項目網羅性 |
| outputs/phase-08/main.md | 新規 | 設定 DRY 化 |
| outputs/phase-08/dependency-boundary-rules.md | 新規 | dependency rules（key ledger） |
| outputs/phase-09/main.md | 新規 | 品質保証 |
| outputs/phase-10/main.md | 新規 | 最終レビュー |
| outputs/phase-11/main.md | 更新 | code_and_docs smoke test サマリー、OpenNext wrangler 確認、スクリーンショット証跡を反映 |
| outputs/phase-11/manual-smoke-log.md | 更新 | チェック項目、Node warning、スクリーンショット証跡を PASS で確定 |
| outputs/phase-11/manual-test-result.md | 新規 | Phase 11 screenshot validator 用の手動テスト結果 |
| outputs/phase-11/link-checklist.md | 更新 | 全成果物パスと状態を記録 |
| outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png | 新規 | `apps/web` runtime foundation home の視覚証跡 |
| outputs/phase-11/screenshots/TC-01-runtime-foundation-home-after.png | 新規 | validator 用 screenshot alias |
| outputs/phase-12/main.md | 新規 | Phase 12 サマリー |
| outputs/phase-12/implementation-guide.md | 新規 | 実装ガイド（PR メッセージ原本） |
| outputs/phase-12/system-spec-update-summary.md | 新規 | Step 1-A〜1-C / Step 2 domain sync |
| outputs/phase-12/documentation-changelog.md | 新規 | 本ファイル |
| outputs/phase-12/unassigned-task-detection.md | 新規 | 未タスク検出 |
| outputs/phase-12/skill-feedback-report.md | 新規 | skill feedback |
| outputs/phase-12/phase12-task-spec-compliance-check.md | 新規 | 最終準拠チェック |

### 更新（正本仕様・same-wave sync）

| ファイル | 変更種別 | 内容 |
| --- | --- | --- |
| .claude/skills/aiworkflow-requirements/references/technology-core.md | 更新 | TypeScript 5.7.x → 6.x（v1.2.0） |
| .claude/skills/aiworkflow-requirements/references/technology-frontend.md | 更新 | @opennextjs/cloudflare 採用方針追記（v1.1.0） |
| .claude/skills/aiworkflow-requirements/references/technology-backend.md | 更新 | apps/web の古い Next.js 15 / Pages 記述を Next.js 16 / OpenNext Workers に同期 |
| .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | 更新 | Web/API 独立デプロイ責務を Next.js 16 + OpenNext Workers / Hono Workers に同期 |
| .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | 確認 | OpenNext 方針との矛盾がないことを確認 |
| CLAUDE.md | 更新 | 最初に読む基準ファイルの Web UI / apps/web を OpenNext Workers 方針へ同期 |
| .claude/skills/aiworkflow-requirements/indexes/topic-map.md | 再生成 | 正本仕様同期後の heading index を更新 |
| .claude/skills/aiworkflow-requirements/indexes/keywords.json | 再生成 | 正本仕様同期後の keyword index を更新 |
| .claude/skills/aiworkflow-requirements/LOGS.md | 更新 | 02-serial-monorepo-runtime-foundation close-out sync を追記 |
| .claude/skills/task-specification-creator/LOGS.md | 更新 | Phase 11 screenshot validator / Phase 12 guide 補正を追記 |
| .claude/skills/aiworkflow-requirements/SKILL.md | 更新 | 変更履歴へ本 close-out sync を追記 |
| .claude/skills/task-specification-creator/SKILL.md | 更新 | 変更履歴へ本 close-out sync と validator 改善を追記 |
| .claude/skills/task-specification-creator/scripts/verify-all-specs.js | 更新 | UBM-Hyogo の phase file 命名に対応 |
| .claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js | 更新 | Phase 11 screenshot coverage と docs-only 例外判定を補正 |
| .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-screenshot-coverage.test.mjs | 更新 | screenshot coverage / docs-only 例外の回帰テストを追加 |
| doc/unassigned-task/UT-20-runtime-foundation-implementation.md | 新規/更新 | Node 24.x 実環境検証・bundle size 証跡を完了済みとして記録 |
| .gitignore | 更新 | OpenNext 生成物 `.open-next/` を除外 |

## artifact parity（成果物の一致確認）

| 種別 | 対象 artifacts.json | 状態 |
| --- | --- | --- |
| infra_artifacts | runtime-topology.md, version-policy.md, foundation-bootstrap-runbook.md, dependency-boundary-rules.md | PASS（全ファイル存在） |
| phase outputs | phase-01〜12 の main.md | PASS（全ファイル存在） |
| phase 12 必須6成果物 | implementation-guide.md 他5点 | PASS（全ファイル存在） |
| phase 11 screenshot | RF-01-runtime-foundation-home-after.png | PASS（home 画面表示を確認） |
