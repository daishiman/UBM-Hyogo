# Phase 12 — ドキュメント同期 main

## 1. 本 phase の役割

Phase 1-10 で確定した実装仕様、Phase 11 で確定した NON_VISUAL 視覚証跡区分、Phase 13 で実施する commit/PR の前提として、本 workflow が生成・更新するドキュメント体系を強構造化（strict 7 output）で整理する。

## 2. strict outputs（本 directory 配下）

| ファイル | 役割 |
|---------|------|
| `main.md` | 本ファイル（Phase 12 index） |
| `implementation-guide.md` | Part 1 中学生レベル概念説明 + Part 2 技術詳細 |
| `system-spec-update-summary.md` | docs/00-getting-started-manual/specs/ への波及差分 |
| `documentation-changelog.md` | 本 workflow 内ドキュメント変更ログ |
| `unassigned-task-detection.md` | 未タスク検出結果（0 件でも明示） |
| `skill-feedback-report.md` | aiworkflow-requirements / task-specification-creator skill へのフィードバック |
| `phase12-task-spec-compliance-check.md` | canonical 9 headings 準拠検証 |

## 3. workflow_state 遷移

| 時点 | 状態 |
|------|------|
| 本 phase 完了時 | `implemented_local_evidence_captured` |
| 実装 wave 完了時 | `implemented_local_evidence_captured` |
| CI / staging 検証完了時 | `implemented_runtime_verified` |

## 4. Gate 進捗

| Gate | 状態 | 根拠 |
|------|------|------|
| Gate-A | passed | `phase12-task-spec-compliance-check.md` で 9 headings 全 present |
| Gate-B | passed | Phase 11 manual-test-result.md に local Playwright 28/28 PASS を記録 |
| Gate-C | pending | `outputs/phase-13/pr-creation-result.md` は present、PR 作成は user-gated |

## 5. 関連参照

| 種別 | パス |
|------|------|
| 親 workflow | `docs/30-workflows/public-header-logged-in-nav-cleanup/` |
| 既存 fixtures | `apps/web/playwright/fixtures/auth.ts` |
| 既存 config | `apps/web/playwright.config.ts` |
| 既存 CI | `.github/workflows/playwright-smoke.yml` |
| skill | `.claude/skills/task-specification-creator/`、`.claude/skills/aiworkflow-requirements/` |
