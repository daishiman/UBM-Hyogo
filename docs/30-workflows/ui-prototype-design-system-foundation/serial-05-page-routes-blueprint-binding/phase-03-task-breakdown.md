---
phase: 3
title: タスク分解 — 6 グループ × 19 routes
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. グループ分割（6 グループ）

| Group ID | グループ名 | routes | 主要 blueprint | 主要 primitive / feature |
|----------|-----------|--------|---------------|--------------------------|
| G-T (Top) | 公開トップ | `/` | `09e:67-160` | Hero, Stats, ZoneIntro, Timeline, MemberGrid |
| G-M (Members) | 公開メンバー | `/(public)/members`, `/(public)/members/[id]` | `09e:208-472` | MemberFilters, MemberGrid, MemberTable, MemberCard, MemberDetailSections, MemberLinks, MemberTags |
| G-A (Auth) | 認証 | `/login` | `09f:30-110` | Card, FormField, Input, Button, Banner, SignOutButton |
| G-R (Register & Legal) | 登録・法務 | `/(public)/register`, `/privacy`, `/terms` | `09e:473-680` | RegisterCallout, FormPreviewSections, LegalProse |
| G-D (Admin Dashboard core) | 管理ダッシュボード | `/(admin)/admin`, `/profile` | `09g:4-161`, `09f:111-280` | KpiGrid (admin-dashboard adapter), Stat, Card, ProfileHero, FormPreviewSections, AdminSidebar |
| G-G (Admin Governance) | 管理運営 | `/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}` | `09g:162-940` | RequestQueuePanel, TagQueuePanel, MeetingPanel, SchemaDiffPanel, IdentityConflictRow, AuditLogPanel, Breadcrumb |
| G-F (Fallback) | フォールバック | `error.tsx`, `not-found.tsx`, `loading.tsx` | `09h:fallback` | EmptyState, Card, Button |

> 6 グループ + Fallback で計 19 routes をカバー。Fallback は SW-04 で物理新規、本 SW では chrome 整合確認のみ。

## 2. グループ別実装順序

```
G-T  ─┐
G-M   │  並列可（route 個別差し替え）
G-A   │
G-R  ─┘
   ↓
G-D（profile が member 集合・admin が dashboard adapter 経由）
   ↓
G-G（admin governance — adapter 多用）
   ↓
G-F（chrome 整合確認のみ）
```

## 3. グループ別タスクリスト

### G-T: 公開トップ

| Task ID | 内容 | file |
|---------|------|------|
| G-T-1 | `/` を `09e:67-160` blueprint に整合させる | `apps/web/app/page.tsx` |
| G-T-2 | `Hero` + `Stats` + `ZoneIntro` + `Timeline` + 最新 6 件 `MemberGrid` の構成確認 | 同上 |
| G-T-3 | `data-section-rhythm` / `data-card-tone` 属性付与 | 同上 |

### G-M: 公開メンバー

| Task ID | 内容 | file |
|---------|------|------|
| G-M-1 | `/members` filter + grid/table 切替を blueprint 整合 | `apps/web/app/(public)/members/page.tsx` |
| G-M-2 | `MemberFilters.client.tsx` の URL 同期維持 | 既存 |
| G-M-3 | `/members/[id]` で `MemberDetailSections` / `MemberLinks` / `MemberTags` を blueprint 順に配置 | `apps/web/app/(public)/members/[id]/page.tsx` |
| G-M-4 | `data-visibility` marker を field 単位で付与（serial-06 と整合） | 同上 |
| G-M-5 | adapter `public-members.ts` を新規 | `apps/web/src/lib/adapters/public-members.ts` |

### G-A: 認証

| Task ID | 内容 | file |
|---------|------|------|
| G-A-1 | `/login` を Card + Banner + OAuthButton + MagicLinkForm 構成へ | `apps/web/app/login/page.tsx` |
| G-A-2 | error/not-found の chrome 整合 | `apps/web/app/login/error.tsx` |

### G-R: 登録・法務

| Task ID | 内容 | file |
|---------|------|------|
| G-R-1 | `/register` を Hero + 6 step preview + RegisterCallout | `apps/web/app/(public)/register/page.tsx` |
| G-R-2 | `/privacy` を LegalProse で構成 | `apps/web/app/privacy/page.tsx` |
| G-R-3 | `/terms` を LegalProse で構成 | `apps/web/app/terms/page.tsx` |

### G-D: 管理ダッシュボード + プロフィール

| Task ID | 内容 | file |
|---------|------|------|
| G-D-1 | `/(admin)/admin` を KpiGrid + RecentActivity + MembersTable preview | `apps/web/app/(admin)/admin/page.tsx` |
| G-D-2 | `/profile` を ProfileHero + FormPreviewSections + ConsentSnapshot で構成し、既存 root path を維持する | `apps/web/app/profile/page.tsx`（+ 同階層の `_components/`, `error.tsx`, `loading.tsx`, `not-found.tsx`） |
| G-D-3 | adapter `admin-dashboard.ts` / `member-profile.ts` 新規 | `apps/web/src/lib/adapters/{admin-dashboard,member-profile}.ts` |

### G-G: 管理運営

| Task ID | 内容 | file |
|---------|------|------|
| G-G-1 | `/(admin)/admin/members` を MembersTable + Drawer | `apps/web/app/(admin)/admin/members/page.tsx` |
| G-G-2 | `/(admin)/admin/tags` を TagQueuePanel 構成 | `apps/web/app/(admin)/admin/tags/page.tsx` |
| G-G-3 | `/(admin)/admin/meetings` を MeetingPanel 構成 | `apps/web/app/(admin)/admin/meetings/page.tsx` |
| G-G-4 | `/(admin)/admin/schema` を SchemaDiffPanel 構成 | `apps/web/app/(admin)/admin/schema/page.tsx` |
| G-G-5 | `/(admin)/admin/requests` を RequestQueuePanel 構成 | `apps/web/app/(admin)/admin/requests/page.tsx` |
| G-G-6 | `/(admin)/admin/identity-conflicts` を IdentityConflictRow リスト | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` |
| G-G-7 | `/(admin)/admin/audit` を AuditLogPanel 構成 | `apps/web/app/(admin)/admin/audit/page.tsx` |

### G-F: Fallback chrome 整合

| Task ID | 内容 | file |
|---------|------|------|
| G-F-1 | `app/error.tsx` の Card 構成確認 | `apps/web/app/error.tsx` |
| G-F-2 | `app/not-found.tsx` の EmptyState 構成確認 | `apps/web/app/not-found.tsx` |
| G-F-3 | `app/loading.tsx`（SW-04 produced）の参照確認 | — |

## 4. 単一責務原則の適用

- 各 page.tsx は「blueprint section を JSX で再現する」責務のみ
- データ整形は adapter 層に寄せる（page.tsx 内で `.map(x => ...)` を書かない）
- interactivity は既存 `.client.tsx` boundary に寄せる
- 1 page.tsx = 1 blueprint section の bind
- 実装前に `PROTOTYPE-COVERAGE.md` の `current_app_path` と source JSX / 09e-09h 対応を確認し、URL から route group 配置を推測しない

## 5. 並列実行可能性

G-T / G-M / G-A / G-R は file path に物理重複がなく並列可。G-D は G-M の adapter 設計に依存（同じ MemberCard 系で reuse 余地）。G-G は G-D の admin-dashboard adapter pattern を踏襲できる。G-F は最後にまとめて行う。

## 6. CONST_007 適合

本 SW を後続実装プロンプト 1 サイクル内に完了する。グループ分割は実装フェーズの順序整理のためであり、未タスク化された先送りは作らない。
