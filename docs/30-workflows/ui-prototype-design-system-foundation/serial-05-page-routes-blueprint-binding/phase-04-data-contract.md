---
phase: 4
title: 入出力・データ契約 — route params / search params / cookie / API signature
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 4 — 入出力・データ契約

[実装区分: 実装仕様書]

## 1. Next.js 16 仕様の前提

- `searchParams` / `params` は **Promise**。各 page.tsx 冒頭で `await` する
- Server Component 内で `cookies()` / `headers()` を呼ぶ場合は `await`
- `connection()` を呼んだ後は dynamic rendering（既存 task-11 pattern を踏襲）

## 2. route 別契約

### 2.1 公開層

| Route | params | searchParams | cookie 依存 | 呼び出す API | revalidate |
|-------|--------|--------------|-------------|-------------|-----------|
| `/` | なし | なし | なし | `getStats()`, `listMembersRaw("limit=6&sort=recent")` | 60 |
| `/(public)/members` | なし | `q,tag,zone,status,sort,density,page` | なし | `listMembers(parsed)` | 30 |
| `/(public)/members/[id]` | `{ id: string }` | なし | なし | `getMember(id)` → adapter `toBlueprintMember()` | 0 |
| `/(public)/register` | なし | なし | なし | `getFormPreview()` | 3600 |
| `/privacy` | なし | なし | なし | なし（static MDX 相当） | 3600 |
| `/terms` | なし | なし | なし | なし | 3600 |

#### searchParams schema (`/members`)

既存 `apps/web/src/lib/url/members-search.ts` の `parseSearchParams` をそのまま使用。

```ts
type MembersSearch = {
  q?: string;            // 検索語
  tag?: string[];        // タグ複数
  zone?: string;
  status?: "active" | "alumni";
  sort?: "recent" | "name";
  density?: "compact" | "comfortable";
  page?: number;
};
```

### 2.2 会員層

| Route | params | searchParams | cookie | API | revalidate |
|-------|--------|--------------|--------|-----|-----------|
| `/login` | なし | `callbackUrl?,error?` | session（未認証想定） | `POST /auth/magic-link`, `POST /auth/oauth` | 0 |
| `/profile` | なし | なし | session 必須 | `getMe()`, `listMeRequests()`, adapter `toProfileView()` | 0 |

#### auth cookie

`apps/web/src/lib/auth/*` 経由のみ。`/profile` は未認証時 `redirect("/login?callbackUrl=/profile")`。

### 2.3 管理層

| Route | params | searchParams | cookie | API | revalidate |
|-------|--------|--------------|--------|-----|-----------|
| `/(admin)/admin` | なし | なし | admin session 必須 | `getAdminDashboard()` → adapter `toKpiGrid()` | 0 |
| `/(admin)/admin/members` | なし | `q,tag,status,page` | admin session | `listAdminMembers()` | 0 |
| `/(admin)/admin/tags` | なし | `status?,page?` | admin session | `listTagQueue()` | 0 |
| `/(admin)/admin/meetings` | なし | `page?` | admin session | `listMeetings()` | 0 |
| `/(admin)/admin/schema` | なし | なし | admin session | `getSchemaDiff()` | 0 |
| `/(admin)/admin/requests` | なし | `status?,type?,page?` | admin session | `listAdminRequests()` | 0 |
| `/(admin)/admin/identity-conflicts` | なし | `page?` | admin session | `listIdentityConflicts()` | 0 |
| `/(admin)/admin/audit` | なし | `actor?,action?,from?,to?,page?` | admin session | `listAuditEntries()` | 0 |

admin の cookie / session ガードは `apps/web/src/lib/admin/server-fetch.ts` 内 + AdminSidebar layout（SW-03）で実装。本 SW では page.tsx は「未認証時 redirect / 認可失敗時 throw」のみ責務を持つ。

### 2.4 Fallback

| File | props | API |
|------|-------|-----|
| `app/error.tsx` | `{ error: Error & { digest?: string }, reset: () => void }` | なし |
| `app/not-found.tsx` | なし | なし |
| `app/loading.tsx` | なし | なし |

## 3. adapter 層のシグネチャ

```ts
// apps/web/src/lib/adapters/public-members.ts
import type { PublicMember, PublicMemberDetail } from "../api/public";

export type BlueprintMemberCard = {
  id: string;
  displayName: string;
  zone?: string;
  tags: string[];
  visibility: "public";
  joinedAtLabel?: string;
};

export type BlueprintMemberDetail = {
  hero: { displayName: string; status: string; zone?: string; tagPills: string[] };
  sections: Array<{
    sectionId: string;
    title: string;
    fields: Array<{ label: string; value: string; visibility: "public" | "member" }>;
  }>;
  links: Array<{ kind: "twitter" | "github" | "site"; url: string }>;
};

export function toBlueprintMembers(raw: PublicMember[]): BlueprintMemberCard[];
export function toBlueprintMember(raw: PublicMemberDetail): BlueprintMemberDetail;
```

```ts
// apps/web/src/lib/adapters/admin-dashboard.ts
import type { AdminDashboardDto } from "../admin/types";

export type BlueprintKpiGrid = {
  kpis: Array<{ id: string; label: string; value: string; delta?: string }>;
  recentMembers: BlueprintMemberCard[];
  alerts: Array<{ id: string; severity: "info" | "warn" | "error"; message: string }>;
};

export function toKpiGrid(raw: AdminDashboardDto): BlueprintKpiGrid;
```

```ts
// apps/web/src/lib/adapters/member-profile.ts
import type { MeResponse } from "../api/me-types";
import type { MeRequest } from "../api/me-requests.types";

export type BlueprintProfileView = {
  hero: { displayName: string; visibility: "public" | "member"; consent: { publicConsent: boolean; rulesConsent: boolean } };
  sections: BlueprintMemberDetail["sections"];
  pendingRequests: MeRequest[];
};

export function toProfileView(me: MeResponse, requests: MeRequest[]): BlueprintProfileView;
```

## 4. エラー契約

| シナリオ | 挙動 |
|---------|------|
| API 404 | `notFound()`（Next.js） |
| API 401（profile/admin） | `redirect("/login?...")` |
| API 5xx | throw → 最寄りの `error.tsx` で補足 |
| zod parse 失敗（searchParams） | parser 内で safe default に fallback（既存 `parseSearchParams` pattern） |
| adapter 内 型ミスマッチ | throw（dev で fail-fast、本番は `error.tsx` 補足） |

## 5. URL 同期 (members filters)

既存 `MemberFilters.client.tsx` が `useRouter().replace(...)` で URL を更新する pattern を維持。本 SW では新規 URL state を増やさない。

## 6. 機密値の経路

`/profile` の cookie / session は `getEnv()` 経由 `INTERNAL_API_BASE_URL` で API 側に転送。session 復元は `apps/web/src/lib/session.ts` 経由。本 SW は経路を変えない。

## 7. 不変条件チェック（Phase 4 視点）

| 不変 | チェック |
|------|---------|
| D1 直接アクセス禁止 | page.tsx 内で `env.DB` / `D1Database` 参照 0 件 |
| 既存 API のみ | adapter は既存 client 型のみ import |
| `getEnv()` 経由 | page.tsx 内で `process.env` 参照 0 件 |
| Form schema 固定回避 | adapter は section/field を array で扱う（map literal を持たない） |
