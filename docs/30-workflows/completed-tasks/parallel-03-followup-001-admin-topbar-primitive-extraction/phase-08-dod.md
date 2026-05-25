---
phase: 8
title: Definition of Done
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 8 — Definition of Done

[実装区分: 実装仕様書]

## 1. 受け入れ条件（AC）

| ID | 条件 | 検証 |
| --- | --- | --- |
| AC-1 | `apps/web/src/components/layout/AdminTopbar.tsx` が新規追加され、AdminSidebar と対称な props 省略可能 API（`breadcrumb` / `actions`）を持つ | ファイル存在 + Phase 4 契約一致 |
| AC-2 | `(admin)/layout.tsx` から inline `<header data-shell="topbar">` が消え、`<AdminTopbar />` 呼び出しに置換されている | diff 目視 + grep |
| AC-3 | `(admin)/layout.spec.tsx` が**無修正**で pass（data-* 契約維持） | G4 + spec ファイル diff なし |
| AC-4 | `__tests__/AdminTopbar.spec.tsx` が新規追加され、既定 / 注入時の slot 契約・data-* ・OKLch token・axe を検証 | G3 |
| AC-5 | `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning | G1 / G2 |
| AC-6 | `pnpm --filter @ubm-hyogo/web build` が exit 0 | G5 |
| AC-7 | axe critical violation 0 | G7 |
| AC-8 | 新規 primitive・新規 visual 仕様を導入していない（不変条件3） | diff レビュー |
| AC-9 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない（不変条件2） | G6 |
| AC-10 | `AdminTopbar` に `"use client"` を付けていない（Server Component 維持） | grep |
| AC-11 | admin layout から D1 / 外部 API 直接アクセスを追加していない（不変条件5） | diff レビュー |

## 2. 完了判定

AC-1..11 がすべて満たされ、Phase 7 の G1..G7 が green のとき本タスクを `completed` とする。1 つでも未達なら `spec_created` / `runtime_pending` に留める。

## 3. スコープ完了性（CONST_007）

- 本仕様書のスコープは単一実装サイクル（03.実装.md 1 回）で完了する。
- 先送り step・別 PR・バックログ分離は **なし**。
- breadcrumb 実データ統合 / actions ボタン実装は本タスクの「含まない」項目であり、それ自体が独立の別機能タスク（本タスク完了に不要）。先送りではなくスコープ外。
