# Phase 12 Task Spec Compliance Check — ut-07c-followup-001-attendance-csv-import

## 1. Summary verdict

`completed (implemented_local_evidence_captured)`.
本 workflow は root / outputs の artifact ledger、root `index.md`、Phase 1〜13 仕様、Phase 11 VISUAL 4 screenshot + Playwright report、Phase 12 strict 7 成果物、`apps/api` 新 endpoint + service + repository + contract spec、`apps/web` 3-step wizard panel + CSV parse util + Playwright spec、`aiworkflow-requirements` 系 indexes / quick-reference / topic-map / resource-map / task-workflow-active / artifact inventory / SKILL-changelog / LOGS、正本仕様 `docs/00-getting-started-manual/specs/01-api-schema.md` / `11-admin-management.md` への追記を同一 wave で揃えた。
Phase 13 の commit / push / PR / issue 状態変更 / DB mutation / Cloudflare 操作は user approval gate のため未実行 (`pending_user_approval`)。

## 2. Changed-files classification

| Classification | Files |
| --- | --- |
| Runtime code (API) | `apps/api/src/lib/email.ts` (new), `apps/api/src/use-cases/admin/import-attendance-bulk.ts` (new), `apps/api/src/repository/attendance.ts`, `apps/api/src/routes/admin/attendance.ts` |
| Focused test (API) | `apps/api/src/use-cases/admin/__tests__/import-attendance-bulk.spec.ts` (new), `apps/api/src/routes/admin/attendance-import.contract.spec.ts` (new) |
| Runtime code (Web) | `apps/web/app/(admin)/admin/meetings/[id]/page.tsx`, `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` (new), `apps/web/src/lib/csv/parse-attendance.ts` (new) |
| Focused test (Web) | `apps/web/app/(admin)/admin/meetings/[id]/__tests__/AttendanceCsvImportPanel.spec.tsx` (new), `apps/web/src/lib/csv/__tests__/parse-attendance.spec.ts` (new) |
| Playwright VISUAL | `apps/web/playwright/tests/attendance-csv-import.spec.ts` (new), `apps/web/playwright/fixtures/auth.ts` |
| 依存 / lockfile | `apps/web/package.json` (papaparse + @types/papaparse), `pnpm-lock.yaml` |
| 正本仕様 | `docs/00-getting-started-manual/specs/01-api-schema.md`, `docs/00-getting-started-manual/specs/11-admin-management.md` |
| Workflow root | `docs/30-workflows/ut-07c-followup-001-attendance-csv-import/index.md`, `artifacts.json`, `outputs/artifacts.json`, `phase-01..phase-13.md` |
| Phase 11 evidence | `outputs/phase-11/manual-test-result.md`, `outputs/phase-11/screenshots/S1..S4-*.png`, `outputs/phase-11/screenshot-plan.json`, `outputs/phase-11/phase11-capture-metadata.json`, `outputs/phase-11/playwright-report/*`, `outputs/phase-11/monocart/*` |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| aiworkflow-requirements ledgers | `indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}`, `references/api-endpoints.md`, `references/task-workflow-active.md`, `references/workflow-ut-07c-followup-001-attendance-csv-import-artifact-inventory.md` (new), `SKILL.md`, `SKILL-changelog.md`, `LOGS/_legacy.md` |

## 3. `workflow_state` and phase status consistency

Root `artifacts.json` と `outputs/artifacts.json` (両者 `cmp -s` で完全一致) は次を宣言:

- `taskType = implementation`
- `visualEvidence = VISUAL`
- `implementation_mode = new`
- `workflow_state = implemented_local_evidence_captured`
- `implementation_status = implemented_local_evidence_captured`
- Phase 1-12 = `completed`
- Phase 13 = `pending_user_approval`
- Gate-A / Gate-B / Gate-C = `passed`、Gate-D (user-gated PR) = `pending`

`PASS` 単独や `runtime_validated` は使用していない。Phase 11 の VISUAL evidence は 4 screenshot + sha256 を物理 file としてリポジトリ内に配置済み。

## 4. Phase 11 evidence file inventory

| Path | Status | Note |
| --- | --- | --- |
| `outputs/phase-11/manual-test-result.md` | present | Phase 11 主成果物。capture_status / VISUAL 観点 / sha256 表 |
| `outputs/phase-11/screenshots/S1-upload.png` | present | upload 待機状態 |
| `outputs/phase-11/screenshots/S2-preview.png` | present | dry-run preview 表示 |
| `outputs/phase-11/screenshots/S3-confirm-done.png` | present | commit 完了画面 |
| `outputs/phase-11/screenshots/S4-error-deleted-member.png` | present | deleted_member preview / confirm disabled |
| `outputs/phase-11/screenshot-plan.json` | present | 4 screen 計画 (S1〜S4) |
| `outputs/phase-11/phase11-capture-metadata.json` | present | capture_status / sha256 metadata |
| `outputs/phase-11/playwright-report/html/index.html` | present | Playwright HTML report |
| `outputs/phase-11/playwright-report/results.json` | present | Playwright JSON report |
| `outputs/phase-11/monocart/index.html` | present | monocart report |
| `outputs/phase-11/monocart/index.json` | present | monocart JSON |
| `outputs/phase-11/test-results/.last-run.json` | present | Playwright last-run |

すべて workflow root からの相対 path で解決可能。

## 5. Phase 12 strict 7 file inventory

| # | File | Status | lines / key_sections_present |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | present | substantive (≥ 50 行 / 概要・実装ハイライト・行別判定・副作用) |
| 2 | `outputs/phase-12/implementation-guide.md` | present | Part 1 中学生レベル + Part 2 技術詳細、各 Part 本文 3 行以上、背景・要約・実装ステップ・既知制限あり |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | present | `01-api-schema.md` / `11-admin-management.md` / aiworkflow indexes 反映ログ |
| 4 | `outputs/phase-12/documentation-changelog.md` | present | 本サイクル diff サマリ |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | present | 検出結果（0 件 or 明示エントリ）|
| 6 | `outputs/phase-12/skill-feedback-report.md` | present | task-specification-creator / aiworkflow-requirements feedback |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | present | 本ファイル — canonical 9 headings 逐語 |

## 6. Skill/reference/system spec same-wave sync

| Area | Status |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` admin endpoint 表 | `POST /admin/meetings/:sessionId/attendance/import?dryRun=...` を追記 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` meetings/attendance 操作 | CSV 一括 import 3-step wizard を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | csv-import / papaparse / attendance-bulk / 3-step-wizard 等のキーワード追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 本 workflow エントリ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 本 workflow artifact inventory への参照追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | CSV import / audit_log bulk insert topic 追加 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 新 endpoint 行追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 workflow を active として登録 |
| `.claude/skills/aiworkflow-requirements/references/workflow-ut-07c-followup-001-attendance-csv-import-artifact-inventory.md` | 新規 artifact inventory |
| `.claude/skills/aiworkflow-requirements/SKILL.md` / `SKILL-changelog.md` / `LOGS/_legacy.md` | 同 wave で changelog 追記 |
| `.claude/skills/task-specification-creator` | 既存 strict 7 / canonical 9 heading / Phase 11 evidence 表 / heading-only reject 規約で十分。skill file 更新不要 |

## 7. Runtime or user-gated boundary

- 本 wave で実行: 型チェック / lint / focused vitest（API / Web）/ Playwright local による Phase 11 VISUAL evidence 4 screenshot 取得。
- 本 wave で **未** 実行 (user approval gate): commit / push / PR / issue mutation / GitHub label 変更 / D1 migration / Cloudflare Secret / deploy / staging runtime smoke / production runtime smoke。
- 状態語彙: `implemented_local_evidence_captured`。`PASS` 単独や `runtime_validated` は使わない。

## 8. Archive/delete stale-reference gate

- 削除した workflow root はない。
- 本 wave で新規追加した workflow root のみ。`completed-tasks/` への consumed trace 配置は未実行（commit 後にユーザー指示で実施想定）。
- 既存 workflow root の rename / move もない。
- 関連 stale-reference 検査:
  - `rg -n 'attendance-csv-import' .claude/skills/aiworkflow-requirements .claude/skills/task-specification-creator docs/30-workflows`：active workflow 内および artifact inventory への参照のみ。historical-only 参照は無し。
  - 既存 `UT-07C` 親 workflow の add/remove + audit_log 実装は変更していない。後方互換性維持。

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | completed | 新 endpoint surface は親 UT-07C の add/remove と分離。`dryRun=false` 明示時のみ commit、それ以外は安全側 dry-run。`PASS` 単独を使用していない。`implementation_status` / `workflow_state` は両 artifacts.json で同値 |
| 漏れなし | completed | strict 7 全件 present、Phase 11 4 screenshot + sha256 全件 present、`apps/api` 4 ファイル + `apps/web` 5 ファイル + 正本 spec 2 ファイル + aiworkflow ledgers 9 ファイル + workflow root 1 式 を同一 wave 同期 |
| 整合性あり | completed | `implementation / VISUAL / implemented_local_evidence_captured` が artifacts.json (root/outputs)、index.md、Phase 11 capture metadata、Phase 12 strict 7、ledgers で一致 |
| 依存関係整合 | completed | 親 UT-07C add/remove + audit_log の動作を変更せず、新 `listExistingAttendanceMemberIds` lookup と新 endpoint を追加。`apps/web` は既存 `getEnv()` 経由のみ、D1 直接アクセス無し。OKLch トークン正本順位を維持し HEX 直書きなし。CLAUDE.md 不変条件 (1)〜(8) すべて維持 |

判定: **PASS（commit/push/PR は user approval gate のため pending_user_approval）**。
