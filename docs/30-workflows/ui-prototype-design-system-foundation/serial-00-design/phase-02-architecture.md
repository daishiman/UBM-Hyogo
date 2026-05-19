---
phase: 2
title: アーキテクチャ設計 — 4層反映経路と AppShell 設計
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-00-design
status: completed
---

# Phase 2 — アーキテクチャ設計

[実装区分: 実装仕様書]

## 1. 4 層反映経路（再確認）

```
プロトタイプ (claude-design-prototype/)
   ↓ 09a-prototype-map.md（行範囲マッピング）
仕様 (09b tokens / 09c primitives / 09e-g blueprints)
   ↓ tokens.css + globals.css bridge
実装 (apps/web/src/components/ui/, app/layout.tsx, app/.../page.tsx)
   ↓ data-theme cascade + @layer components
ブラウザ表示
```

層ごとの責務:

| 層 | 責務 | 本 workflow で触る範囲 |
|----|------|----------------------|
| プロトタイプ | デザイン言語の正本 | 変更しない（参照のみ） |
| 仕様 | プロトタイプを spec として固定化 | 変更しない（参照のみ） |
| トークン bridge | OKLch → Tailwind utility | 変更しない（既存維持） |
| 実装 | primitives + layout + page で構成 | **本 workflow の主戦場** |

## 2. globals.css の `@layer components` 設計

### 2.1 layer 構造

```css
@layer base, components, utilities;

@layer base {
  /* 既存: reset + body 既定 */
}

@layer components {
  /* 本 workflow で追加: page-level rhythm */
  /* §2.2 で詳細 */
}

@layer utilities {
  /* Tailwind が生成 */
}
```

### 2.2 追加する規則カテゴリ

| カテゴリ | selector 例 | 役割 |
|---------|-------------|------|
| Page surface | `body`, `[data-route]` | 画面背景 (`--ubm-color-surface-bg`) |
| Section rhythm | `[data-section]`, `[data-section-rhythm="compact\|comfortable"]` | 縦余白の段階 |
| Card chrome | `[data-card]`, `[data-card-tone="panel\|surface\|emphasis"]` | カード背景・陰影・border |
| Topbar / Sidebar surface | `[data-shell="topbar\|sidebar\|footer"]` | AppShell 共通 chrome |
| Visibility marker | `[data-visibility="public\|member\|admin"]` | 公開範囲インジケータ |
| Tag pill | `[data-component="tag-pill"][aria-selected="true"]` | 選択時 fill（G3-1） |
| Member card hover | `[data-component="member-card"]:hover` | hover elevation（G3-2） |
| Typography scale | `[data-text="display\|title\|body\|caption"]` | プロトタイプ準拠 typography |

すべて `var(--ubm-color-*)` / `var(--ubm-spacing-*)` 経由で値を引く。直接 HEX / px は記述しない。

## 3. AppShell layout 設計

### 3.1 3 系統 layout の構造

```
app/
├── layout.tsx                # Root layout: <html data-theme="warm"> + ToastProvider + body
├── (public)/
│   └── layout.tsx           # Public AppShell: Topbar + main + Footer
├── (admin)/
│   └── layout.tsx           # Admin AppShell: AdminSidebar + AdminTopbar + main
├── (member)/
│   └── layout.tsx           # Member AppShell: future member-only routes 用。現行 `/profile` は root 配下維持
├── profile/
│   └── page.tsx             # 認証済み会員 route（既存 path を維持）
├── login/                   # 未認証 entry point。`(member)` には含めない（SRP / 認証境界）
│   └── page.tsx
├── error.tsx                # global error boundary
├── not-found.tsx
└── loading.tsx
```

> **`(member)` AppShell の境界判断（Clean Architecture / SRP）**:
> `(member)/layout.tsx` の責務は「将来の認証済み会員 chrome」の提供に限定する。現行 `/profile` は既存リンク・middleware・テスト契約を優先し root 配下の `apps/web/app/profile/` を維持する。
> - `login/` は **未認証 entry point** であり、まだ "member" ではない。`MemberHeader`（認証済み UI を含む）でラップすると LSP 違反となるため `(member)/` の外（root 配下）に置く。
> - `profile/` は認証済み会員の正典 route だが、今回 workflow では route group 移送を行わず root 配下で chrome / rhythm を合わせる。
> - 将来の member-only routes（例: `/profile/edit`、`/profile/settings`）は `(member)/` 配下に追加する（Open/Closed）。

### 3.2 AppShell 共通契約

各 layout は次の props / 構造を満たす:

| 項目 | Public | Admin | Member |
|------|--------|-------|--------|
| Topbar primitive | `<PublicTopbar />` | `<AdminTopbar />` | `<MemberTopbar />` |
| Side navigation | なし | `<AdminSidebar />` | なし |
| `data-shell` attr | `topbar`/`footer` | `sidebar`/`topbar` | `topbar` |
| `data-theme` cascade | `warm`（既定） | `cool` | `warm` |
| main wrapper | `<main data-route="public">` | `<main data-route="admin">` | `<main data-route="member">` |
| Footer | あり | なし | なし |

## 4. page.tsx 設計（19 routes）

### 4.1 構成原則

- 各 page.tsx は `09e/f/g-screen-blueprints-*.md` の対応する blueprint section を直接実装
- primitives (`apps/web/src/components/ui/`) と feature components (`apps/web/src/components/{public,admin,member}/`) を組み合わせる
- 新規 primitive を生やさない
- データ取得は既存 API client (`apps/web/src/lib/api/`) 経由のみ
- Server Component を既定、Client Component は state を持つ最小範囲に限定

### 4.2 19 routes 対応表

| Route | blueprint 参照 | 主要 component |
|-------|---------------|----------------|
| `/` | `09e:67-160` | Hero, KpiGrid, FeatureCardList, RegisterCallout |
| `/(public)/members` | `09e:208-338` | MemberFilters, MemberListGrid, MemberCard |
| `/(public)/members/[id]` | `09e:339-472` | MemberDetail, SectionedFields, VisibilityBadge |
| `/(public)/register` | `09e:473-560` | RegisterCallout, FormStepsList |
| `/privacy` | `09e:561-620` | LegalDocument |
| `/terms` | `09e:621-680` | LegalDocument |
| `/login` | `09f:30-110` | LoginCard, OAuthButton, MagicLinkForm |
| `/profile` | `09f:111-280` | ProfileDetail, FormPreviewSections, ConsentSnapshot |
| `/(admin)/admin` | `09g:4-161` | KpiGrid, MembersTable preview, RecentActivity |
| `/(admin)/admin/members` | `09g:162-280` | MembersTable, MemberDrawer, MemberFilters |
| `/(admin)/admin/tags` | `09g:281-400` | TagsTable, TagAssignmentPanel |
| `/(admin)/admin/meetings` | `09g:401-520` | MeetingsList, AttendancePanel |
| `/(admin)/admin/schema` | `09g:521-640` | SchemaDiffViewer, SchemaApprovalActions |
| `/(admin)/admin/requests` | `09g:641-740` | RequestQueue, RequestActionPanel |
| `/(admin)/admin/identity-conflicts` | `09g:741-840` | IdentityConflictList, MergeForm |
| `/(admin)/admin/audit` | `09g:841-940` | AuditTable, AuditFilters |
| `app/error.tsx` | `09h:fallback` | ErrorCard |
| `app/not-found.tsx` | `09h:fallback` | NotFoundCard |
| `app/loading.tsx` | `09h:fallback` | LoadingSpinner |

## 5. Google Form → MemberDetail 描画経路

### 5.1 データ流

```
Google Form (formId 119ec...)
   ↓ apps/api: sync-forms-responses.ts → D1.responses + response_fields
   ↓ apps/api: GET /public/members/:id → JSON { id, displayName, fields: [...] }
   ↓ apps/web: app/(public)/members/[id]/page.tsx (Server Component)
   ↓ apps/web: <MemberDetail fields={...} /> primitive 組み立て
ブラウザ表示（visibility=public フィールドのみ）
```

### 5.2 visibility フィルタ

API 側で `visibility !== "public"` を除外済の前提だが、UI 側でも防御的に `[data-visibility]` marker で表示制御する。

## 6. 実装順序（サブワークフロー依存グラフ）

```
serial-00-design (前提)
   ↓
parallel-01-globals-css-rhythm   ──┐
parallel-02-prototype-css-rules    │
parallel-03-appshell-layouts       │ 並列実装可
parallel-04-shared-page-chrome   ──┘
   ↓ 全て完成
serial-05-page-routes-blueprint-binding
   ↓
serial-06-form-response-binding
   ↓
serial-07-regression-evidence
```

## 7. 採用しない選択肢

| 選択肢 | 不採用理由 |
|--------|----------|
| 新規 primitive 追加で雰囲気を出す | 既存 13 primitives で十分。新規追加は spec ドリフトを招く |
| 各 page.tsx で個別に background utility を指定 | バラつきが出る。global selector で機械化する方が一貫する |
| Tailwind config 経由で chrome 規則を追加 | utility 層ではなく component 層に置くべき。selector ベースの方が AppShell 契約と一致 |
| API 側に rendering hint を追加 | 既存 endpoint surface のみ接続の不変条件に違反 |
