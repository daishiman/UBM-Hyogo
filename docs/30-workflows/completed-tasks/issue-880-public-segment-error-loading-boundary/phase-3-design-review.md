---
phase: 3
title: 設計レビュー
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 3 — 設計レビュー

[実装区分: 実装仕様書]

## 1. レビュー観点

| 観点 | 結果 | コメント |
|------|------|---------|
| 要件カバレッジ | PASS | FR-01..07 全て Phase 2 設計でカバー |
| 既存実装との対称性 | PASS | `(admin)/admin/error.tsx` パターンに対称化（scope tagging） |
| プロトタイプ正本順位 | PASS | 既存 `Card` / `Button` primitive のみ使用、新規 primitive なし |
| OKLch トークン純度 | PASS | HEX 直書きなし、全て token class（`bg-accent`, `text-danger`, `bg-surface-2`, `text-text-3`, `text-panel`, `border-border`） |
| a11y | PASS | `role="alert"` / `aria-live="assertive"` / focus 移動 / `sr-only` 含む |
| Workers 互換 | PASS | Client Component 1 / Server Component 1。Workers runtime API 未使用 |
| `process.env.*` 使用 | PASS（既存対称） | `NODE_ENV !== "production"` のみ、親 `error.tsx` と同パターン。`getEnv()` の必要なし（secret ではないため）|
| テスト suffix | PASS | `*.spec.ts` のみ |
| force-throw hidden route の安全性 | PASS | `NODE_ENV === "production"` で `notFound()` ガード |

## 2. 重要判断記録

### 2.1 hidden route 採用の根拠

Playwright で error boundary 発火を検証するには「常に throw する route」が必要。既存テストでは見当たらないため新規追加する。

代替案:
- (A) 既存 page で fixture を細工して throw させる → 既存 page の責務を汚す。却下
- (B) hidden route `error-boundary-smoke` で throw → 採用。NODE_ENV ガードで production 流出防止

### 2.2 `(public)` boundary を Server Component / Client Component どちらにするか

Next.js App Router の `error.tsx` は仕様上 `"use client"` 必須（reset callback を React state 経由で呼ぶため）。`loading.tsx` は Server Component で OK（親 `loading.tsx` と同じ）。→ 設計通り。

### 2.3 `useAutoFocusOnMount` の二重呼び出し

親 `apps/web/app/error.tsx` には `useAutoFocusOnMount(headingRef)` が 2 回書かれている（L13, L32）。これは既存バグだが本タスクの修正対象外。本タスク追加分は 1 回のみとし、親バグは別 followup（issue 起票候補）に分離する。

## 3. 仕様との差分・判断記録

| 観点 | 仕様（unassigned-task） | 本設計 |
|------|------------------------|--------|
| issue 番号 | TBD | #880 確定 |
| 文言 | 「会員情報を読み込めませんでした」 | 「ページを表示できませんでした」に変更（`(public)/members` 以外でも発火するため汎用化） |
| 導線 | `/(public)/members` / `/register` | `/members` / `/`（trailing-slash 衝突回避・`/register` は失敗時遷移として違和感ありのため top に変更） |
| loading skeleton | ProfileHero / MemberTags / MemberDetailSections スケルトン（既存 primitive の `data-skeleton` 拡張） | 親 `loading.tsx` 同等の Card skeleton（segment 横断で使える汎用構造）|

### 3.1 spec drift（unassigned-task からの変更）の根拠

unassigned-task 仕様は `(public)/members/[id]` 特化 boundary を想定していたが、`(public)` segment には `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms` の 6 routes が含まれる。member detail 特化文言だと他 5 route で違和感が出るため、segment 全体で通用する汎用文言と汎用 skeleton に変更する。

## 4. 判定

**PASS** — Phase 4（テスト計画）へ進行可。
