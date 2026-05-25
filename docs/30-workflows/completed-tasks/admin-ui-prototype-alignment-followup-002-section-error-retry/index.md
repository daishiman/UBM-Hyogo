---
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
workflow_state: spec_created
created_at: 2026-05-25
owner: daishiman
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: new
source_issue: 881
source_issue_state: CLOSED
parent_workflow: admin-ui-prototype-alignment
---

# admin-ui-prototype-alignment-followup-002 — AdminSectionError retry CTA 追加（client boundary 経由）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| source_issue | #881 CLOSED / Refs only |

[実装区分: 実装仕様書]

## 0. 本仕様書の位置づけと issue 最適化判定

本ワークフローは GitHub issue [#881](https://github.com/daishiman/UBM-Hyogo/issues/881)（`admin-ui-prototype-alignment-followup-002`, state: **CLOSED**）を、**現在のコードベースに最適化して根本解決する**ための実装タスク仕様書である。issue は CLOSED のままで運用する（再オープンしない）。

### 0.1 調査結論: 本タスクは依然として必要（別タスクで未解決）

| 確認軸 | 状態 | 根拠 |
|--------|------|------|
| `AdminSectionError` server component primitive 存在 | ✅ 既存 | `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`（v1 / props only） |
| optional `onRetry` props 受け口 | ❌ 未実装 | 現コード L3-9 `AdminSectionErrorProps` に `onRetry` / `retryLabel` / `isRetrying` なし |
| retry button DOM の描画 | ❌ 未実装 | 現コード L18-50 静的テキスト「再読み込みしてください。」のみ |
| `AdminSectionErrorClient` client wrapper | ❌ 未実装 | `_shared/` 配下に該当ファイル無し |
| 採用箇所 11 page での retry 配線 | ❌ 未実装 | `(admin)/admin/{requests,tags,schema,members,identity-conflicts,meetings,page,dashboard/attendance,meetings/[id]}/page.tsx` |
| 親 workflow の deferred 宣言 | ✅ 維持 | `admin-ui-prototype-alignment/outputs/phase-10/final-review.md` line 23（YAGNI deferred） |

> 既存 unassigned-task spec（`docs/30-workflows/completed-tasks/unassigned-task/admin-ui-prototype-alignment-followup-002-admin-section-error-retry-cta.md`）は内容の正本ソースであり、本ワークフローは同 spec を Phase 1-13 構造に再構成する。新規設計は伴わない。別タスクでの解消は確認できないため、本タスクの実施は必要。

### 0.2 issue 原文からの最適化（現コードとの乖離解消）

| 項目 | issue 原文（unassigned-task spec 起点） | 現コード実態 | 本仕様の採用 |
|------|------------------------------------------|----------------|----------------|
| retry 実装手段 | 「`onRetry` を server component へ直接渡す」案も検討余地 | server component から function props は serializable 違反 | **server component compatible（props only）維持** + `AdminSectionErrorClient` wrapper で `router.refresh()` 注入 |
| retry の粒度 | per-section retry | Next.js App Router の `router.refresh()` は route 全体 RSC re-fetch | **route 全体 refresh で許容**。section-scoped invalidation は別タスク化 |
| 採用 page 範囲 | 「採用候補 page」想定 1 件 | 実際は 11 page で `AdminSectionError` 採用 | **11 page 全て差し替え方針を Phase 5 で明示**（page.tsx を `"use client"` 化しない） |

### 0.3 根本問題（最適化の核心）と本仕様の解法

server component primitive に function props を渡せない React Server Component の制約下で、per-section retry UX を実現するため、**(a)** `AdminSectionError.tsx` は props 拡張のみで server compatible を維持、**(b)** `AdminSectionErrorClient.tsx` 新設で `"use client"` boundary を最小限に閉じ込め、**(c)** 採用 page は server のまま error JSX 部分のみ wrapper に差し替える、という三層構成を採る。`useTransition()` + `router.refresh()` で loading state と RSC 再 fetch を統合する。

## 1. 目的

`AdminSectionError` に optional `onRetry` を追加して per-section retry CTA を提供し、admin partial failure 体験を「全体ブラウザリロード」から「button click による RSC 再 fetch」に置き換える。server component compatible と v1 DOM 互換は破壊しない。

## 2. スコープ

| 含む | 含まない |
|------|---------|
| `AdminSectionError.tsx` の optional props 追加（破壊的変更なし） | `AdminSectionError` 自体の client 化 |
| `AdminSectionErrorClient.tsx`（"use client" wrapper）新規 | section 単位の cache invalidation API 設計 |
| `_shared/index.ts` への re-export 追加 | 既存 API endpoint surface の変更 |
| 採用 11 admin page の error JSX 部分の差し替え | 採用 page 自体の `"use client"` 化 |
| 新規 spec（`AdminSectionErrorClient.spec.tsx`）+ 既存 spec への regression assert 追加 | 新規 primitive 追加（Button 等は既存再利用） |
| Phase 11 evidence inventory（unit test 結果 / axe / grep ログ） | visual / runtime screenshot 取得（`visualEvidence: NON_VISUAL`） |

## 3. 不変条件（CLAUDE.md / parent workflow 継承）

1. 既存 API endpoint surface のみ接続（CLAUDE.md UI prototype alignment 不変条件1）。
2. OKLch トークン正本化。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate）。
3. プロトタイプ正本順位を守り、新規 primitive を追加しない（既存 Button primitive を再利用）。
4. D1 直接アクセス禁止。retry 経路は既存 API endpoint 経由の RSC re-fetch（CLAUDE.md 重要な不変条件 #5）。
5. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（CLAUDE.md 重要な不変条件 #8）。
6. admin form input は対象外（本タスクは error primitive で `<input>` を扱わない）。
7. `apps/web` の env 参照ルール（task-02）は本タスクで触れない（既存維持）。

## 4. CONST_007 適合宣言

本ワークフローの全 Phase は、後続の実装プロンプト（`03.実装.md`）の **1 サイクル内で完了**できるスコープに収めている。先送り前提の Phase / 別 PR 切り出しは存在しない。`AdminSectionError` 拡張・`AdminSectionErrorClient` 新規・11 page 差し替え・spec 追加・evidence inventory までを 1 サイクルで完結させる。section-scoped cache invalidation API 設計は本タスク対象外（§2 の「含まないもの」で明示）。

## 5. Phase 構成

| Phase | ファイル | 責務 |
|-------|---------|------|
| 1 | `phase-01-requirements.md` | 要件定義（FR/NFR・最小 gate・a11y 要件） |
| 2 | `phase-2-design.md` | アーキ（server/client boundary 切り分け・router.refresh+useTransition） |
| 3 | `phase-3-design-review.md` | タスク分解（5 サブタスク） |
| 4 | `phase-4-test-creation.md` | props 契約・a11y 契約 |
| 5 | `phase-5-implementation.md` | 変更ファイル一覧・関数シグネチャ・差分方針・雛形コード |
| 6 | `phase-6-test-expansion.md` | テスト方針（unit / axe / grep） |
| 7 | `phase-7-coverage-check.md` | 品質ゲート |
| 8 | `phase-8-refactoring.md` | Definition of Done（AC-1〜AC-12） |
| 9 | `phase-9-quality-assurance.md` | リスク・フォールバック |
| 10 | `phase-10-final-review.md` | ローカル実行コマンド一覧 |
| 11 | `phase-11-manual-test.md` | evidence inventory ledger |
| 12 | `phase-12-documentation.md` | canonical 9 headings compliance check |
| 13 | `phase-13-pr-creation.md` | commit / PR draft / required status check 候補 |

## 6. 正本順位

1. 本 `index.md`（issue 最適化判定 §0 を含む）
2. 既存 unassigned-task spec（`docs/30-workflows/completed-tasks/unassigned-task/admin-ui-prototype-alignment-followup-002-admin-section-error-retry-cta.md`）— 内容ソース
3. parent workflow（`docs/30-workflows/admin-ui-prototype-alignment/`）
4. 現コード実態（`AdminSectionError.tsx` / 11 採用 page）
5. `docs/00-getting-started-manual/specs/*.md` / プロトタイプ

## 7. 参照

- parent: `docs/30-workflows/admin-ui-prototype-alignment/`
- deferred 根拠: `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-10/final-review.md` line 23
- 既存 spec（内容ソース・本タスク完了時も残置）: `docs/30-workflows/completed-tasks/unassigned-task/admin-ui-prototype-alignment-followup-002-admin-section-error-retry-cta.md`
- 現状実装: `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`
- 採用候補 11 page: `apps/web/app/(admin)/admin/{requests,tags,schema,members,identity-conflicts,meetings,page,dashboard/attendance,meetings/[id]}/page.tsx`
- 既存 primitive: `apps/web/src/features/admin/components/_shared/{AdminSectionCard,AdminEmptyState}.tsx`
- design token 正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- CLAUDE.md「UI prototype alignment / MVP recovery」§不変条件 1-3 / §重要な不変条件 #5 / #8
