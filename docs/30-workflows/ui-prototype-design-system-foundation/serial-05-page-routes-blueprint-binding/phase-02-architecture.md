---
phase: 2
title: アーキテクチャ — Server Component 既定 / data fetching / adapter 層
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 2 — アーキテクチャ設計

[実装区分: 実装仕様書]

## 1. レンダリングモデル（Server Component 既定）

```
HTTP request
   ↓ Next.js App Router
app/layout.tsx (Root) ── ToastProvider ── data-theme="warm"
   ↓
app/(group)/layout.tsx ── AppShell chrome（Topbar/Sidebar/Footer）
   ↓
app/.../page.tsx (Server Component)
   ↓ await getX({ revalidate }) → 既存 lib/api/* または lib/admin/*
   ↓ JSX = primitives + feature components の組み立て
   ↓ Suspense boundary（任意, list / detail で挿入）
   ↓ Client Component is leaf only（filters, drawer, toggle）
HTML
```

### 1.1 Server / Client 境界の判定ルール

| 性質 | 判定 | 実例 |
|------|------|------|
| データ取得・SEO 必要 | Server Component（既定） | `page.tsx` 本体、`Hero`, `MemberGrid`, `MembersTable` |
| URL 同期 state | Client Component | `MemberFilters.client.tsx`, `DensityToggle.client.tsx` |
| Drawer / Modal / Toast 起動 | Client Component | `RequestActionPanel`（必要時のみ） |
| Form submission | Client Component or Server Action | `RegisterCallout`, `MagicLinkForm`, `OAuthButton` |

### 1.2 Suspense boundary 設計

```tsx
// page.tsx 共通パターン
export default async function Page({ searchParams }) {
  const params = await searchParams; // Next.js 16 仕様
  return (
    <main data-route="public">
      <PageHeader />
      <Suspense fallback={<LoadingSkeleton variant="grid" />}>
        <MemberListSection params={parsed} />
      </Suspense>
    </main>
  );
}
```

list / detail / dashboard では `<Suspense>` で重い fetch を切り分けて `loading.tsx`（SW-04） と二段構えにする。短い fetch のみの page は Suspense を入れない。

## 2. データ取得パターン

### 2.1 統一シグネチャ

```ts
// 既存の lib/api/public.ts (例)
export const PUBLIC_API_REVALIDATE = { stats: 60, members: 30, profile: 0 } as const;

// page.tsx 内
const data = await getStats({ revalidate: PUBLIC_API_REVALIDATE.stats });
```

### 2.2 経路別 API client（既存）

| 層 | client モジュール | endpoint prefix |
|----|------------------|-----------------|
| 公開 | `apps/web/src/lib/api/public.ts` | `GET /public/*` |
| 会員（me） | `apps/web/src/lib/api/me-requests.ts` / `me-types.ts` | `GET /me/*` |
| 認証 | `apps/web/src/lib/auth/*` | `POST /auth/*` |
| 管理 | `apps/web/src/lib/admin/api.ts` / `server-fetch.ts` | `GET/POST /admin/*` |
| 基盤 fetch | `apps/web/src/lib/fetch/authed.ts` / `public.ts` | `INTERNAL_API_BASE_URL` 経由 |

すべて `getEnv()` の `INTERNAL_API_BASE_URL` を起点に `await fetch(...)`。`process.env.*` 直接参照は禁止（task-02 不変条件）。

### 2.3 既存 API と UI 期待 shape の乖離 — Adapter 層

既存 API endpoint surface を変更しない不変条件があるため、UI 側の blueprint 期待 shape と既存 API レスポンスが乖離する場合は `apps/web/src/lib/adapters/` に view-only adapter を置く。

```
apps/web/src/lib/adapters/
├── public-members.ts        # public.ts の listMembers/getMember を blueprint shape に変換
├── admin-dashboard.ts       # admin/api.ts の dashboard 系を KpiGrid + RecentActivity に
├── member-profile.ts        # me-requests + getMember を ProfileDetail 期待 shape に
└── form-response.ts         # serial-06 で詳細実装。ここでは型のみ宣言
```

adapter 層の規約:

1. **入力**: 既存 API client が返す型のみ
2. **出力**: blueprint 期待 shape（`docs/00-getting-started-manual/specs/09*` 準拠）
3. **副作用なし**（pure function）
4. 単体テスト（`*.spec.ts`）を `__tests__/` 配下に置く

> adapter 層は新規追加であり「新規 primitive 禁止」の不変条件に違反しない（primitive ではなく view model 変換）。

## 3. ファイル組成（page.tsx 共通テンプレート）

```tsx
// serial-05: <route> — blueprint 09X:LLL-MMM
// dependency: parallel-01..04 完了前提（globals.css rhythm + AppShell）
// 不変条件 #5: D1 直接アクセス禁止（apps/api 経由のみ）

import { connection } from "next/server";

// primitives（既存）
import { Card } from "../../../src/components/ui/Card";
// feature components（既存）
import { MemberGrid } from "../../../src/components/public/MemberGrid";
// adapters（必要時）
import { toBlueprintMembers } from "../../../src/lib/adapters/public-members";
// API client（既存）
import { listMembers, PUBLIC_API_REVALIDATE } from "../../../src/lib/api/public";

export const revalidate = 30;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function XxxPage({ searchParams }: Props) {
  await connection();
  const sp = await searchParams;
  const raw = await listMembers(/* ... */);
  const data = toBlueprintMembers(raw);
  return (
    <main data-route="public" data-section-rhythm="comfortable">
      {/* primitive 組み立て */}
    </main>
  );
}
```

## 4. data-* attribute 契約（parallel-01/02 と整合）

| attribute | 値 | 配置 |
|-----------|----|------|
| `data-route` | `"public" \| "member" \| "admin"` | `<main>` 直下 |
| `data-section-rhythm` | `"compact" \| "comfortable"` | section wrapper |
| `data-card-tone` | `"panel" \| "surface" \| "emphasis"` | カード wrapper |
| `data-visibility` | `"public" \| "member" \| "admin"` | profile/member detail 内 |
| `data-component` | `"member-card" \| "tag-pill"` | hover / fill 規則の target |

## 5. revalidate 設計

| route | revalidate (sec) | 根拠 |
|-------|------------------|------|
| `/` | 60 | stats 主体 |
| `/(public)/members` | 30 | listing 頻度 |
| `/(public)/members/[id]` | 0（動的） | 個別 detail / response_fields |
| `/(public)/register` | 3600 | ほぼ静的 |
| `/privacy` / `/terms` | 3600 | 法務文書 |
| `/login` | 0 | 認証 state 依存 |
| `/profile` | 0 | 会員 self |
| `/(admin)/*` | 0 | 管理は常に最新 |

## 6. 採用しない選択肢

| 選択肢 | 不採用理由 |
|--------|-----------|
| 全 page を Client Component 化 | SEO / 初期表示が悪化、`getEnv()` server 経路と整合しない |
| API 側に new endpoint を生やして adapter を不要化 | 「既存 API endpoint surface のみ接続」不変条件違反 |
| primitive を新規追加して blueprint を満たす | 新規 primitive 禁止。adapter + 既存 primitive 合成で解決可能 |
| `(member)` group に login/profile を移動 | 既存実装の path が安定しており、外部からのリンク・テストが大量。移動コスト > 利益 |

## 7. 失敗モードと回避

| 失敗 | 回避策 |
|------|--------|
| OpenNext Workers build が `[project]/...` 仮想 module で fail | `next build --webpack` を正本化（CLAUDE.md 既定）。Turbopack は local dev のみ |
| Next.js 16 の `searchParams` Promise 化未対応 | 全 page で `const sp = await searchParams` を統一 |
| `connection()` 未呼び出しで dynamic rendering 不安定 | Server Component の冒頭で `await connection()`（task-11 既存 pattern を踏襲） |
| adapter が view 専用化されず lib/api を逆汚染 | adapter は pure function のみ、API client の型を import するが export しない |
