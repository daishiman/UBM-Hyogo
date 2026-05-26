---
workflow_id: issue-880-public-segment-error-loading-boundary
issue: https://github.com/daishiman/UBM-Hyogo/issues/880
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
spec_classification: implementation_spec
created_at: 2026-05-24
---

# issue-880 — `(public)` segment error/loading boundary 明示配置

## 実装区分

`[実装区分: 実装仕様書]`

理由: `apps/web/app/(public)/error.tsx` / `loading.tsx` の**新規ファイル追加**と Playwright smoke 1 ケース追加が伴うため、コード変更必須。`docs-only` ではない。

## 概要

serial-06-form-response-binding Phase 5 §0 precondition は `apps/web/app/(public)/error.tsx` / `loading.tsx` の存在を前提とするが、現 worktree では未配置（親 `apps/web/app/error.tsx` / `loading.tsx` がフォールバック中）。本 workflow で `(public)` segment 固有の boundary を明示配置し、precondition drift を解消する。

## 現状確認（2026-05-24 時点・最新コード）

| 項目 | 現状 |
|------|------|
| `apps/web/app/(public)/layout.tsx` | 存在（`PublicHeader` + `PublicFooter` + AppShell 構造、`data-theme="warm"`） |
| `apps/web/app/(public)/error.tsx` | **未配置** |
| `apps/web/app/(public)/loading.tsx` | **未配置** |
| 親 `apps/web/app/error.tsx` | 存在（`"use client"` + `logger.error` + `useAutoFocusOnMount` + Card primitive） |
| 親 `apps/web/app/loading.tsx` | 存在（Card primitive + skeleton） |
| `(admin)/admin/error.tsx` | 存在（scope `"admin"` で `logger.error`） |
| `(admin)/admin/loading.tsx` | 存在 |
| Issue #880 | OPEN（2026-05-24 時点） |

つまり：root と `(admin)` には boundary があるが、`(public)` だけ抜けている。

## 仕様書ファイル一覧

| Phase | ファイル |
|-------|---------|
| 1 | `phase-1-requirements.md` |
| 2 | `phase-2-design.md` |
| 3 | `phase-3-design-review.md` |
| 4 | `phase-4-test-plan.md` |
| 5 | `phase-5-implementation.md` |
| 6 | `phase-6-test-additions.md` |
| 7 | `phase-7-coverage.md` |
| 8 | `phase-8-refactor.md` |
| 9 | `phase-9-qa.md` |
| 10 | `phase-10-final-review.md` |
| 11 | `phase-11-manual-test.md` |
| 12 | `phase-12-documentation.md` |
| 13 | `phase-13-pr.md` |

## スコープ

今回サイクルで完了（CONST_007）:

- 新規: `apps/web/app/(public)/error.tsx`
- 新規: `apps/web/app/(public)/loading.tsx`
- 新規: `apps/web/playwright/tests/public-error-boundary.spec.ts`（force-throw smoke 1 ケース）
- 既存 `serial-06` Phase 12 compliance への backfill 1 行
- evidence: grep evidence + Playwright screenshot

先送りなし。
