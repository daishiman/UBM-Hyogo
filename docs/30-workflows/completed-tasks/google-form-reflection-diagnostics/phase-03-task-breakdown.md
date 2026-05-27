---
phase: 3
title: タスク分解 — 4 並列単位 (API / Web / Drawer / Test)
workflow_id: google-form-reflection-diagnostics
status: spec_created
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. 分解原則

CONST_005 (単一責務) に基づき、4 並列単位に分解する。各単位は独立 PR として切り出し可能だが、本 Spec-A では 1 PR にまとめる (診断基盤として 4 surface が揃って初めて意味を持つため)。

## 2. 並列単位

### T-A: API diagnostics module (apps/api)

| 項目 | 内容 |
| --- | --- |
| 責務 | `/admin/diagnostics/forms-pipeline` と `/admin/diagnostics/member/:id` の Hono handler + SELECT 集約 |
| 新規ファイル | `apps/api/src/diagnostics/forms-pipeline.ts` / `apps/api/src/diagnostics/member-diagnosis.ts` |
| 編集ファイル | `apps/api/src/index.ts` (route mount) |
| 依存 | 既存 admin middleware / D1 binding / `sync_jobs` 等のテーブル |
| 完了条件 | unit + contract spec green、typecheck pass |

### T-B: Web sync-status route (apps/web)

| 項目 | 内容 |
| --- | --- |
| 責務 | `/admin/sync-status` Server Component + Client island、API fetch wrapper、共有 zod schema |
| 新規ファイル | `apps/web/app/(admin)/admin/sync-status/page.tsx` / `apps/web/src/features/admin/diagnostics/{types.ts,api.ts}` |
| 依存 | T-A (API endpoint shape)、Auth.js session、`getEnv()` |
| 完了条件 | typecheck pass、SSR 初期描画が H1-H4 判別 UI を含む |

### T-C: Member Drawer diagnostics tab (apps/web)

| 項目 | 内容 |
| --- | --- |
| 責務 | 既存 `MemberDrawer.tsx` に診断タブを統合 |
| 新規ファイル | `apps/web/src/features/admin/components/_members/MemberDiagnosticsPanel.tsx` |
| 編集ファイル | `apps/web/src/features/admin/components/MemberDrawer.tsx` |
| 依存 | T-A (`/admin/diagnostics/member/:id`)、既存 Drawer primitive |
| 完了条件 | 既存 Drawer の他 tab を破壊せず診断タブが追加されている |

### T-D: Test 整備

| 項目 | 内容 |
| --- | --- |
| 責務 | contract spec (D1 lane) / unit spec / Playwright env-gated smoke |
| 新規ファイル | `apps/api/src/diagnostics/forms-pipeline.contract.spec.ts` / `.../forms-pipeline.spec.ts` / `.../member-diagnosis.contract.spec.ts` / `apps/web/playwright/tests/admin/sync-status.spec.ts` |
| 依存 | T-A / T-B / T-C |
| 完了条件 | Phase 6 のテスト方針を満たし全 green |

## 3. 依存関係グラフ

```
T-A ──┬─→ T-B ─┐
      │        ├─→ T-D
      └─→ T-C ─┘
```

T-A は T-B / T-C の前提。T-D は最後。

## 4. 工数概算

| 単位 | 規模 | 備考 |
| --- | --- | --- |
| T-A | 中 | SELECT 4-5 本 + zod schema 定義 |
| T-B | 中 | Server Component + Client island の最小実装 |
| T-C | 小 | 既存 Drawer に panel 1 つ追加 |
| T-D | 中 | contract spec の D1 fixture 共有 |

## 5. 並列実行可能性

T-A 完成後は T-B / T-C を並列に進められる。T-D は zod schema fixture を T-A から再利用するため T-A 完成後に着手する。本 Spec-A の PR は 4 単位を 1 commit history にまとめる方針 (個人開発・solo dev)。
