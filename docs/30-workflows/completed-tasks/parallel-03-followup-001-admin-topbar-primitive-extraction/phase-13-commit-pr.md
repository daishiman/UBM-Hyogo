---
phase: 13
title: Commit / PR draft
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 13 — Commit / PR draft

[実装区分: 実装仕様書]

## 1. commit message draft

```
refactor(parallel-03-followup-001): extract AdminTopbar primitive from (admin)/layout.tsx

(admin)/layout.tsx の inline <header data-shell="topbar"> を
apps/web/src/components/layout/AdminTopbar.tsx に抽出し、AdminSidebar と
対称な props 省略可能 primitive（breadcrumb / actions slot）に整える。

- AdminTopbar.tsx 新規（Server Component / data-shell="topbar" / OKLch token 逐語移植）
- (admin)/layout.tsx の inline header を <AdminTopbar /> に置換
- __tests__/AdminTopbar.spec.tsx 新規（slot 契約 / data-* / token / axe）
- 既存 (admin)/layout.spec.tsx は無修正で pass（data-* 契約維持）

visual delta なし。新規 design / API surface 追加なし。

Refs #832
```

> 注: issue #832 は既に CLOSED。再オープンせず、PR 本文に「実装で deferred 項目を解消」と明記する。閉じ済み issue のため関係表現は `Refs #832` に統一する。

## 2. PR draft

### title
```
refactor(parallel-03-followup-001): AdminTopbar primitive 抽出
```

### body
```
## Summary
- parallel-03 で deferred とされた admin topbar の primitive 化（issue #832）。
- `(admin)/layout.tsx` の inline `<header data-shell="topbar">` を
  `apps/web/src/components/layout/AdminTopbar.tsx` に抽出。
- AdminSidebar と対称な props 省略可能 primitive（`breadcrumb` / `actions` slot）。
- visual delta なし・新規 design なし・新規 API なしのリファクタ。

## issue 最適化メモ
- issue #832 本文の対象 path `src/components/admin/AdminTopbar.tsx` は古い。
  現コードベースの layout primitive は `src/components/layout/` に集約されているため、
  AdminSidebar と同一の `src/components/layout/AdminTopbar.tsx` に配置した。

## Changes
- new: `apps/web/src/components/layout/AdminTopbar.tsx`
- new: `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx`
- edit: `apps/web/app/(admin)/layout.tsx`（inline header → `<AdminTopbar />`）
- spec: `docs/30-workflows/parallel-03-followup-001-admin-topbar-primitive-extraction/`（phase 1-13）

## Test plan
- [ ] `vitest run src/components/layout/__tests__/AdminTopbar.spec.tsx` green
- [ ] `vitest run "app/(admin)/layout.spec.tsx"` 無修正で green
- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` 0 warning
- [ ] `pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] `pnpm verify:tokens`（HEX 0 件）
- [ ] axe critical 0
- [ ] `(admin)/layout.spec.tsx` の diff が空

## Risks
- data-route-group を primitive に移すと layout spec 破壊（R-01）→ wrapper に残す。
- `"use client"` 混入で RSC 喪失（R-04）→ Server Component 維持。

## 関連
- issue: #832（CLOSED のまま）
- 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/`
- deferred 根拠: parallel-03 `phase-13-commit-pr.md` line 192
```

### base ブランチ
- `dev`（CLAUDE.md 既定）。production リリース時のみ `main`。

## 3. required status check 候補

- `verify-design-tokens / verify-design-tokens`
- `verify-phase12-compliance`
- web typecheck / lint / build / vitest job
- （参考）`playwright-visual-full`（admin baseline 非回帰。新規 baseline コミットなし）

## 4. スクリーンショット

NON_VISUAL タスクのため PR にスクリーンショットセクションを設けない（visual delta なし）。

## 5. マージ後

- issue #832 は CLOSED のまま。本タスク完了で deferred 解消。
- 下流タスク（admin breadcrumb 実装 / topbar actions 拡張）は本 primitive の slot を利用可能になる。
