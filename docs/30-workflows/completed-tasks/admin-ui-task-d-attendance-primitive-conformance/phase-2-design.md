---
実装区分: 実装仕様書
Phase: 2
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
前: [phase-1-requirements.md](./phase-1-requirements.md)
次: [phase-3-design-review.md](./phase-3-design-review.md)
---

# Phase 2: 設計

## 2.1 画面構成図（再構成後）

```
<section aria-label="出席分析" data-testid="admin-attendance-dashboard">
  <AdminPageHeader
    title="出席分析"
    description="セッション別と会員別の出席状況を確認します"
    breadcrumbs={[{ label: "ダッシュボード", href: "/admin" }, { label: "出席分析" }]}
    actions={<AttendanceHeaderActions />}
  />

  <AttendanceDashboardSections
    overviewResult={overviewR}
    bySessionResult={bySessionR}
    rankingResult={rankingR}
  />
</section>
```

## 2.2 KPI mapping

| 既存 inline | 置換後 |
|---|---|
| `<KpiCard label="総セッション数" value={String(...totalSessions)} />` | `<KpiCard label="総セッション数" value={overviewR.data.totalSessions} testId="attendance-kpi-total-sessions" />` |
| `<KpiCard label="対象会員数" value={String(...totalMembers)} />` | `<KpiCard label="対象会員数" value={overviewR.data.totalMembers} testId="attendance-kpi-total-members" />` |
| `<KpiCard label="全体出席率" value={fmtPct(overallRate)} />` | `<KpiCard label="全体出席率" value={Math.round(overallRate*1000)/10} hint="%" tone={toneForRate(overallRate)} testId="attendance-kpi-overall-rate" />` |

現行 `KpiCard.value: number` を維持し、率は `Math.round(rate*1000)/10` + `hint="%"` で表現。`unit` / `formatter` prop は追加しない。

## 2.3 AdminTable column 定義

### by-session

```ts
columns: [
  { key: "heldOn",        header: "開催日",   accessor: r => r.heldOn,        sortable: true, align: "left"  },
  { key: "title",         header: "タイトル", accessor: r => r.title,         sortable: true, align: "left"  },
  { key: "attendeeCount", header: "出席者数", accessor: r => r.attendeeCount, sortable: true, align: "right" },
  { key: "rate",          header: "出席率",   accessor: r => r.rate, render: r => fmtPct(r.rate), sortable: true, align: "right" },
],
getRowKey: r => r.sessionId,
defaultSort: { key: "heldOn", order: "desc" },
caption: "セッション別出席状況",
emptyState: <AdminEmptyState title="セッション別出席データがありません" />,
```

### ranking

```ts
columns: [
  { key: "displayName",   header: "会員",   accessor: r => r.displayName || r.memberId, sortable: true, align: "left"  },
  { key: "attendedCount", header: "出席数", accessor: r => r.attendedCount, sortable: true, align: "right" },
  { key: "rate",          header: "出席率", accessor: r => r.rate, render: r => fmtPct(r.rate), sortable: true, align: "right" },
],
getRowKey: r => r.memberId,
defaultSort: { key: "rate", order: "desc" },
caption: "会員別出席ランキング",
emptyState: <AdminEmptyState title="会員別出席データがありません" />,
```

## 2.4 可視化 primitive 判定（AttendanceRateBar を新規に作らない）

判定: **作らない**。理由:

1. 新 endpoint 追加禁止（AC-D6 / 不変条件 #5）
2. 既存 overview / by-session のデータのみで「区画別の bar」は作れない
3. 「session 別出席率」は AdminTable で十分表現可

**決定**: 画面構成は `KpiCard × 3 → by-session AdminTable → ranking AdminTable` の縦 3 段。`rate` カラムは `AdminTableColumn.render` で `fmtPct(rate)` のテキスト表示に閉じる。inline progress bar は本タスクでは作らない。

## 2.5 AdminPageHeader actions slot

```tsx
<AdminPageHeader
  title="出席分析"
  description="セッション別と会員別の出席状況を確認します"
  breadcrumbs={[{ label: "ダッシュボード", href: "/admin" }, { label: "出席分析" }]}
  actions={
    <a className="ui-btn ui-btn--ghost" href="/admin/dashboard/attendance" data-testid="attendance-refresh">
      再取得
    </a>
  }
/>
```

`a href=self` は SSR force-dynamic と合わせ最小コストの refresh CTA。期間 filter は非表示（disabled で残さない）。

## 2.6 Server / Client 境界

`page.tsx` は `safeServerFetch` のみを所有し、`AdminPageHeader` と `AttendanceDashboardSections` を描画する。`AttendanceDashboardSections.client.tsx` は `"use client"` を持ち、`AdminTableColumn` の `accessor` / `render` 関数、`KpiCard`、`AdminSectionErrorClient`、`AdminEmptyState` を所有する。

この分割により、Server Component から Client Component へ関数 props を渡す Next.js 禁止パターンを避ける。

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 2 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Server / Client 境界を含む実装設計を確定する。

## 実行タスク

- `page.tsx` と `AttendanceDashboardSections.client.tsx` の責務を分離する。
- AdminPageHeader / KpiCard / AdminTable の現行 API に合わせる。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| AdminPageHeader | `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` | header props |
| AdminTable | `apps/web/src/features/admin/components/_shared/AdminTable.tsx` | client table |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| Phase 2 spec | `phase-2-design.md` | 設計 |

## 完了条件

- [ ] function props が client island 内に閉じている。
- [ ] 実在しない props / path を参照していない。
