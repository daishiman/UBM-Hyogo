---
phase: 11
title: 手動テスト — evidence inventory（NON_VISUAL / runtime scrape）
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 11 — 手動テスト & Evidence inventory

[実装区分: 実装仕様書]

> 本タスクは NON_VISUAL（DOM scrape = テキスト証跡）。screenshot は撮らず、admin/member の full chrome screenshot は serial-07 / UT-DSF-07 (#829) に委譲する（Phase 1 §2.3）。`outputs/phase-11/screenshots/.gitkeep` は本タスクでは画像を置かないため削除可能。

## Phase 11 evidence file inventory

> 自 workflow の証跡台帳。実 evidence（DOM scrape）は **親 workflow（parallel-03-appshell-layouts）の `outputs/phase-11/`** に出力する。今回サイクルで Playwright scrape を実行し、親 EV-12 と自 workflow の scrape log / cross-ref を `present` に更新した。

| ID | Classification | Path | Status | 取得コマンド / 取得手順 |
|----|----------------|------|--------|------------------------|
| EV-A | playwright scrape log | `outputs/phase-11/scrape-run.log` | present | `PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/outputs/phase-11 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/parallel-03-admin-shell-scrape.spec.ts --project=desktop-chromium --reporter=line 2>&1 \| tee docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/outputs/phase-11/scrape-run.log` |
| EV-B | verify-phase12-compliance log | `outputs/phase-11/verify-phase12.log` | present | `pnpm verify:phase12-compliance 2>&1 \| tee docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/outputs/phase-11/verify-phase12.log` |
| EV-C | typecheck log | `outputs/phase-11/typecheck.log` | present | `pnpm --filter @ubm-hyogo/web typecheck 2>&1 \| tee docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/outputs/phase-11/typecheck.log` |
| EV-D | lint log | `outputs/phase-11/lint.log` | present | `pnpm --filter @ubm-hyogo/web lint 2>&1 \| tee docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/outputs/phase-11/lint.log` |
| EV-E | parent EV-12 cross-ref | `outputs/phase-11/parent-ev12-crossref.md` | present | 親 `dom-scrape-admin.txt` の grep hit と親台帳 EV-12=`present` の対応を記録 |
| EV-F | gate metadata validation log | `outputs/phase-11/gate-metadata-validate.log` | present | `pnpm gate-metadata:validate` tail summary（ERROR 0） |

## 1. 実 evidence の所在（親 workflow）

| 実 evidence | canonical path（親 workflow） | spec 段階の status |
|-------------|------------------------------|--------------------|
| EV-12 admin DOM scrape | `parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt` | present |

## 2. 委譲（本タスクで撮らない）

| EV | 委譲先 | 理由 |
|----|--------|------|
| EV-13 member scrape | serial-05-page-routes-blueprint-binding | member child route 未整備（Phase 1 §2.3） |
| EV-15 admin screenshot | serial-07-regression-evidence / UT-DSF-07 (#829) | full chrome baseline は serial-07 責務 |
| EV-16 member screenshot | serial-07-regression-evidence / UT-DSF-07 (#829) | route 欠如 + serial-07 責務重複 |

## 3. evidence 欠落時のフォールバック

evidence が取得できない項目は本ファイルの該当行を残しつつ status を `pending` のまま保持し、理由・取得予定 path を記載する。`captured` 等 invalid 文字列や空白で欠落を隠さない（validator `VALID_STATUSES = {present, pending, n/a}`）。
