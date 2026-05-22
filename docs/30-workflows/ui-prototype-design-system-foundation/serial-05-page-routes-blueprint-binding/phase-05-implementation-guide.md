---
phase: 5
title: 実装ガイド — 19 routes 全 page.tsx 実装表
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 5 — 実装ガイド

[実装区分: 実装仕様書]

本 Phase は 19 routes 全件の具体差分を**表形式**で網羅する。各 page.tsx は Server Component を既定とし、interactivity が必要な箇所のみ既存 `.client.tsx` boundary に委譲する。

## 0. 共通規則

- 冒頭コメント `// serial-05: <route> — blueprint 09X:LLL-MMM` を必ず付与（grep gate 対象）
- `await connection()` を冒頭で呼ぶ（dynamic rendering 一貫性）
- `searchParams` / `params` は Promise として `await` する
- import path は **相対 path**（既存 task-11 系の慣習に整合 — `../../../src/...`）
- adapter 経由（必要時）で blueprint shape に整形してから JSX に渡す
- 新規 primitive / feature component の作成は **禁止**（最小例外: MemberDetail は SW-06 担当）

## 1. 19 routes 実装表

### 1.1 公開層

| # | route | file（絶対 path） | 新/編 | export | blueprint 行範囲 | 使用 component import | API endpoint |
|---|-------|------------------|--------|--------|------------------|-----------------------|--------------|
| 1 | `/` | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/app/page.tsx` | 編 | `export default async function HomePage()` | `09e:67-160` | `Hero`, `Stats`, `ZoneIntro`, `Timeline`, `MemberGrid`, `PublicHeader`, `PublicFooter`（`../src/components/public/*`） | `getStats`, `listMembersRaw` (`../src/lib/api/public`) |
| 2 | `/(public)/members` | `apps/web/app/(public)/members/page.tsx` | 編 | `export default async function MembersPage({ searchParams })` | `09e:208-338` | `MemberFilters.client`, `MemberGrid`, `MemberTable`, `EmptyState`, `Pagination`（ui） | `listMembers` (`../../../src/lib/api/public`) |
| 3 | `/(public)/members/[id]` | `apps/web/app/(public)/members/[id]/page.tsx` | 編 | `export default async function MemberDetailPage({ params })` | `09e:339-472` | `MemberDetailSections`, `MemberLinks`, `MemberTags`, `ProfileHero`, `Card`, `KVList`, `Badge` | `getMember` + adapter `toBlueprintMember` |
| 4 | `/(public)/register` | `apps/web/app/(public)/register/page.tsx` | 編 | `export default async function RegisterPage()` | `09e:473-560` | `Hero`, `FormPreviewSections`, `RegisterCallout`, `Card`, `Button`, `Banner` | `getFormPreview` (public) |
| 5 | `/privacy` | `apps/web/app/privacy/page.tsx` | 編 | `export default function PrivacyPage()` | `09e:561-620` | `LegalProse` (`../src/components/legal/LegalProse`), `Card` | なし |
| 6 | `/terms` | `apps/web/app/terms/page.tsx` | 編 | `export default function TermsPage()` | `09e:621-680` | `LegalProse`, `Card` | なし |

### 1.2 会員層

| # | route | file | 新/編 | export | blueprint | component | API |
|---|-------|------|--------|--------|-----------|-----------|-----|
| 7 | `/login` | `apps/web/app/login/page.tsx` | 編 | `export default async function LoginPage({ searchParams })` | `09f:30-110` | `Card`, `FormField`, `Input`, `Button`, `Banner`, `Icon`（ui） + `_components/MagicLinkForm`, `_components/OAuthButton`（既存 local） | `magic-link-client`, `oauth-client` (`../src/lib/auth/*`) |
| 8 | `/profile` | `apps/web/app/profile/page.tsx` | 編 | `export default async function ProfilePage()` | `09f:111-280` | `ProfileHero`, `FormPreviewSections`, `MemberLinks`, `MemberTags`, `Card`, `Banner`, `SignOutButton`（auth） + 既存 `_components/*` | `getMe`, `listMeRequests` + adapter `toProfileView` |

### 1.3 管理層

| # | route | file | 新/編 | export | blueprint | component | API |
|---|-------|------|--------|--------|-----------|-----------|-----|
| 9 | `/(admin)/admin` | `apps/web/app/(admin)/admin/page.tsx` | 編 | `export default async function AdminDashboardPage()` | `09g:4-161` | `Stat`, `Card`, `Badge`, `Banner` (ui) + `AdminSidebar`（layout 側）+ `MembersTable preview`（既存 admin features） + `Breadcrumb` | `getAdminDashboard` + adapter `toKpiGrid` |
| 10 | `/(admin)/admin/members` | `apps/web/app/(admin)/admin/members/page.tsx` | 編 | `export default async function AdminMembersPage({ searchParams })` | `09g:162-280` | `MembersTable`（features/admin）, `Drawer`, `MemberFilters.client`, `Pagination`, `Breadcrumb` | `listAdminMembers` (`../../../../src/lib/admin/api`) |
| 11 | `/(admin)/admin/tags` | `apps/web/app/(admin)/admin/tags/page.tsx` | 編 | `export default async function AdminTagsPage({ searchParams })` | `09g:281-400` | `TagQueuePanel`, `Pagination`, `Badge`, `Card`, `Breadcrumb` | `listTagQueue` |
| 12 | `/(admin)/admin/meetings` | `apps/web/app/(admin)/admin/meetings/page.tsx` | 編 | `export default async function AdminMeetingsPage()` | `09g:401-520` | `MeetingPanel`, `Card`, `Stat`, `Breadcrumb` | `listMeetings` |
| 13 | `/(admin)/admin/schema` | `apps/web/app/(admin)/admin/schema/page.tsx` | 編 | `export default async function AdminSchemaPage()` | `09g:521-640` | `SchemaDiffPanel`, `Card`, `Button`, `Banner`, `Breadcrumb` | `getSchemaDiff` |
| 14 | `/(admin)/admin/requests` | `apps/web/app/(admin)/admin/requests/page.tsx` | 編 | `export default async function AdminRequestsPage({ searchParams })` | `09g:641-740` | `RequestQueuePanel`, `Pagination`, `Badge`, `Breadcrumb` | `listAdminRequests` |
| 15 | `/(admin)/admin/identity-conflicts` | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 編 | `export default async function AdminIdentityConflictsPage({ searchParams })` | `09g:741-840` | `IdentityConflictRow`, `Card`, `Modal`, `Pagination`, `Breadcrumb` | `listIdentityConflicts` |
| 16 | `/(admin)/admin/audit` | `apps/web/app/(admin)/admin/audit/page.tsx` | 編 | `export default async function AdminAuditPage({ searchParams })` | `09g:841-940` | `AuditLogPanel`, `Pagination`, `Badge`, `Breadcrumb` | `listAuditEntries` |

### 1.4 Fallback

| # | file | 新/編 | export | blueprint | component |
|---|------|--------|--------|-----------|-----------|
| 17 | `apps/web/app/error.tsx` | 編 | `"use client"; export default function GlobalError({ error, reset })` | `09h:fallback` | `Card`, `Button`, `Banner`（ui） |
| 18 | `apps/web/app/not-found.tsx` | 編 | `export default function NotFound()` | `09h:fallback` | `EmptyState`, `Card`, `Button` |
| 19 | `apps/web/app/loading.tsx`（SW-04 produced） | 参 | `export default function Loading()` | `09h:fallback` | spinner skeleton |

## 2. 主要 JSX skeleton（抜粋 5-15 行）

### 2.1 `/` (Home)

```tsx
// serial-05: / — blueprint 09e:67-160
export default async function HomePage() {
  await connection();
  const [stats, recent] = await Promise.all([
    getStats({ revalidate: PUBLIC_API_REVALIDATE.stats }),
    listMembersRaw("limit=6&sort=recent", { revalidate: PUBLIC_API_REVALIDATE.members }),
  ]);
  return (
    <main data-route="public" data-section-rhythm="comfortable">
      <Hero />
      <section data-section data-card-tone="surface"><Stats stats={stats} /></section>
      <section data-section><ZoneIntro /></section>
      <section data-section><MemberGrid members={recent} variant="featured" /></section>
      <section data-section><Timeline /></section>
    </main>
  );
}
```

### 2.2 `/(public)/members`

```tsx
// serial-05: /(public)/members — blueprint 09e:208-338
export default async function MembersPage({ searchParams }) {
  await connection();
  const sp = await searchParams;
  const parsed: MembersSearch = parseSearchParams(sp);
  const result = await listMembers(parsed, { revalidate: PUBLIC_API_REVALIDATE.members });
  return (
    <main data-route="public" data-section-rhythm="comfortable">
      <MemberFilters.client initial={parsed} />
      {result.items.length === 0 ? (
        <EmptyState title="該当なし" />
      ) : parsed.density === "compact" ? (
        <MemberTable members={result.items} />
      ) : (
        <MemberGrid members={result.items} />
      )}
      <Pagination page={parsed.page ?? 1} total={result.total} />
    </main>
  );
}
```

### 2.3 `/(public)/members/[id]`

```tsx
// serial-05: /(public)/members/[id] — blueprint 09e:339-472
export default async function MemberDetailPage({ params }) {
  await connection();
  const { id } = await params;
  const raw = await getMember(id);
  if (!raw) notFound();
  const view = toBlueprintMember(raw);
  return (
    <main data-route="public" data-section-rhythm="comfortable">
      <ProfileHero hero={view.hero} />
      <MemberDetailSections sections={view.sections} />
      <MemberLinks links={view.links} />
    </main>
  );
}
```

### 2.4 `/(public)/register`

```tsx
// serial-05: /(public)/register — blueprint 09e:473-560
export default async function RegisterPage() {
  const preview = await getFormPreview();
  return (
    <main data-route="public" data-section-rhythm="comfortable">
      <Hero variant="register" />
      <Card data-card-tone="emphasis"><RegisterCallout responderUrl={preview.responderUrl} /></Card>
      <FormPreviewSections sections={preview.sections} />
    </main>
  );
}
```

### 2.5 `/privacy` / `/terms`

```tsx
// serial-05: /privacy — blueprint 09e:561-620
export default function PrivacyPage() {
  return (
    <main data-route="public" data-section-rhythm="comfortable">
      <Card data-card-tone="panel"><LegalProse document="privacy" /></Card>
    </main>
  );
}
```

### 2.6 `/login`

```tsx
// serial-05: /login — blueprint 09f:30-110
export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/profile";
  return (
    <main data-route="member" data-section-rhythm="compact">
      <Card data-card-tone="emphasis">
        {sp.error && <Banner tone="error">ログインに失敗しました</Banner>}
        <OAuthButton callbackUrl={callbackUrl} />
        <MagicLinkForm callbackUrl={callbackUrl} />
      </Card>
    </main>
  );
}
```

### 2.7 `/profile`

```tsx
// serial-05: /profile — blueprint 09f:111-280
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/profile");
  const [me, requests] = await Promise.all([getMe(), listMeRequests()]);
  const view = toProfileView(me, requests.items);
  return (
    <main data-route="member" data-section-rhythm="comfortable">
      <ProfileHero hero={view.hero} />
      <FormPreviewSections sections={view.sections} />
      <SignOutButton />
    </main>
  );
}
```

### 2.8 `/(admin)/admin`

```tsx
// serial-05: /(admin)/admin — blueprint 09g:4-161
export default async function AdminDashboardPage() {
  const raw = await getAdminDashboard();
  const view = toKpiGrid(raw);
  return (
    <main data-route="admin" data-section-rhythm="compact">
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      <section data-section>
        {view.kpis.map(k => <Stat key={k.id} label={k.label} value={k.value} delta={k.delta} />)}
      </section>
      <Card data-card-tone="surface"><MembersTablePreview members={view.recentMembers} /></Card>
    </main>
  );
}
```

### 2.9 `/(admin)/admin/members`

```tsx
// serial-05: /(admin)/admin/members — blueprint 09g:162-280
export default async function AdminMembersPage({ searchParams }) {
  const sp = await searchParams;
  const result = await listAdminMembers(sp);
  return (
    <main data-route="admin" data-section-rhythm="compact">
      <Breadcrumb items={[{ href: "/admin", label: "Dashboard" }, { label: "Members" }]} />
      <MemberFilters.client initial={sp} mode="admin" />
      <MembersTable members={result.items} />
      <Pagination page={Number(sp.page ?? 1)} total={result.total} />
    </main>
  );
}
```

### 2.10〜2.15 admin governance（共通 skeleton）

`/(admin)/admin/{tags,meetings,schema,requests,identity-conflicts,audit}` は同形:

```tsx
// serial-05: /(admin)/admin/<sub> — blueprint 09g:<range>
export default async function AdminSubPage({ searchParams }) {
  const sp = await searchParams;
  const result = await listXxx(sp);  // tags=listTagQueue / meetings=listMeetings / schema=getSchemaDiff / requests=listAdminRequests / identity-conflicts=listIdentityConflicts / audit=listAuditEntries
  return (
    <main data-route="admin" data-section-rhythm="compact">
      <Breadcrumb items={[{ href: "/admin", label: "Dashboard" }, { label: "<Sub>" }]} />
      <XxxPanel items={result.items} />  {/* TagQueuePanel / MeetingPanel / SchemaDiffPanel / RequestQueuePanel / IdentityConflictRow list / AuditLogPanel */}
      <Pagination page={Number(sp.page ?? 1)} total={result.total} />
    </main>
  );
}
```

identity-conflicts のみ `<ul data-section>{items.map(c => <IdentityConflictRow ... />)}</ul>` 形にする。schema は `Pagination` 不要。meetings は searchParams 不要。

### 2.16 Fallback

```tsx
// apps/web/app/error.tsx — serial-05: error — blueprint 09h:fallback
"use client";
export default function GlobalError({ error, reset }) {
  return (
    <main data-route="public" data-section-rhythm="compact">
      <Card data-card-tone="emphasis">
        <Banner tone="error">予期しないエラーが発生しました</Banner>
        <Button onClick={reset}>再試行</Button>
      </Card>
    </main>
  );
}
```

```tsx
// apps/web/app/not-found.tsx — serial-05: not-found — blueprint 09h:fallback
export default function NotFound() {
  return (
    <main data-route="public" data-section-rhythm="comfortable">
      <EmptyState title="ページが見つかりません" actionHref="/" actionLabel="トップへ戻る" />
    </main>
  );
}
```

## 3. adapter 実装テンプレート

```ts
// apps/web/src/lib/adapters/public-members.ts
import type { PublicMember, PublicMemberDetail } from "../api/public";

export function toBlueprintMembers(raw: readonly PublicMember[]): BlueprintMemberCard[] {
  return raw.map(m => ({
    id: m.id,
    displayName: m.displayName,
    zone: m.zone ?? undefined,
    tags: m.tags ?? [],
    visibility: "public",
    joinedAtLabel: m.joinedAt ? formatJoinedAt(m.joinedAt) : undefined,
  }));
}

export function toBlueprintMember(raw: PublicMemberDetail): BlueprintMemberDetail {
  return {
    hero: { displayName: raw.displayName, status: raw.status ?? "active", zone: raw.zone, tagPills: raw.tags ?? [] },
    sections: groupFieldsBySection(raw.fields),
    links: extractLinks(raw.fields),
  };
}
```

## 4. import path 規約

- `apps/web/app/page.tsx` → `../src/...`
- `apps/web/app/(public)/members/page.tsx` → `../../../src/...`
- `apps/web/app/(public)/members/[id]/page.tsx` → `../../../../src/...`
- `apps/web/app/(admin)/admin/page.tsx` → `../../../src/...`
- `apps/web/app/(admin)/admin/<sub>/page.tsx` → `../../../../src/...`

> tsconfig path alias は既存設定を踏襲。新規 alias 導入は本 SW では行わない。

## 5. 既存実装からの差分最小化方針

各 page.tsx は既に骨格があるため、本 SW では **追加・置換は blueprint 整合に必要な最小範囲のみ**。具体的な追加項目:

1. 冒頭の `// serial-05: ...` コメント
2. `<main>` の `data-route` / `data-section-rhythm` 属性
3. 不足している blueprint section の挿入（例: register の `RegisterCallout` Card wrap、admin の `Breadcrumb` 追加）
4. adapter 経由のデータ整形（必要な page のみ）
5. `Card data-card-tone="..."` の付与

既存の `revalidate` / `connection()` / Suspense 構造は維持する。

## 6. 行範囲予算

本 Phase は 19 routes 表 + skeleton で 400 行上限を許容（task-spec creator skill 規約）。
