# Phase 12 (3/6): Documentation Changelog

> ステータス: spec_created / docs-only / NON_VISUAL
> 本タスクの開始から完了までで追加 / 変更されたドキュメントの一覧。

---

## 1. 新規追加ファイル

| 日付 | ファイル | 内容 |
| --- | --- | --- |
| 2026-04-30 | `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-01/main.md` | 要件定義 |
| 2026-04-30 | `outputs/phase-02/canonical-retry-offset-decision.md` | 3 軸 canonical 決定 |
| 2026-04-30 | `outputs/phase-02/migration-impact-evaluation.md` | migration 影響机上評価 |
| 2026-04-30 | `outputs/phase-03/main.md` | 設計レビューゲート |
| 2026-04-30 | `outputs/phase-04/test-strategy.md` | V1-V4 テスト戦略 |
| 2026-04-30 | `outputs/phase-05/ut09-handover-runbook.md` | UT-09 ハンドオーバー |
| 2026-04-30 | `outputs/phase-06/failure-cases.md` | FC-1〜FC-14 失敗ケース |
| 2026-04-30 | `outputs/phase-07/ac-matrix.md` | AC × V × Step × FC マトリクス |
| 2026-04-30 | `outputs/phase-08/main.md` | 用語整流化・申し送り表 |
| 2026-04-30 | `outputs/phase-09/quota-worst-case-calculation.md` | quota worst case 算定 |
| 2026-04-30 | `outputs/phase-10/go-no-go.md` | 最終レビューゲート GO 判定 |
| 2026-04-30 | `outputs/phase-11/main.md` | NON_VISUAL Walkthrough（既存スキャフォールドを expand）|
| 2026-04-30 | `outputs/phase-11/manual-smoke-log.md` | smoke ログ（expand）|
| 2026-04-30 | `outputs/phase-11/link-checklist.md` | link 到達性チェック（expand）|
| 2026-04-30 | `outputs/phase-12/main.md` | Phase 12 close-out summary |
| 2026-04-30 | `outputs/phase-12/implementation-guide.md` | 実装ガイド + 中学生レベル概念説明 |
| 2026-04-30 | `outputs/phase-12/system-spec-update-summary.md` | system spec 追補サマリ |
| 2026-04-30 | `outputs/phase-12/documentation-changelog.md` | 本ファイル |
| 2026-04-30 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出 |
| 2026-04-30 | `outputs/phase-12/skill-feedback-report.md` | skill フィードバック |
| 2026-04-30 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 仕様準拠チェック |

## 2. 既存ファイル変更

| 日付 | ファイル | 内容 |
| --- | --- | --- |
| 2026-04-30 | `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/index.md` | Phase 1-12 completed / Phase 13 pending_user_approval へ ledger 同期、Phase 12 main を成果物に追加 |
| 2026-04-30 | `artifacts.json`, `outputs/artifacts.json` | Phase status と Phase 12 outputs parity を同期 |
| 2026-04-30 | `docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md` | 後継 workflow、Issue closed 注記、AC close-out 状態を追記 |
| 2026-04-30 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | U-UT01-09 retry / offset policy 導線を追加 |
| 2026-04-30 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | legacy Sheets retry / offset policy canonicalization 行を追加 |
| 2026-04-30 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | Legacy Sheets sync transition note を追加 |
| 2026-04-30 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | U-UT01-09 active/spec_created 行を追加 |
| 2026-04-30 | `.claude/skills/aiworkflow-requirements/SKILL.md`, `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | same-wave sync 履歴を追加 |
| 2026-04-30 | `.claude/skills/task-specification-creator/SKILL.md`, `references/phase-12-documentation-guide.md` | docs-only close-out hardening を反映 |
| 2026-04-30 | `.claude/skills/task-specification-creator/changelog/20260430-u-ut01-09-docs-only-closeout-hardening.md` | skill feedback changelog を追加 |

## 3. 削除ファイル

なし。

## 4. UT-01 上流仕様への申し送り

| 対象 | 申し送り内容 |
| --- | --- |
| 起票元 unassigned | 後継 workflow / AC close-out 状態を反映済み |
| aiworkflow-requirements | quick-reference / resource-map / database-schema / task-workflow-active に反映済み |
| `completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/*` | 歴史的成果物として直接編集しない。正本検索導線は本 wave で更新済み |

## 5. 既存実装への申し送り（未反映、UT-09 へ移譲）

- `apps/api/src/jobs/sync-sheets-to-d1.ts:49` `DEFAULT_MAX_RETRIES = 5` → 3
- `apps/api/src/utils/with-retry.ts` base 1s / cap 32s / jitter
- `apps/api/migrations/0003_processed_offset.sql` 新規
- `apps/api/wrangler.toml` / `.dev.vars` `SYNC_MAX_RETRIES = "3"`

## 6. version

| 項目 | 値 |
| --- | --- |
| workflow_state | spec_created |
| docs-only | true |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #263 (CLOSED) |
| 採択判定 | technical GO（Phase 10、user approval とは分離）|
