---
spec_classification: implementation_spec
state: spec_created
phase: 2
phase_name: 設計
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 2: 設計

## 2.1 各 page の page-head 設計表 (プロトタイプ準拠)

| # | path | eyebrow | h-page (title) | description / subtitle | breadcrumbs | actions |
|---|------|---------|----------------|------------------------|-------------|---------|
| 1 | /admin/tags | `ADMIN / TAGS` | タグ割当 | サジェスト由来の queue を承認・拒否・差し戻し | `[管理→/admin, タグキュー]` | — (status 切替は既存 panel 内) |
| 2 | /admin/meetings | `ADMIN / MEETINGS` | 開催日 / 出席管理 | 開催日ごとの出席登録と候補会員の確認 | `[管理→/admin, 開催日 / 出席管理]` | — (開催追加 CTA は既存 panel 内) |
| 3 | /admin/meetings/[id] | `ADMIN / MEETINGS` | `${detail.title}` | `${heldOn}` | `[管理→/admin, 開催日→/admin/meetings, ${title}]` | — |
| 4 | /admin/schema | `ADMIN / SCHEMA` | スキーマ差分のレビュー | Google Form の最新 schema との差分を解消する | `[管理→/admin, Form schema]` | `Link href=/admin/schema/history` "resolve 履歴を見る" |
| 5 | /admin/schema/history | `ADMIN / SCHEMA` | alias resolve 履歴 | 過去の解消結果を audit 経由で閲覧 | `[管理→/admin, Form schema→/admin/schema, 履歴]` | — |
| 6 | /admin/requests | `ADMIN / REQUESTS` | 依頼キュー | 公開範囲変更・削除依頼を確認して処理 | `[管理→/admin, 依頼キュー]` | — (type filter は既存 panel 内) |
| 7 | /admin/identity-conflicts | `ADMIN / IDENTITY` | Identity 重複候補 | name + 所属が完全一致する identity 候補。merge は二段階確認 | `[管理→/admin, Identity 重複候補]` | — |
| 8 | /admin/audit | `ADMIN / AUDIT` | 監査ログ | 管理操作の履歴を条件指定で検索 | `[管理→/admin, 監査ログ]` | — |
| 9 | /admin/dashboard/attendance | `ADMIN / DASHBOARD` | 出席ダッシュボード | 出席率の overview / by-session / ranking | `[管理→/admin, ダッシュボード→/admin/dashboard, 出席]` | — |

## 2.2 AdminPageHeader 拡張仕様

現状の interface:

```ts
interface AdminPageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>;
  readonly actions?: ReactNode;
}
```

拡張 (追加のみ・後方互換):

```ts
interface AdminPageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>;
  readonly actions?: ReactNode;
  readonly eyebrow?: string;       // 追加: プロトタイプ .eyebrow 相当。例 "ADMIN / TAGS"
  readonly headingId?: string;     // 追加: section aria-labelledby 用に h1 へ id を渡す
}
```

レンダリング規約:

- `eyebrow` がある場合のみ `<p>` を Breadcrumb 直下・h1 直上に配置。class は `text-[10px] font-semibold uppercase tracking-[var(--ubm-eyebrow-tracking,0.12em)] text-[var(--ubm-color-text-muted)]`
- `headingId` があれば `<h1 id={headingId}>` として render
- `actions` slot は flex 右寄せ (既存維持)
- 既存採用 2 page (dashboard / members) は eyebrow 未指定で従来表示維持

## 2.3 identity-conflicts 整流化方針

- 独自 `<main>` を削除し、layout 所有 main の中に section を返す
- header 部分は AdminPageHeader に集約
- リスト部分は `AdminSectionCard` でラップ (既存 `_shared` から import)
- pagination link は `Link` + token 化下線リンク
- `data-route="admin"` / `data-section-rhythm="compact"` 属性は section へ移譲

## 2.4 token 移行表 (identity-conflicts)

| 旧 | 新 | 備考 |
|----|----|------|
| `<main className="mx-auto max-w-5xl px-6 py-8">` | layout 所有 main + `<section className="flex flex-col gap-4">` | layout で max-w / padding 保証 |
| `<Breadcrumb items=...>` + 独自 `<header>` | `<AdminPageHeader eyebrow="ADMIN / IDENTITY" ... />` | I-C1 |
| `text-zinc-600` | `text-[var(--ubm-color-text-secondary)]` | description は AdminPageHeader 内 |
| `divide-zinc-200` | `divide-[var(--ubm-color-border-default)]` | token 存在確認済 |
| `border-zinc-200` | `border-[var(--ubm-color-border-default)]` | 同上 |
| `text-blue-600` | `text-[var(--ubm-color-link-default)]` | 本タスクで token 追加 |
| `<EmptyState />` | `<AdminEmptyState />` | _shared 経由に統一 |

## 2.5 tokens.css 追加

```css
:root {
  --ubm-color-link-default: var(--ubm-color-accent);
  --ubm-eyebrow-tracking: 0.12em;
}
```

(`--ubm-color-link-default` / `--ubm-eyebrow-tracking` が既存にあれば追加スキップ)
