# Phase 3: モジュール俯瞰 / 想定変更ファイル群 / API 接続マッピング

> 改訂日: 2026-05-07
> 改訂理由: 全画面（19 routes）スコープに対応し、18 タスク × 想定変更ファイル俯瞰、画面 → API endpoint 詳細マッピング、プロトタイプ未掲載画面の設計指針、各タスクの差分 hint を全て更新。

---

## 1. 18 タスク × 想定変更ファイル俯瞰

### 1.1 凡例

- `C` = 新規作成 / `M` = 更新 / `D` = 削除 / `R` = 参照のみ（変更なし）
- パスはすべてリポジトリルート起点

### 1.2 俯瞰表

| # | task | path | 区分 |
|---|------|------|------|
| 01 | scope-gate-all-screens | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md` | M |
| 01 | scope-gate-all-screens | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/scope.md` | C |
| 02 | wrangler-env-injection | `apps/web/wrangler.toml` | M |
| 02 | wrangler-env-injection | `apps/web/.dev.vars.example` | C |
| 02 | wrangler-env-injection | `apps/web/src/lib/env.ts` | C |
| 03 | sentry-workers-sdk-unify | `apps/web/src/instrumentation.ts` | M |
| 03 | sentry-workers-sdk-unify | `apps/web/src/instrumentation-client.ts` | C |
| 03 | sentry-workers-sdk-unify | `apps/web/sentry.server.config.ts` | M |
| 03 | sentry-workers-sdk-unify | `apps/web/package.json` | M |
| 04 | window-guard-and-logger | `apps/web/src/lib/logger.ts` | C |
| 04 | window-guard-and-logger | `apps/web/src/lib/is-browser.ts` | C |
| 04 | window-guard-and-logger | `apps/web/.eslintrc.cjs` | M |
| 05 | error-boundary-and-staging-smoke | `apps/web/src/app/error.tsx` | C |
| 05 | error-boundary-and-staging-smoke | `apps/web/src/app/global-error.tsx` | C |
| 05 | error-boundary-and-staging-smoke | `apps/web/src/app/not-found.tsx` | C |
| 05 | error-boundary-and-staging-smoke | `apps/web/src/app/loading.tsx` | C |
| 05 | error-boundary-and-staging-smoke | `docs/30-workflows/.../specs/staging-smoke-checklist.md` | C |
| 06 | ui-ux-contract-rewrite | `docs/30-workflows/.../specs/ui-ux-contract.md` | C |
| 07 | prototype-mapping-table | `docs/30-workflows/.../specs/prototype-mapping.md` | C |
| 08 | design-tokens-doc | `docs/30-workflows/.../specs/09b-design-tokens.md` | C |
| 09 | tailwind-v4-setup | `apps/web/postcss.config.mjs` | M |
| 09 | tailwind-v4-setup | `apps/web/src/styles/globals.css` | M |
| 09 | tailwind-v4-setup | `apps/web/src/styles/tokens.css` | C |
| 09 | tailwind-v4-setup | `apps/web/package.json` | M |
| 10 | ui-primitives | `apps/web/src/components/ui/{button,card,badge,input,select,table,tabs,sidebar,toast,skeleton,data-table,empty-state,error-state}.tsx` | C |
| 10 | ui-primitives | `apps/web/src/components/ui/index.ts` | C |
| 11 | public-top-and-member-list | `apps/web/src/app/page.tsx` | M |
| 11 | public-top-and-member-list | `apps/web/src/app/(public)/members/page.tsx` | M |
| 11 | public-top-and-member-list | `apps/web/src/app/(public)/layout.tsx` | M |
| 11 | public-top-and-member-list | `apps/web/src/features/public/components/{Hero,Stats,ZoneGuide,Timeline,MemberCard,MemberList,FilterBar,DensityToggle}.tsx` | C |
| 11 | public-top-and-member-list | `apps/web/src/lib/api/public.ts` | C |
| 12 | member-detail-register-legal | `apps/web/src/app/(public)/members/[id]/page.tsx` | M |
| 12 | member-detail-register-legal | `apps/web/src/app/(public)/register/page.tsx` | C |
| 12 | member-detail-register-legal | `apps/web/src/app/privacy/page.tsx` | C |
| 12 | member-detail-register-legal | `apps/web/src/app/terms/page.tsx` | C |
| 12 | member-detail-register-legal | `apps/web/src/features/public/components/MemberDetail.tsx` | C |
| 12 | member-detail-register-legal | `apps/web/src/features/legal/components/LegalProse.tsx` | C |
| 13 | login-rebuild | `apps/web/src/app/login/page.tsx` | M |
| 13 | login-rebuild | `apps/web/src/features/auth/components/{LoginInput,LoginSent,LoginUnregistered,LoginDeleted,LoginError}.tsx` | C |
| 13 | login-rebuild | `apps/web/src/features/auth/state/login-state.ts` | C |
| 13 | login-rebuild | `apps/web/src/lib/api/auth.ts` | C |
| 14 | my-profile-and-requests | `apps/web/src/app/profile/page.tsx` | M |
| 14 | my-profile-and-requests | `apps/web/src/features/me/components/{VisibilityBanner,VisibilitySummary,RequestPanel,DeleteRequestPanel}.tsx` | C |
| 14 | my-profile-and-requests | `apps/web/src/lib/api/me.ts` | C |
| 15 | admin-dashboard-and-members | `apps/web/src/app/(admin)/admin/page.tsx` | M |
| 15 | admin-dashboard-and-members | `apps/web/src/app/(admin)/admin/members/page.tsx` | M |
| 15 | admin-dashboard-and-members | `apps/web/src/app/(admin)/layout.tsx` | M |
| 15 | admin-dashboard-and-members | `apps/web/src/features/admin/components/{KpiGrid,ZoneChart,StatusChart,RecentActions,MembersTable,MemberDrawer}.tsx` | C |
| 15 | admin-dashboard-and-members | `apps/web/src/lib/api/admin.ts` | C |
| 16 | admin-tags-meetings-requests | `apps/web/src/app/(admin)/admin/tags/page.tsx` | C |
| 16 | admin-tags-meetings-requests | `apps/web/src/app/(admin)/admin/meetings/page.tsx` | C |
| 16 | admin-tags-meetings-requests | `apps/web/src/app/(admin)/admin/requests/page.tsx` | C |
| 16 | admin-tags-meetings-requests | `apps/web/src/features/admin/components/{TagsQueue,MeetingsCalendar,MeetingForm,RequestsQueue,RequestDetail}.tsx` | C |
| 17 | admin-schema-conflicts-audit | `apps/web/src/app/(admin)/admin/schema/page.tsx` | C |
| 17 | admin-schema-conflicts-audit | `apps/web/src/app/(admin)/admin/identity-conflicts/page.tsx` | C |
| 17 | admin-schema-conflicts-audit | `apps/web/src/app/(admin)/admin/audit/page.tsx` | C |
| 17 | admin-schema-conflicts-audit | `apps/web/src/features/admin/components/{SchemaDiff,ConflictPair,AuditTimeline,AuditFilterBar}.tsx` | C |
| 18 | verify-tokens-and-playwright-smoke | `apps/web/scripts/verify-design-tokens.ts` | C |
| 18 | verify-tokens-and-playwright-smoke | `e2e/smoke-all-routes.spec.ts` | C |
| 18 | verify-tokens-and-playwright-smoke | `.github/workflows/verify-design-tokens.yml` | C |
| 18 | verify-tokens-and-playwright-smoke | `apps/web/package.json` | M |

---

## 2. 画面 → API 接続マッピング詳細

### 2.1 公開層

#### `/` (Top)

| 用途 | API | method | response 期待 shape |
|------|-----|--------|---------------------|
| KPI Stats | `/public/stats` | GET | `{ totalMembers: number, byZone: Record<ZoneId, number>, byStatus: Record<MemberStatus, number> }` |
| 直近会員カード | `/public/members?limit=6&order=recent` | GET | `{ items: PublicMember[] }` |
| Form プレビュー（Timeline 用） | `/public/form-preview` | GET | `{ sectionCount: 6, questionCount: 31, sections: SectionMeta[] }` |

route file: `apps/api/src/routes/public/stats.ts`, `members.ts`, `form-preview.ts`

#### `/(public)/members`

| 用途 | API | method | response 期待 shape |
|------|-----|--------|---------------------|
| 会員一覧 | `/public/members?zone=&status=&q=&page=&pageSize=` | GET | `{ items: PublicMember[], page: number, pageSize: number, total: number }` |

route file: `apps/api/src/routes/public/members.ts`

#### `/(public)/members/[id]`

| 用途 | API | method | response 期待 shape |
|------|-----|--------|---------------------|
| 会員詳細（公開項目のみ） | `/public/member-profile/:id` | GET | `PublicMemberDetail`（visibility=public のみで構成） |

route file: `apps/api/src/routes/public/member-profile.ts`

#### `/(public)/register`

外部 redirect（`responderUrl`）。API call なし。

#### `/privacy`, `/terms`

静的。API call なし。

### 2.2 会員層

#### `/login`

| 状態 | API | method | response |
|------|-----|--------|----------|
| input → submit | `/auth/magic-link` | POST | `{ ok: true }` |
| sent | — | — | — |
| unregistered/deleted/error 判定 | `/auth/gate-state?email=` | GET | `{ state: "active"\|"unregistered"\|"deleted"\|"error", reason?: string }` |
| Google OAuth 後の補完 | `/auth/session-resolve` | GET | `{ userId, role, email }` |

route file: `apps/api/src/routes/auth/{schemas,session-resolve}.ts` および magic-link / gate-state（`auth/index.ts` に集約）

#### `/profile`

| 用途 | API | method | response |
|------|-----|--------|----------|
| 自分のプロフィール取得 | `/me` | GET | `MeProfile`（公開状態 / 公開範囲 / 申請履歴含む） |
| Form schema snapshot | `/auth/schemas` | GET | `FormSchemaSnapshot` |
| 公開範囲申請 | `/me/visibility-request` | POST | `{ ok: true, requestId }` |
| 削除申請 | `/me/delete-request` | POST | `{ ok: true, requestId }` |

route file: `apps/api/src/routes/me/{index,services,schemas}.ts`

### 2.3 管理層

#### `/(admin)/admin`

| 用途 | API | method | response |
|------|-----|--------|----------|
| ダッシュボード集約 | `/admin/dashboard` | GET | `{ kpis: { id, label, value, delta }[], byZone, byStatus, recentActions: AuditEvent[] }` |

route file: `apps/api/src/routes/admin/dashboard.ts`

#### `/(admin)/admin/members`

| 用途 | API | method | response |
|------|-----|--------|----------|
| 一覧 | `/admin/members?...` | GET | `{ items: AdminMember[], total }` |
| status 変更 | `/admin/member-status` | POST | `{ ok }` |
| 削除 | `/admin/member-delete` | POST | `{ ok }` |
| 詳細 / notes | `/admin/member-notes/:id` | GET | `{ items: Note[] }` |

route file: `apps/api/src/routes/admin/{members,member-status,member-delete,member-notes}.ts`

#### `/(admin)/admin/tags`

| 用途 | API | method | response |
|------|-----|--------|----------|
| キュー | `/admin/tags-queue` | GET | `{ items: TagCandidate[] }` |
| 採否 | `/admin/tags-queue/:id/decision` | POST | `{ ok }` |

route file: `apps/api/src/routes/admin/tags-queue.ts`

#### `/(admin)/admin/meetings`

| 用途 | API | method | response |
|------|-----|--------|----------|
| 一覧 | `/admin/meetings` | GET | `{ items: Meeting[] }` |
| 作成 | `/admin/meetings` | POST | `{ id }` |
| 更新 | `/admin/meetings/:id` | PATCH | `{ ok }` |
| 出欠（参考） | `/admin/attendance` | GET | `{ items }` |

route file: `apps/api/src/routes/admin/{meetings,attendance}.ts`

#### `/(admin)/admin/schema`

| 用途 | API | method | response |
|------|-----|--------|----------|
| 現状と最新の差分 | `/admin/schema` | GET | `{ current, latest, diff }` |
| 適用 | `/admin/sync-schema` | POST | `{ ok }` |
| Form / Sheets sync | `/admin/sync` / `/admin/responses-sync` | POST | `{ ok, syncedAt }` |

route file: `apps/api/src/routes/admin/{schema,sync-schema,sync,responses-sync}.ts`

#### `/(admin)/admin/requests`

| 用途 | API | method | response |
|------|-----|--------|----------|
| キュー | `/admin/requests` | GET | `{ items: Request[] }` |
| 採否 | `/admin/requests/:id/decision` | POST | `{ ok }` |

route file: `apps/api/src/routes/admin/requests.ts`

#### `/(admin)/admin/identity-conflicts`

| 用途 | API | method | response |
|------|-----|--------|----------|
| ペア一覧 | `/admin/identity-conflicts` | GET | `{ items: ConflictPair[] }` |
| 統合 / 棄却 | `/admin/identity-conflicts/:id/resolve` | POST | `{ ok }` |

route file: `apps/api/src/routes/admin/identity-conflicts.ts`

#### `/(admin)/admin/audit`

| 用途 | API | method | response |
|------|-----|--------|----------|
| 監査ログ | `/admin/audit?actor=&action=&from=&to=&page=` | GET | `{ items: AuditEvent[], total }` |

route file: `apps/api/src/routes/admin/audit.ts`

### 2.4 共通

| route | 接続 |
|-------|------|
| `error.tsx` | Sentry `captureException` のみ |
| `global-error.tsx` | 同上 |
| `not-found.tsx` | なし |
| `loading.tsx` | なし |

---

## 3. プロトタイプ未掲載画面の設計指針

### 3.1 共通方針

未掲載画面は次の primitives と layout patterns の組合せで構成する。**新規 primitive を生やさない**。

| パターン | 構成 primitives |
|----------|-----------------|
| 法務ページ（privacy, terms） | `Container` + `LegalProse`（`Card` の variant） |
| 登録（register） | `Container` + `Hero` + `Card` + `Button` (CTA) |
| 管理画面・queue 系（tags, requests） | `Sidebar` + `PageHeader` + `Tabs` + `DataTable` + `Drawer`（`Card` を slide-in 配置） |
| 管理画面・CRUD（meetings） | `Sidebar` + `PageHeader` + `DataTable` + `Modal Form`（`Card` + `Input` + `Select`） |
| 管理画面・diff（schema） | `Sidebar` + `PageHeader` + `DiffView`（`Card` を 2 カラム並置）+ `Button` (apply) |
| 管理画面・compare（identity-conflicts） | `Sidebar` + `PageHeader` + `SideBySideCompare`（`Card` × 2 + `Badge`）+ `Button` (resolve) |
| 管理画面・timeline（audit） | `Sidebar` + `PageHeader` + `FilterBar` + `Timeline`（`Card` の縦並び + 日付 group） |
| 共通エラー / 404 / loading | `EmptyState` / `ErrorState` / `Skeleton` |

### 3.2 admin 共通レイアウト

`apps/web/src/app/(admin)/layout.tsx` に下記固定構成を置く:

```
+------------------------------------------------------+
| Sidebar (Logo / Nav 8 items / User menu)            |
|----------+-------------------------------------------+
|          | PageHeader (title + breadcrumb + action)  |
|          |-------------------------------------------+
|  nav     | <slot> (DataTable / Form / Diff / etc.)   |
|          |                                           |
+----------+-------------------------------------------+
```

Nav 8 items: Dashboard / Members / Tags / Meetings / Schema / Requests / Identity Conflicts / Audit。

### 3.3 OKLch 適用ルール

- 状態色: `--ubm-color-info` / `-success` / `-warning` / `-danger`
- zone 色: `--ubm-color-zone-{a..e}`
- HEX 直書き禁止。`bg-[#xxx]` `text-[#xxx]` も禁止。tokens 外の色は task-08 で承認された palette のみ。

### 3.4 アクセシビリティ最低基準

- すべての clickable は `<button>` または `<a>` の native semantics を持つこと
- Form input には `<label>` を必ず関連付け
- icon-only button には `aria-label`
- modal / drawer は `role="dialog"` + focus trap

---

## 4. 各タスクの想定差分 Hint

### 4.1 task-01 scope-gate-all-screens

- phase-1.md の改訂版を最新に確定
- `specs/scope.md` に 19 routes 一覧と非ゴールを再掲
- DAG / 工数見積は phase-2 を参照（重複記述しない）

### 4.2 task-02 wrangler-env-injection

- `apps/web/wrangler.toml` に `[env.staging]` `[env.production]` の vars を整理
- `NEXT_PUBLIC_API_BASE_URL` / `SENTRY_DSN` / `AUTH_URL` を env binding 経由で注入
- `src/lib/env.ts` で型付きアクセサ（zod 検証）

### 4.3 task-03 sentry-workers-sdk-unify

- Workers 用 `@sentry/cloudflare` を `instrumentation.ts` で初期化
- Browser 用 `@sentry/nextjs` の client init を分離
- 二重初期化 guard: `process.env.NEXT_RUNTIME === 'edge'` での切替
- DSN / sample rate を env から注入

### 4.4 task-04 window-guard-and-logger

- `lib/is-browser.ts`: `typeof window !== 'undefined'` を一箇所に集約
- `lib/logger.ts`: client / worker 両対応の logger interface（debug/info/warn/error + sentry hook）
- ESLint custom rule: `no-restricted-globals`: window without guard

### 4.5 task-05 error-boundary-and-staging-smoke

- `app/error.tsx`: Sentry capture + reset() + tokens で構成された ErrorState
- `app/global-error.tsx`: 最上位 fallback（`<html><body>` を含む）
- `app/not-found.tsx`: EmptyState primitive
- `app/loading.tsx`: Skeleton primitive
- `staging-smoke-checklist.md`: 19 routes × 5 状態の手動確認表

### 4.6 task-06 ui-ux-contract-rewrite

- `specs/ui-ux-contract.md`
- 19 routes 全画面について: パス / 認可 / 状態（loading/empty/error/success）/ 主 component / API 依存 / アクセシビリティ要件
- 状態遷移図（mermaid）

### 4.7 task-07 prototype-mapping-table

- `specs/prototype-mapping.md`
- プロトタイプ jsx ファイル → 本番 component への対応表
- 未掲載画面の組合せ指針（§3 をここに正本として書く）

### 4.8 task-08 design-tokens-doc

- `specs/09b-design-tokens.md`
- color / spacing / typography / radius / shadow / motion の tokens 一覧
- OKLch fallback（`@supports not (color: oklch(...))` で sRGB 近似値）
- dark mode 拡張余地

### 4.9 task-09 tailwind-v4-setup

- `tailwindcss@^4` + `@tailwindcss/postcss` 導入
- `globals.css` に `@import "tailwindcss"` + `@theme` block
- `tokens.css` を分離して `@layer base` に inject
- `package.json` の deps 整理

### 4.10 task-10 ui-primitives

- 13 primitive をすべて TS + RSC-safe で実装
- `index.ts` で barrel export
- 各 primitive は variant prop（zod / cva）で OKLch tokens を受ける
- 注意: `'use client'` 必要なものだけ分離（Toast, DataTable など interactive のみ）

### 4.11 task-11 public-top-and-member-list

- `app/page.tsx` を Hero/Stats/ZoneGuide/Timeline で再構成
- `app/(public)/layout.tsx` で public 用 Header / Footer
- `app/(public)/members/page.tsx`: FilterBar + MemberList + DensityToggle + Pagination
- `lib/api/public.ts`: `getStats / listMembers / getMemberProfile / getFormPreview`

### 4.12 task-12 member-detail-register-legal

- `app/(public)/members/[id]/page.tsx`: SSR で `getMemberProfile`、見つからなければ `notFound()`
- `app/(public)/register/page.tsx`: Server Action で `responderUrl` に `redirect()`
- `app/privacy/page.tsx` / `app/terms/page.tsx`: MD インポート → LegalProse

### 4.13 task-13 login-rebuild

- `state/login-state.ts`: discriminated union で 5 状態を表現
- 各状態 component を分離、page.tsx は state machine の renderer のみ
- gate-state API → unregistered/deleted の分岐
- Magic Link 送信は Server Action

### 4.14 task-14 my-profile-and-requests

- `app/profile/page.tsx`: 4 領域（VisibilityBanner / VisibilitySummary / RequestPanel / DeleteRequestPanel）を縦に配置
- `lib/api/me.ts`: `getMe / requestVisibility / requestDelete`
- 削除申請は確認 modal（Card + 2 Button）

### 4.15 task-15 admin-dashboard-and-members

- `app/(admin)/layout.tsx`: §3.2 の固定構成
- `admin/page.tsx`: KpiGrid + ZoneChart + StatusChart + RecentActions
- `admin/members/page.tsx`: DataTable + FilterBar + Drawer
- chart は軽量（recharts もしくは自作 SVG）。SSR 互換注意

### 4.16 task-16 admin-tags-meetings-requests

- tags: TagsQueue（左 list + 右 detail panel）
- meetings: DataTable + Modal Form（CRUD）
- requests: RequestsQueue + RequestDetail（採否 action bar）

### 4.17 task-17 admin-schema-conflicts-audit

- schema: SchemaDiff（2 カラム）+ apply Button（confirm modal）
- identity-conflicts: ConflictPair（side-by-side）+ resolve action
- audit: AuditFilterBar + AuditTimeline + Pagination

### 4.18 task-18 verify-tokens-and-playwright-smoke

- `scripts/verify-design-tokens.ts`: `apps/web/src` から HEX / `bg-[#` / `text-[#` を grep し fail 判定
- `e2e/smoke-all-routes.spec.ts`: 19 routes × 200/auth-redirect 確認 + axe critical 0 確認
- `.github/workflows/verify-design-tokens.yml`: PR で必須 gate

---

## 5. 依存パッケージ追加見込み

| package | 目的 | task |
|---------|------|------|
| `tailwindcss@^4` | Tailwind v4 | task-09 |
| `@tailwindcss/postcss` | PostCSS plugin | task-09 |
| `@sentry/cloudflare` | Workers SDK | task-03 |
| `@sentry/nextjs` | Browser SDK | task-03 |
| `class-variance-authority` | variant 管理 | task-10 |
| `tailwind-merge` | className merge | task-10 |
| `recharts` | chart（採用検討） | task-15 |
| `@axe-core/playwright` | a11y 検証 | task-18 |

---

## 6. 受け入れチェックリスト（phase-3 として）

- [ ] 18 タスク全てに想定変更ファイル俯瞰行が存在
- [ ] 19 routes 全てに API 接続マッピング（または「なし」）が記載
- [ ] プロトタイプ未掲載画面の構成パターンが §3 に明文化
- [ ] 各タスクの差分 Hint が §4 に書かれている
- [ ] `apps/api/src/routes/` 内に存在する endpoint のみが参照されている（新 endpoint なし）
- [ ] HEX 直書き禁止 / OKLch tokens 必須が再掲されている

---

## 7. 補足: 既存 API surface の確認結果

以下は実在確認済み（`apps/api/src/routes/` 配下）:

```
auth/{index,schemas,session-resolve}.ts
me/{index,services,schemas}.ts
public/{index,stats,members,member-profile,form-preview}.ts
admin/{dashboard,members,member-status,member-delete,member-notes,
       tags-queue,meetings,attendance,requests,schema,sync-schema,
       sync,responses-sync,identity-conflicts,audit,
       smoke-sheets,smoke-observability}.ts
```

UI 側で必要となる endpoint は上記 surface 内で完結する。**新 endpoint 追加は不要**（phase-1 §1.2 非ゴール遵守）。
