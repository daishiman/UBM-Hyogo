---
phase: 11
title: Evidence inventory — 証跡台帳
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
visual_evidence: NON_VISUAL
---

# Phase 11 — Evidence inventory

[実装区分: 実装仕様書]

## 1. 証跡分類

本タスクは inline JSX → primitive の**リファクタ（visual delta なし）**。VISUAL task ではないため runtime screenshot 証跡（screenshot-plan.json / capture-metadata.json 等）は不要。証跡は local ゲートログ中心。

## 2. 証跡台帳

実装完了時に `outputs/phase-11/` 配下へ保存し、Phase 13 PR 本文から参照する。2026-05-23 の改善サイクルでは EV-01..08 を同 wave で取得する。

| ID | Classification | Path | Status | 取得コマンド |
| --- | --- | --- | --- | --- |
| EV-01 | typecheck log | `outputs/phase-11/typecheck.log` | present | `mise exec -- pnpm typecheck 2>&1 \| tee ...` |
| EV-02 | lint log | `outputs/phase-11/lint.log` | present | `mise exec -- pnpm lint 2>&1 \| tee ...` |
| EV-03 | build log | `outputs/phase-11/web-build.log` | present | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee ...` |
| EV-04 | AdminTopbar spec log | `outputs/phase-11/admin-topbar-spec.log` | present | `vitest run apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` |
| EV-05 | admin layout spec log | `outputs/phase-11/admin-layout-spec.log` | present | `vitest run "apps/web/app/(admin)/layout.spec.tsx"` |
| EV-06 | verify-design-tokens log | `outputs/phase-11/verify-design-tokens.log` | present | `mise exec -- pnpm verify:tokens 2>&1 \| tee ...` |
| EV-07 | git diff stat | `outputs/phase-11/diff-stat.txt` | present | `git diff --stat` |
| EV-08 | layout spec 無修正確認 | `outputs/phase-11/layout-spec-unchanged.txt` | present | `git diff --stat -- "apps/web/app/(admin)/layout.spec.tsx"`（空であること） |

## 3. 必須 / 任意

| ID | 必須 |
| --- | --- |
| EV-01..06 | ◯（quality gate 証跡） |
| EV-07..08 | ◯（PR 直前） |

runtime / staging screenshot 証跡: **不要（NON_VISUAL）**。admin の visual 非回帰は既存 full-visual baseline が担保する（新規 baseline コミットなし）。

## 4. 取得タイミング

- EV-01..06: 全 step 完了後、Phase 7 ゲート実行時にまとめて取得。
- EV-07..08: 同じ改善サイクルで取得。PR 直前に再取得してもよい。

## 5. 欠落時の扱い

evidence が取得できない項目は本ファイルの該当行を残し、`pending` / 理由を明記する。`n/a` や空欄で隠さない。今回の改善サイクルでは全行を物理 evidence として配置する。
