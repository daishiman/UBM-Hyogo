---
spec_classification: implementation_spec
state: spec_created
phase: 5
phase_name: 実装手順
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 5: 実装手順

## 5.1 変更対象 file (11 件)

Phase 1.2 参照。

## 5.2 AdminPageHeader props 拡張 (擬似 diff)

```diff
 // apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx
 interface AdminPageHeaderProps {
   readonly title: string;
   readonly description?: string;
   readonly breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>;
   readonly actions?: ReactNode;
+  readonly eyebrow?: string;
+  readonly headingId?: string;
 }

 export function AdminPageHeader({
   title,
   description,
   breadcrumbs,
   actions,
+  eyebrow,
+  headingId,
 }: AdminPageHeaderProps) {
   return (
     <header className="flex flex-col gap-2 border-b border-[var(--ubm-color-border-default)] pb-4">
       {breadcrumbs && breadcrumbs.length > 0 ? (...) : null}
+      {eyebrow ? (
+        <p className="text-[10px] font-semibold uppercase tracking-[var(--ubm-eyebrow-tracking,0.12em)] text-[var(--ubm-color-text-muted)]">
+          {eyebrow}
+        </p>
+      ) : null}
       <div className="flex flex-wrap items-center justify-between gap-3">
-        <h1 className="...">{title}</h1>
+        <h1 id={headingId} className="...">{title}</h1>
         {actions ? <div className="...">{actions}</div> : null}
       </div>
       {description ? <p className="...">{description}</p> : null}
     </header>
   );
 }
```

## 5.3 各 page.tsx の差分方針 (共通パターン擬似 diff)

```diff
- import { Breadcrumb } from "@/components/admin/Breadcrumb";
+ import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";
  ...
  <section className="flex flex-col gap-4">
-   <Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "<X>" }]} />
+   <AdminPageHeader
+     eyebrow="ADMIN / <SEG>"
+     title="<X>"
+     description="<設計表 description>"
+     breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "<X>" }]}
+     actions={<...>}
+   />
    {result.ok ? <Panel .../> : <AdminSectionError .../>}
  </section>
```

## 5.4 個別差分

### schema/page.tsx

- 既存 `<nav>` + Link "resolve 履歴を見る" → AdminPageHeader の `actions` slot に移動
- 既存 `<section aria-labelledby="schema-form-h">` + 独自 h1 → AdminPageHeader (h1 所有)

### schema/history/page.tsx

- SchemaDiffHistoryPanel 呼び出し前に AdminPageHeader を section でラップ
- 既存 panel の Breadcrumb / h1 は `showChrome={false}` で抑止し、page heading は AdminPageHeader に一本化

### dashboard/attendance/page.tsx

- 独自 `<h1 id="admin-attendance-dashboard-h">` を AdminPageHeader に置換
- `headingId="admin-attendance-dashboard-h"` を渡して既存 `aria-labelledby` を維持
- 本体 KPI / table 改修は Task D

### identity-conflicts/page.tsx

- 共通パターン + `<main>` 削除
- `<ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200">` → `<ul className="divide-y divide-[var(--ubm-color-border-default)] rounded-md border border-[var(--ubm-color-border-default)]">`
- `<a className="text-sm text-blue-600 ...">` → `<Link className="text-sm text-[var(--ubm-color-link-default)] ...">`
- `<EmptyState />` → `<AdminEmptyState />` (page.tsx 層に残る場合)

### panel heading duplication guard

- `MeetingPanel` / `MeetingAttendancePanel` / `RequestQueuePanel` / `AuditLogPanel` は既存 standalone 表示を壊さないため `showHeading = true` を default にする
- Task C page から呼ぶ場合だけ `showHeading={false}` を渡し、AdminPageHeader と panel 内 h1 の重複を防ぐ
- `SchemaDiffHistoryPanel` は `showChrome = true` を default にし、Task C page から `showChrome={false}` を渡す

## 5.5 tokens.css 追加

```css
:root {
  --ubm-color-link-default: var(--ubm-color-accent);
  --ubm-eyebrow-tracking: 0.12em;
}
```

(既存定義があれば追加スキップ。Phase 10 で実態確認)

## 5.6 入力・出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | 各 page.tsx の SSR fetch 結果 (既存維持) |
| 出力 | プロトタイプ整合の page-head DOM |
| 副作用 | なし (UI 層のみ変更) |
| エラーハンドリング | `result.ok=false` branch では AdminPageHeader は render したまま、本体を `AdminSectionError` に置換 |

## 5.7 ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- admin-page-header-adoption
mise exec -- pnpm --filter web dev   # /admin/* を目視
```

## 5.8 変更粒度・コミット方針

Task C の 11 file は 1 つの論理単位として扱う。commit / push / PR は Phase 13 user approval 後にのみ実行。
