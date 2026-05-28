---
spec_classification: implementation_spec
state: spec_created
phase: 4
phase_name: テスト計画
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 4: テスト計画

## 4.1 単体 (RTL @ vitest)

配置先: `apps/web/app/(admin)/admin/<seg>/__tests__/page.spec.tsx` (新規。既存にあれば追記)

| spec path | テスト観点 |
|-----------|-----------|
| `tags/__tests__/page.spec.tsx` | (1) AdminPageHeader が h1 として "タグ割当" を render (2) eyebrow="ADMIN / TAGS" 表示 (3) breadcrumbs 末尾が "タグキュー" (4) `<Breadcrumb>` 直要素が DOM に 0 件 |
| `meetings/__tests__/page.spec.tsx` | title="開催日 / 出席管理" |
| `meetings/[id]/__tests__/page.spec.tsx` | title=`${detail.title}`・breadcrumbs 3 段 |
| `schema/__tests__/page.spec.tsx` | actions slot に "resolve 履歴を見る" Link |
| `schema/history/__tests__/page.spec.tsx` | title="alias resolve 履歴" |
| `requests/__tests__/page.spec.tsx` | title="依頼キュー" |
| `identity-conflicts/__tests__/page.spec.tsx` | (1) AdminPageHeader 配置 (2) `<main>` element 0 件 (3) Tailwind palette class 文字列 0 件 |
| `audit/__tests__/page.spec.tsx` | title="監査ログ" |
| `dashboard/attendance/__tests__/page.spec.tsx` | AdminPageHeader 配置のみ (本体は Task D) |

## 4.2 構造 grep gate (vitest)

| spec path | 内容 |
|-----------|------|
| `tests/structure/admin-page-header-adoption.spec.ts` | (1) admin 配下 page.tsx 全件で `AdminPageHeader` import を含むことを assert (2) `from "@/components/admin/Breadcrumb"` import 0 件 (3) palette regex hit 0 件 (4) `<main` の page.tsx 内出現 0 件 |

(類似 gate が既に存在すれば、新規ではなく追記とする。Phase 11 確認事項参照)

## 4.3 visual (Task E 委譲)

baseline 更新は Task E。本タスクでは Phase 11 で参照 screenshot を 9 枚配置するのみ。

## 4.4 panel spec / e2e

panel spec / e2e は触らない (I-C2)。
