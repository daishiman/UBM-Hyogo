# Issue #800 — `/profile/error.tsx` h1 自動 focus 横展開ワークフロー

**[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）

## 実装区分の判定根拠

GitHub Issue #800 の本文は `/profile/error.tsx` への h1 自動 focus 移譲・`aria-live="assertive"`・`error.digest` 表示・`logger.error` 置換を要求しており、現行コード `apps/web/app/profile/error.tsx` を実機調査した結果、いずれも未実装である（`useRef` / `tabIndex={-1}` / `focus()` / `aria-live` / `digest` / `logger` がすべて欠落、`console.error` のみ）。Issue は CLOSED だが実装 commit は存在せず、Phase 12 unassigned-task-detection の follow-up candidate も未消化のため、本ワークフローはコード変更が必須の実装仕様書として作成する。

## メタ情報

```yaml
workflow_id: issue-800-profile-error-focus-transfer
title: /profile/error.tsx h1 自動 focus / aria-live / digest / logger 横展開
category: A11y Horizontal Hardening
github_issue: 800
github_issue_state: CLOSED  # CLOSED のままタスク仕様書を作成（ユーザー明示指示）
status: implemented_local_evidence_captured
parent_workflow: docs/30-workflows/ui-prototype-alignment-mvp-recovery/
source_followup_spec: docs/30-workflows/completed-tasks/issue-769-followup-002-profile-error-focus-transfer.md
horizontal_source_implementation: apps/web/app/error.tsx  # issue-769 で完了済
created_date: 2026-05-19
taskType: implementation
visualEvidence: NON_VISUAL
workflow_state: implemented_local_evidence_captured
implementation_status: implementation_complete_pending_pr
scope: single-cycle
```

## 背景

Issue-769 で root `apps/web/app/error.tsx` の h1 自動 focus / `aria-live="assertive"` / `error.digest` 表示 / `logger.error` 構造化ログが実装完了している。一方 `/profile` segment-level error boundary `apps/web/app/profile/error.tsx` は初回実装 (commit `f91a67bb`) 以降変更されておらず、a11y 要件が root に対して退行している。Issue #800 はこの段差を埋める横展開タスクとして発行された。

## 現状コードの調査結果（2026-05-19 時点）

| 要件 | root `app/error.tsx` | `/profile/error.tsx` 現状 |
|---|---|---|
| `useRef<HTMLHeadingElement>` + `tabIndex={-1}` + `focus({ preventScroll: true })` | ✅ 実装済 | ❌ 未実装 |
| 外側コンテナ `role="alert"` + `aria-live="assertive"` | ✅ 実装済 | ⚠️ `role="alert"` のみ、`aria-live` 欠落 |
| `error.digest` 表示 | ✅ 実装済 | ❌ 未実装 |
| `logger.error({ event, digest, err })` | ✅ 実装済 | ❌ `console.error` のみ |
| dev 限定 `error.stack` 表示 | ✅ 実装済 | ❌ 未実装 |

→ **本ワークフローで実装済み**（2026-05-19 local evidence captured）。

## スコープ（CONST_007 単一サイクル）

差分規模は約 25 行（`/profile/error.tsx` を root と同等パターンに置換）+ 新規テスト 1 ファイル。**今回サイクル内で完結する単一スコープ**として処理する。`/admin/error.tsx` / `/login/error.tsx` への横展開は本ワークフローに含めず、別 followup として残す（CONST_007 例外条件「整合性的に独立した別 route」に該当）。

## 変更対象ファイル

| パス | 種別 |
|---|---|
| `apps/web/app/profile/error.tsx` | 編集（root と同等パターンへ置換） |
| `apps/web/app/profile/__tests__/error.component.spec.tsx` | 新規（root の test を複写し profile 文言へ調整） |

## Phase インデックス

| Phase | 成果物 |
|---|---|
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
| 11 | `outputs/phase-11/manual-smoke-log.md` |
| 12 | `outputs/phase-12/main.md` + 6 補助 output |
| 13 | `outputs/phase-13/pr-summary.md` |
