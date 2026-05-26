# Phase 2: Architecture — 採用案と設計判断

## 1. Overview

本 Phase では breadcrumb 責務所有権の決定（案 A vs 案 B）と、その判断根拠を明文化する。

## 2. 採用案: 案 B（役割分担）

**topbar slot = ルートトップ静的ラベル「管理」を Breadcrumb primitive 経由で所有 / AdminPageHeader = ページ内現在地のみ。**

```
┌─────────────────────────────────────────────────────┐
│ AdminTopbar (data-shell="topbar")                   │
│  └ breadcrumb slot (data-component=                 │
│     "admin-breadcrumb-slot")                        │
│      └ <Breadcrumb items=[{label:"管理"}]/>         │
│         ← ルートトップ static current label         │
│  └ actions slot                                     │
├─────────────────────────────────────────────────────┤
│ children                                            │
│  └ each admin page                                  │
│     └ AdminPageHeader                               │
│        └ <Breadcrumb items=[現在地のみ]/>           │
│           例: [{label:"ダッシュボード"}]            │
│              [{label:"会員管理"}]                   │
└─────────────────────────────────────────────────────┘
```

## 3. 案 A 不採用の理由（RSC 境界）

| 観点 | 案 A（topbar に動的パンくず集約） | 案 B（役割分担・採用） |
|------|---------------------------------|-----------------------|
| `usePathname()` 利用 | 必須 → client 化要 | 不要 |
| `(admin)/layout.tsx` RSC 維持 | 困難（`"use client"` 化波及） | 維持可 |
| 子 page → 親 layout への upward props | Next.js App Router で不可 | 不要 |
| 静的セグメント名 → 人間可読ラベル変換テーブル | 別途必要 | 不要 |
| 実装コスト | 中〜大（変換テーブル / client 境界設計） | 小（4 ファイル編集のみ） |
| 既存 spec 契約破壊リスク | 中（client 化に伴う構造変化） | 低（data-* 維持） |

**結論**: 案 B が RSC 維持・既存契約温存・最小差分のすべてで優位。

## 4. モジュール構成俯瞰

| レイヤ | ファイル | 責務 | 本タスクでの変更 |
|--------|----------|------|------------------|
| layout (RSC) | `apps/web/app/(admin)/layout.tsx` | AppShell wrapper / `getSession()` / `<AdminTopbar />` 呼び出し | `breadcrumb` slot に `<Breadcrumb items=[{label:"管理"}]/>` を注入 |
| topbar primitive | `apps/web/src/components/layout/AdminTopbar.tsx` | `breadcrumb?: ReactNode` / `actions?: ReactNode` slot 公開 | **変更なし**（slot API はそのまま） |
| breadcrumb primitive | `apps/web/src/components/admin/Breadcrumb.tsx` | `items` を `<nav data-component="breadcrumb">` で描画し、最終 item を current span にする | **変更なし** |
| page header | `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` | title / actions / description / breadcrumbs を描画 | **変更なし**（責務分担方針はコメントで補足可・実装シグネチャ不変） |
| admin page (RSC) | `apps/web/app/(admin)/admin/page.tsx` | dashboard 描画 | `breadcrumbs` を `[{label:"ダッシュボード"}]` のみへ |
| admin page (RSC) | `apps/web/app/(admin)/admin/members/page.tsx` | members 一覧 | `breadcrumbs` を `[{label:"会員管理"}]` のみへ |
| layout spec | `apps/web/app/(admin)/layout.spec.tsx` | data-* 契約 + axe | breadcrumb slot 内に primitive (`data-component="breadcrumb"`) が現れる assertion を追記 |

## 5. 既存 primitive 再利用方針

- `Breadcrumb` primitive を topbar slot / AdminPageHeader の **両方** で使用する（単一 primitive 経由に統一）。
- 新規 primitive を作らない（CLAUDE.md 不変条件3）。
- `items: ReadonlyArray<{label, href?}>` の interface を破壊しない。
- `items.length === 0` のとき `null` を返す既存契約に依存する箇所はない（topbar slot は 1 件以上、page header は現在地 1 件以上で常に non-empty）。

## 6. data-* 契約 (DOM 階層)

```
<header data-shell="topbar">
  <div data-component="admin-breadcrumb-slot">
    <nav data-component="breadcrumb" aria-label="breadcrumb" class="ui-breadcrumb">
      <ol>
        <li><span aria-current="page">管理</span></li>
      </ol>
    </nav>
  </div>
  <div data-component="admin-topbar-actions"> ... </div>
</header>
```

- `data-shell="topbar"`: 維持（AdminTopbar 内部、無変更）
- `data-component="admin-breadcrumb-slot"`: 維持（AdminTopbar 内部、無変更）
- `data-component="breadcrumb"`: 新規に slot 内へ出現（Breadcrumb primitive 由来）
- 入れ子: `admin-breadcrumb-slot > breadcrumb` の親子関係を spec で assert
