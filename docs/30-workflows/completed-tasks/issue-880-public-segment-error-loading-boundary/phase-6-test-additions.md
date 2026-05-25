---
phase: 6
title: テスト追加
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 6 — テスト追加

[実装区分: 実装仕様書]

## 1. 追加テストファイル

| Path | 種別 | ケース数 |
|------|------|---------|
| `apps/web/playwright/tests/public-error-boundary.spec.ts` | Playwright smoke | 2 |

Phase 5 Step 4 で実装済みのため、本 Phase では実行と PASS 確認のみ。

## 2. 実行結果記録項目

実装時に `outputs/phase-11/manual-test-result.md` へ次を記録:

| TC-ID | 想定結果 | 実測結果 | evidence |
|-------|---------|---------|----------|
| TC-01 | PASS | （実行時記録） | `outputs/phase-11/screenshots/public-error-boundary.png` |
| TC-02 | PASS | （実行時記録） | Playwright report |

## 3. 追加テスト不要の判断記録

| 領域 | 不要理由 |
|------|---------|
| Unit (Vitest) | `(public)/error.tsx` は Client Component で render は logger 呼び出しのみ。Playwright で end-to-end カバー済みのため重複 |
| Unit (`loading.tsx`) | 静的 markup のみ。Playwright visual で確認すれば十分 |
| Contract test | API contract に変更なし |
| Accessibility (axe) | 既存 `Card` primitive を流用しており axe baseline は既に確立済。boundary 単体の axe スイートは過剰 |

## 4. Snapshot baseline 更新

force-throw で発火する画面は **通常導線では描画されない**ため、既存の Playwright visual baseline（home / members / register 等）には影響しない。本 task 専用 screenshot のみ取得し、`outputs/phase-11/screenshots/` に格納する。

## 5. CI 連携

| CI Workflow | 影響 |
|------------|------|
| `playwright-smoke / smoke (chromium)` | 新規 spec 1 件追加（既存 smoke project に自動拾われる） |
| `verify-design-tokens` | 新規 2 ファイルが grep 対象に加わる → pass 想定 |
| `verify-test-suffix` | `.spec.ts` のため pass |
| `verify-indexes-up-to-date` | indexes 変更なし |
| `verify-pr-ready` | `gate-metadata:validate` で本 workflow の artifacts.json を検証 → pass 想定 |
