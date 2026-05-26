# Task A: AdminAppShell / Topbar / Sidebar 整流化

[実装区分: 実装仕様書]

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- Branch: `feat/admin-ui-prototype-alignment`
- 依存: なし（先行可能。Task B/C/D/E すべての前提）
- 後続依存:
  - Task C: 本 task で layout topbar slot を一元化した後、各 page から `<Breadcrumb>` 直貼り削除と `AdminPageHeader` 配線を行う
  - Task E: 本 task の sidebar active / footer 構成が固まった後に visual baseline を採取
- 関連既存 issue: #894（AdminTopbar breadcrumb 統合・CLOSED 維持・再整流）/ #895（admin topbar actions client island・CLOSED 維持・slot 契約最終化）

---

## Phase 1: 要件定義

### ゴール
- プロトタイプ `pages-admin.jsx` / `primitives.jsx` / `styles.css` に準拠した **sidebar mode AppShell** を `apps/web/app/(admin)/layout.tsx` に確立する
- topbar から「静的文字列『管理』」「`aria-hidden` 空 actions slot」の両方を撤去し、page 側 `AdminPageHeader` に title/breadcrumb/actions 所有権を委譲する設計を明文化
- `AdminSidebar` を、3 group (Public / Members / Admin) + active highlight + schema diff badge + user-chip footer のプロトタイプ完全準拠版へ差し替える

### AC（受入条件）
| # | 受入条件 | 検証手段 |
|---|----------|----------|
| AC-1 | `apps/web/app/(admin)/layout.tsx` の topbar から固定文字列「管理」と空 `aria-hidden` 配置が消える | `grep -F '管理' apps/web/app/(admin)/layout.tsx` が 0 件 / vitest layout.spec.tsx で breadcrumb-slot に固定テキストが含まれないこと |
| AC-2 | `AdminSidebar` の nav 項目が、現在の pathname に対応する 1 件のみ `data-active="true"` を持つ（完全一致＋セグメント先頭一致ロジック） | vitest spec で `usePathname='/admin/members/123'` 時に `/admin/members` のみ active となること |
| AC-3 | `AdminSidebar` が 3 group (Public / Members / Admin) に分かれ、各 group ラベルが `.nav-label` 相当の DOM (`data-component="admin-nav-label"`) で出力される | vitest spec で 3 group ラベル文字列が存在すること |
| AC-4 | `/admin/schema` 項目に未解決 schema diff 件数 > 0 のとき `Chip tone="warn" size="sm"` が表示され、件数 0 のとき非表示 | vitest spec で fetch result mock 1 件 / 0 件で DOM 比較 |
| AC-5 | sidebar footer に `user-chip`（Avatar + name + email）と `SignOutButton` の 2 ブロックが描画される | vitest spec で session mock を入れて DOM 検査 |
| AC-6 | `(admin)/admin/**/page.tsx` 配下から `<Breadcrumb` 直貼りが 0 件になる（Task C と連携・本 task では layout 側 slot 仕様確立まで） | `grep -rn '<Breadcrumb' apps/web/app/(admin)/admin/` が 0 件（Task C 完了後に最終確認） |
| AC-7 | `verify-design-tokens` CI gate が green。HEX 直書き / `bg-[#xxx]` 0 件 | `pnpm verify-design-tokens` |
| AC-8 | typecheck / lint / build / vitest（web 配下 layout + sidebar 関連 spec）すべて green | `mise exec -- pnpm typecheck && pnpm lint && pnpm --filter web test` |

### スコープ内
- `apps/web/app/(admin)/layout.tsx` topbar slot 契約最終化（slot は client island としてエクスポートのみ・本体配線は本 task 内）
- `apps/web/src/components/layout/AdminSidebar.tsx` 完全書き直し（active / group / badge / footer）
- 新規: `AdminBrandBlock`（sidebar 上部 brand mark + title）/ `AdminSidebarNavItem`（active 判定を担う client component）
- schema diff 件数取得（layout server boundary で `safeServerFetch('/admin/schema/diff')` 1 回 → props 注入）
- 本 task で追加/拡充する vitest spec

### スコープ外
- 各 page の `AdminPageHeader` 採用と Breadcrumb 直貼り撤去本体作業（Task C）
- `/admin` ダッシュボード 404 / byZone 復旧（Task B）
- 出席分析 primitive 化（Task D）
- visual baseline 採取（Task E）
- 新規 API endpoint・D1 schema 変更（不変条件で禁止）

---

## Phase 2: 設計

### 2.1 AdminAppShell / Topbar slot 契約

#### server / client 境界
- `app/(admin)/layout.tsx` は **server component** を維持（auth gate を server 側で保持・不変条件 #11 #5 維持）
- topbar は **breadcrumb 表示の責務を持たない**。layout は構造（`<header data-shell="topbar">`）と空の slot コンテナだけを描画し、**ページ側 `AdminPageHeader` が page 内で breadcrumb / title / actions を完結**させる
- 旧 `data-component="admin-breadcrumb-slot"` / `admin-topbar-actions` の DOM は撤去（slot 機構は採用しない / page-head 集約方針へ統一）。issue #894/#895 で slot 配線を試みた結果、二重描画リスクが上回ったため **slot 廃止して page-head に一本化** が再整流方針

#### topbar の最終形
```
// topbar DOM は描画しない。
// page-head / breadcrumb / actions は各 page の AdminPageHeader が所有する。
```
**決定**: header 自体を撤去し、`main` の padding / rhythm で余白を担保する。空 header を残すと slot 再発生と二重描画の温床になる。

レスポンシブ hamburger は本 task では新設しない。未実装 control を置かず、Task E の mobile viewport で破綻が出た場合は同サイクル内で CSS collapse のみ修正する。

### 2.2 schema diff 件数取得経路
- `layout.tsx` 内で既存 `GET /admin/schema/diff` を `safeServerFetch` で 1 回呼ぶ。`summary=1` query parameter は追加しない
- 既存 endpoint レスポンス全件から unresolvedCount を派生する（`items.filter(unresolved).length` 相当）
- 結果を `<AdminSidebar schemaDiffCount={count} />` に props で渡す
- fetch 失敗時は `schemaDiffCount=0`（badge 非表示）・logger.warn のみ・layout は redirect しない（unauth は既存 auth gate が処理）

### 2.3 AdminSidebar 設計

#### nav 項目テーブル
| order | group | label | href | icon | badge |
|------|-------|-------|------|---------------------|-------|
| 1 | Public | ホーム | `/` | `Home` | - |
| 2 | Public | 会員ディレクトリ | `/members` | `Users` | - |
| 3 | Public | 登録 | `/register` | `UserPlus` | - |
| 4 | Members | マイページ | `/profile` | `User` | - |
| 5 | Admin | ダッシュボード | `/admin` | `LayoutDashboard` | - |
| 6 | Admin | 出席分析 | `/admin/dashboard/attendance` | `BarChart3` | - |
| 7 | Admin | 会員管理 | `/admin/members` | `Users` | - |
| 8 | Admin | タグキュー | `/admin/tags` | `Tags` | - |
| 9 | Admin | schema | `/admin/schema` | `Database` | `schemaDiffCount > 0` で warn |
| 10 | Admin | 開催日 | `/admin/meetings` | `CalendarDays` | - |
| 11 | Admin | 依頼キュー | `/admin/requests` | `Inbox` | - |
| 12 | Admin | Identity重複 | `/admin/identity-conflicts` | `GitMerge` | - |
| 13 | Admin | 監査ログ | `/admin/audit` | `ScrollText` | - |

`lucide-react` は現行依存に無いため追加しない。必要な nav icon は最小 inline SVG を `AdminSidebarNavItem` 内に閉じ、新規 icon package は追加しない。

#### active 判定ロジック
```
function isActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/') return pathname === '/';
  if (itemHref === '/admin') return pathname === '/admin'; // ダッシュボード root は完全一致
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}
```
- ルート `/admin` は完全一致のみ（さもないと全 admin route で `/admin` も active になる）
- それ以外は完全一致 + セグメント prefix（`/admin/members/123` で `/admin/members` を active 化）
- 同時 active は 1 件まで（href の長い順に評価 = テーブル順依存を排除）

#### sidebar-footer 構成
```
<footer data-component="admin-sidebar-footer">
  <div data-component="user-chip">
    <Avatar size="sm" name={session.user.name} />
    <div data-component="user-chip-body">
      <span data-component="user-chip-name">{session.user.name}</span>
      <span data-component="user-chip-email">{session.user.email}</span>
    </div>
  </div>
  <SignOutButton />
</footer>
```
- session は layout server boundary で取得済 → `AdminSidebar` に props で渡す（client 側で session を再 fetch しない）
- Avatar は既存 `apps/web/src/components/ui/Avatar.tsx` を流用する。`_shared/Avatar.tsx` は新規作成しない。

### 2.4 命名規則
- DOM hook: `data-component="admin-{block}"` / `data-shell="{topbar|sidebar|main}"` / `data-active="true|false"` を踏襲
- ファイル: client island は `AdminSidebar.tsx`（client） / 内部分割は `AdminSidebarNavItem.tsx`（client） / `AdminBrandBlock.tsx`（server 可・state 不要）

### 2.5 既存 component との関係
- `AdminPageHeader` の `breadcrumbs?` props は **維持**（廃止しない）。Task C で各 page から `AdminPageHeader` 経由で breadcrumb を渡すよう統一する
- `_shared/` 群（AdminSectionCard 等）は無変更
- `SignOutButton` は流用（既存 `components/auth/SignOutButton`）

---

## Phase 3: 設計レビュー

### 自己レビュー観点
- 不変条件 #5（D1 直接アクセス禁止）: 本 task は API fetch のみ・違反なし
- 不変条件 #11（fail-closed auth）: `getSession()` → redirect の二段防御を維持
- 不変条件 OKLch token 正本: 色は `tokens.css` 変数のみ参照・HEX 直書きしない
- CONST_005（実装仕様書必須項目）: Phase 5.1 変更ファイル一覧で担保
- 既存 PR #894/#895 規約: slot を一旦 deprecated とし page-head に集約する旨を Phase 12 で明示

### 既存 issue との関係
- #894: 「AdminTopbar breadcrumb 統合」を slot 経由で試行 → 本 task で **slot 廃止 + page-head 一本化** に方針変更（後段 followup issue として記録）
- #895: 「admin topbar actions client island」も同様に **page-head の actions slot に集約** へ再整流

### リスク
- topbar 撤去により既存 e2e / visual baseline が乖離 → Task E で baseline 全更新前提
- schema diff 件数 fetch が layout 全 admin route で発生するため、`safeServerFetch` の既存 cache / no-store 方針に従う。新しい `revalidate` policy は作らない。

---

## Phase 4: テスト計画

### 4.1 vitest spec
| spec ファイル | 種別 | 目的 | AC |
|-------------|------|------|------|
| `apps/web/app/(admin)/layout.spec.tsx` | 拡充 | 固定「管理」文字列が消えたこと / breadcrumb-slot DOM が無いこと | AC-1 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | 新規 | nav 項目数 / group ラベル / active 判定 / badge 表示 / footer 構成 | AC-2..AC-5 |
| `apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx` | 新規 | active 判定純関数の境界（`/admin` 完全一致 / セグメント prefix / 完全不一致） | AC-2 |
| `apps/web/src/components/layout/__tests__/AdminBrandBlock.spec.tsx` | 新規（任意） | brand mark + title の 2 ライン構造 | - |

### 4.2 Playwright spec
- 本 task では新規追加しない（visual / e2e は Task E スコープ）

### 4.3 grep gate (CI 補強)
- `grep -F '管理' apps/web/app/(admin)/layout.tsx` が 0 件（AC-1）
- `grep -rn '<Breadcrumb' apps/web/app/(admin)/admin/` が 0 件（AC-6・Task C 完了後ゲート）

---

## Phase 5: 実装手順

### 5.1 変更対象ファイル一覧（CONST_005）

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/(admin)/layout.tsx` | 編集 | topbar 内固定文字列 / 空 actions slot 撤去。schema diff fetch + `AdminSidebar` に props 注入。session を sidebar に渡す |
| `apps/web/src/components/layout/AdminSidebar.tsx` | 編集（実質書き直し） | client component 化。3 group / active / badge / user-chip footer 配線 |
| `apps/web/src/components/layout/AdminSidebarNavItem.tsx` | 新規 | nav item 1 件分の client component。active 判定 (`usePathname`) と icon + badge 描画 |
| `apps/web/src/components/layout/AdminBrandBlock.tsx` | 新規 | sidebar 上部 brand mark + title 2 行（server 可） |
| `apps/web/src/components/layout/isActive.ts` | 新規 | active 判定純関数。spec 単体テスト容易化のため抽出 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | 新規 | AC-2..AC-5 検証 |
| `apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx` | 新規 | active 判定境界 |
| `apps/web/src/components/layout/__tests__/isActive.spec.ts` | 新規 | 純関数境界（`/` / `/admin` / `/admin/members/123` 等） |
| `apps/web/app/(admin)/layout.spec.tsx` | 編集 | AC-1 検証追加（固定「管理」非表示） |
| `apps/web/src/components/ui/Avatar.tsx` | 流用のみ | sidebar footer の user-chip で既存 Avatar を使う。新規 `_shared/Avatar.tsx` は作らない |

> 削除対象ファイルなし。`_layout/AdminPageHeader.tsx` は無変更。

### 5.2 主要型・props シグネチャ

```ts
// isActive.ts
export function isActive(itemHref: string, pathname: string): boolean;

// AdminSidebar.tsx
export interface AdminSidebarProps {
  readonly schemaDiffCount: number;
  readonly userDisplayName: string;
  readonly userEmail: string;
}
export function AdminSidebar(props: AdminSidebarProps): JSX.Element;

// AdminSidebarNavItem.tsx ('use client')
export interface AdminSidebarNavItemProps {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly badge?: { tone: 'warn' | 'info' | 'neutral'; count: number } | null;
}
export function AdminSidebarNavItem(props: AdminSidebarNavItemProps): JSX.Element;

// AdminBrandBlock.tsx
export function AdminBrandBlock(): JSX.Element;

// layout.tsx 内 fetch
type SchemaDiffSummary = { readonly unresolvedCount: number };
```

### 5.3 各ファイル差分方針（疑似コード）

#### `layout.tsx`
```
const session = await getSession(); // 既存 + null/admin 二段 redirect
const diff = await safeServerFetch<SchemaDiffItems>('/admin/schema/diff', { method: 'GET' })
  .catch(() => ({ items: [] }));
const unresolvedCount = diff.items.filter(i => i.status === 'unresolved').length;

return (
  <div className="ubm-admin-shell ..." data-shell-mode="sidebar">
    <aside data-shell="sidebar">
      <AdminSidebar
        schemaDiffCount={unresolvedCount}
        userDisplayName={session.user.name ?? ''}
        userEmail={session.user.email ?? ''}
      />
    </aside>
    <main data-route="admin">{children}</main>
  </div>
);
// header は撤去
```

#### `AdminSidebar.tsx`
```
'use client';
const groups = [
  { label: 'Public', items: [/* order 1-3 */] },
  { label: 'Members', items: [/* order 4 */] },
  { label: 'Admin', items: [/* order 5-13 */] },
];
return (
  <nav aria-label="管理メニュー" className="admin-sidebar" data-shell-block="sidebar-nav">
    <AdminBrandBlock />
    {groups.map(g => (
      <section key={g.label} data-component="admin-nav-section">
        <div data-component="admin-nav-label">{g.label}</div>
        <ul>{g.items.map(it => <AdminSidebarNavItem key={it.href} {...withBadge(it)} />)}</ul>
      </section>
    ))}
    <footer data-component="admin-sidebar-footer">
      <div data-component="user-chip">
        <Avatar size="sm" name={userDisplayName} />
        <div data-component="user-chip-body">
          <span data-component="user-chip-name">{userDisplayName}</span>
          <span data-component="user-chip-email">{userEmail}</span>
        </div>
      </div>
      <SignOutButton />
    </footer>
  </nav>
);
```

#### `AdminSidebarNavItem.tsx`
```
'use client';
const pathname = usePathname();
const active = isActive(href, pathname);
return (
  <li>
    <Link href={href} data-active={active} data-component="admin-nav-item" className="...">
      <span data-component="admin-nav-icon">{icon}</span>
      <span>{label}</span>
      {badge && badge.count > 0 ? <Chip tone={badge.tone} size="sm">{badge.count}</Chip> : null}
    </Link>
  </li>
);
```

#### `isActive.ts`
```
export function isActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/') return pathname === '/';
  if (itemHref === '/admin') return pathname === '/admin';
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}
```

### 5.4 ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- --run components/layout
mise exec -- pnpm verify-design-tokens
mise exec -- pnpm build
```

---

## Phase 6: テスト追加

### `isActive.spec.ts`
- `isActive('/', '/')` → true
- `isActive('/', '/admin')` → false
- `isActive('/admin', '/admin')` → true
- `isActive('/admin', '/admin/members')` → false
- `isActive('/admin/members', '/admin/members')` → true
- `isActive('/admin/members', '/admin/members/123')` → true
- `isActive('/admin/members', '/admin/membership')` → false（prefix 誤一致防止）
- `isActive('/members', '/admin/members')` → false

### `AdminSidebarNavItem.spec.tsx`
- pathname mock = `/admin/members` で `/admin/members` item に `data-active="true"`
- badge prop が `null` / `{count:0}` のとき badge DOM 非表示
- badge prop `{tone:'warn', count:3}` で Chip 描画 + 文言 "3" 含む

### `AdminSidebar.spec.tsx`
- 3 group ラベル `Public` / `Members` / `Admin` が出力される（AC-3）
- 全 13 nav item が描画される
- `schemaDiffCount=0` 時 schema 行に badge 無し / `=2` 時 badge "2" 描画（AC-4）
- footer に `user-chip-name` `user-chip-email` `SignOutButton` が含まれる（AC-5）
- pathname mock `/admin/tags` で `/admin/tags` のみ active（AC-2）

### `layout.spec.tsx`（追加ケース）
- topbar 内 `data-component="admin-breadcrumb-slot"` が無い / 固定文字列「管理」が無い（AC-1）
- `safeServerFetch` を mock 失敗にしても layout が render 成功し badge は表示されない

---

## Phase 7: カバレッジ

- 変更ブロック単位の差分 coverage 80% を目標
- `isActive.ts` は 100% 行/分岐カバレッジ（純関数のため必達）
- `AdminSidebar.tsx` は branch coverage（badge 表示 on/off / group 別描画 / active 1 件のみ）を網羅
- 全体 coverage 閾値は親 workflow / `pnpm coverage` の既定に従う（本 task で閾値変更しない）

---

## Phase 8: リファクタ

### Breadcrumb 直貼り削除リスト（Task C で実施・本 task では確認のみ）
現在 `<Breadcrumb` を直貼りしている page（grep 結果）:
1. `apps/web/app/(admin)/admin/requests/page.tsx`
2. `apps/web/app/(admin)/admin/tags/page.tsx`
3. `apps/web/app/(admin)/admin/schema/page.tsx`
4. `apps/web/app/(admin)/admin/audit/page.tsx`
5. `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`
6. `apps/web/app/(admin)/admin/meetings/page.tsx`

> 上記 6 件 + 残りの page（members / dashboard/attendance / page.tsx root 等）も合わせて Task C で `AdminPageHeader` に統合する

### AdminPageHeader breadcrumbs 引数
- **維持する**。理由: Task C で各 page から breadcrumb を渡す経路として必要。slot 集約を廃止した分、page-head が単一窓口になる

---

## Phase 9: QA

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test
mise exec -- pnpm verify-design-tokens
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```
- typecheck: 新規 props 型 / `isActive` シグネチャ整合
- lint: client/server 境界違反検出（`'use client'` 必要な component で `next/headers` 等を呼ばない）
- verify-design-tokens: HEX 直書き 0 件確認
- verify-pr-ready.sh: gate-metadata:validate / verify:phase12-compliance / indexes:rebuild drift 一括チェック

---

## Phase 10: 最終レビュー

### セルフレビューチェック項目
- [ ] 不変条件 #1（schema 固定しすぎない）: 影響なし
- [ ] 不変条件 #5（D1 直接アクセス禁止）: 守られている
- [ ] 不変条件 #8（spec 拡張子 `.spec`）: 新規 spec は `.spec.tsx` / `.spec.ts`
- [ ] 不変条件 #9（admin form input は FormField 経由）: 本 task で input 追加なし・影響外
- [ ] 不変条件 #10（admin mutation hook）: 本 task で mutation 追加なし
- [ ] 不変条件 #11（fail-closed auth）: layout の二段 redirect 維持
- [ ] CONST_005: Phase 5.1 に変更ファイル一覧あり
- [ ] OKLch token 正本: HEX 直書き 0
- [ ] Phase 11 evidence 計画あり（次節）
- [ ] 既存 PR #894/#895 との関係を Phase 3 と Phase 12 で明記

---

## Phase 11: 手動テスト

### 4 viewport 評価ポイント
| viewport | 幅 | 評価点 |
|---------|----|--------|
| mobile | 375px | sidebar 非表示（CSS `@media` でプロトタイプ準拠） / main padding 維持 |
| tablet | 768px | sidebar 表示 / 13 nav item 折り返しなし / badge 視認 |
| desktop | 1280px | sidebar 272px 固定 / 全 nav 表示 / footer user-chip 2 行 |
| wide | 1536px | content-area max-width 1440 中央寄せ |

### screenshot 撮影リスト
- `task-A-sidebar-desktop-1280.png`（active = `/admin`）
- `task-A-sidebar-desktop-1280-members-active.png`（active = `/admin/members`）
- `task-A-sidebar-tablet-768.png`
- `task-A-sidebar-mobile-375.png`（sidebar 非表示確認）
- `task-A-sidebar-schema-badge.png`（schemaDiffCount=3 を staging で再現）
- `task-A-topbar-removed-1280.png`（topbar header DOM 不在を devtools で証跡）

### evidence path
`docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-11/task-A/` 配下に上記 6 枚 + 撮影手順 `README.md` を配置。

---

## Phase 12: ドキュメント更新

### 親 workflow `phase-12-documentation.md` への追記
- AppShell topbar 設計の **方針変更**: slot 経由から page-head 集約へ（#894/#895 の方針再整流の経緯を 3-5 行で明記）
- `AdminSidebar` プロトタイプ準拠仕様の確定（3 group / active / badge / user-chip）
- 各 page の Breadcrumb 直貼り撤去責務は Task C にあること明示

### aiworkflow 6 surfaces 反映候補
- `task-workflow-active.md`: 「admin shell 整流化（Task A）」エントリ追加
- `quick-reference.md`: AppShell 設計の DoR/DoD 1 行サマリ
- `resource-map.md`: 本 spec へのリンク追加
- `artifact-inventory.md`: 新規 component 5 件・spec 4 件を登録
- `SKILL-changelog.md`: 日付 + 「admin shell slot 廃止 / page-head 集約」記載
- `lessons-learned/` 候補: L-ADMINSHELL-001（slot 二重描画リスクと page-head 集約原則）/ L-ADMINSHELL-002（sidebar active 判定の prefix 誤一致回避）

### gate-metadata:validate / verify:phase12-compliance を pass する見出し構成
本ファイルは canonical 9 headings（Phase 1〜Phase 13 + DoD）を全て含む。`verify:phase12-compliance` 用に `## Phase 11: 手動テスト` 配下に evidence path を明記済。

---

## Phase 13: PR

### PR title 候補
- `feat(admin): AdminAppShell topbar 撤去 + Sidebar プロトタイプ準拠化 (Refs #894 #895)`

### PR body 骨子
```
## Summary
- AdminAppShell の topbar から固定「管理」と空 actions slot を撤去し、page-head（AdminPageHeader）に title/breadcrumb/actions 所有権を一本化
- AdminSidebar をプロトタイプ準拠の 3 group / active highlight / schema diff badge / user-chip footer 構成へ刷新
- 新規: AdminSidebarNavItem / AdminBrandBlock / isActive 純関数 + spec 一式

## Changes
- apps/web/app/(admin)/layout.tsx: topbar header 撤去・schema diff fetch 追加
- apps/web/src/components/layout/AdminSidebar.tsx: 書き直し
- apps/web/src/components/layout/AdminSidebarNavItem.tsx: 新規
- apps/web/src/components/layout/AdminBrandBlock.tsx: 新規
- apps/web/src/components/layout/isActive.ts: 新規
- 4 spec 新規 / 1 spec 拡充

## Test Plan
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] mise exec -- pnpm --filter web test
- [ ] mise exec -- pnpm verify-design-tokens
- [ ] mise exec -- pnpm build
- [ ] staging visual evidence（phase-11 task-A/）

## Refs
- #894 (AdminTopbar breadcrumb 統合・本 PR で slot 廃止へ再整流)
- #895 (admin topbar actions client island・本 PR で page-head 集約へ再整流)
- 親 workflow: docs/30-workflows/admin-ui-prototype-alignment/
```

- base: `dev`（CLAUDE.md PR 既定）

---

## DoD（Definition of Done）

- [ ] `mise exec -- pnpm build` 成功
- [ ] `mise exec -- pnpm typecheck` pass
- [ ] `mise exec -- pnpm lint` pass
- [ ] 新規/既存 spec all pass（`pnpm --filter web test`）
- [ ] `pnpm verify-design-tokens` green（HEX 直書き 0）
- [ ] staging deploy 後、admin 全 11 route で sidebar の active が pathname 一致のみ 1 件 highlight される
- [ ] topbar に静的「管理」が表示されない（layout 設計上 page-head が title/breadcrumb の単一所有者）
- [ ] `grep -rn '<Breadcrumb' apps/web/app/(admin)/admin/` が 0 件（Task C 完了時の合算 DoD）
- [ ] `bash scripts/verify-pr-ready.sh` green（gate-metadata:validate / verify:phase12-compliance / indexes:rebuild drift）
- [ ] PR base = `dev`

### 実装着手前に確認する現行事実
1. `GET /admin/schema/diff` の既存 response shape（`items[].status` で `unresolved` 判定可能か）
2. 既存 inline SVG strategy に合わせるための icon class / aria-hidden 方針
3. `apps/web/src/components/ui/Avatar.tsx` の props と sidebar footer で必要な最小 props
4. `safeServerFetch` の cache / no-store 方針（schema diff fetch のキャッシュ戦略）
5. プロトタイプ admin route の topbar 完全撤去（本仕様の前提）が親 workflow Phase 2 design.md と整合するか最終確認
