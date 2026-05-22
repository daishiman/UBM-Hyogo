# Phase 3 — タスク分解

参照: `../../phase-03-task-breakdown.md`

| step | 対象 | 概要 | 依存 |
|------|------|------|------|
| S-01 | `apps/web/app/(public)/layout.tsx` + spec | wrapper を Fragment から grid `<div data-theme="warm" data-route-group="public">` に置換し、header/main/footer を data-* で包む | なし |
| S-02 | `apps/web/app/(admin)/layout.tsx` + spec | wrapper に `data-route-group="admin"` 追加、`<header data-shell="topbar">` 行を新設、`<aside>` を desktop 限定 `md:row-span-2` 化 | なし |
| S-03 | `apps/web/app/(member)/layout.tsx` + spec | wrapper に `data-route-group="member"` 追加、`member-shell` / `member-main` クラス削除 | なし |

実装順: S-01 → S-03 → S-02 (影響最小順)
