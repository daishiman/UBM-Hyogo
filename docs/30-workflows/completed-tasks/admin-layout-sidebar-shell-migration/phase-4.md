# Phase 4: テスト計画

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 前 Phase: 3（設計レビュー） / 次 Phase: 5（実装）
- 実装区分: **実装仕様書**（CONST_004 判定根拠は `index.md` 参照）
- 対象テストファイル: `apps/web/app/(admin)/layout.spec.tsx`（**既存ファイルを書き換える**。`__tests__/` 配下に新設しない。invariant #8: 新規 test は `*.spec.tsx` のみ）
- 検証コマンド: `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)/layout.spec.tsx`

## 目的

Phase 2/3 で確定した layout 新形（`SidebarShellServer` 委譲・guard のみ layout 保持・DOM contract 維持）を
検証するためのテストマトリクスを確定する。AC-1〜AC-10（phase-1.md 参照）を網羅し、
既存 7 ケースのうち回帰防止すべき不変点（axe critical 0 / 単独『管理』テキストなし / DOM contract）を
SidebarShell 移行後の形へ更新したうえで残す方針を明示する。

## 実行タスク

- タスク1: テストマトリクス（TC 番号 / describe・it 名 / 対象 / 期待）を確定する。
- タスク2: 既存 7 ケースのうち「維持」「更新」「削除」の区分を確定する（回帰方針）。
- タスク3: mock 構成（`next/navigation` / `getSession` / `safeServerFetch` / `SidebarShell.server`）を確定する。
- タスク4: private method テスト方針を 1 行で明記する。

## private method テスト方針【必須・1 行】

本タスクには private method は存在しない（layout は async default export の Server Component、`loadSchemaDiffCount` は移行後に削除されるローカル関数）。**全ケースを public render 経由**（`AdminLayout({ children })` を await して得た tree を `render()` し DOM を assert）で検証する。

## テストマトリクス

AC との対応を併記する。`*` は既存ケースの更新、`+` は新規追加、`=` は既存維持を示す。

| TC 番号 | describe / it 名（文字列） | 対象 | 期待 | AC | 区分 |
| --- | --- | --- | --- | --- | --- |
| TC-01 | `AdminLayout` › `未認証 (session=null) は /login?next=/admin へ redirect` | `getSession()=null` 分岐 | `AdminLayout({children})` が `REDIRECT:/login?next=/admin` を throw し、`redirect` が `"/login?next=/admin"` で呼ばれる | AC-3 | = 維持 |
| TC-02 | `AdminLayout` › `non-admin (isAdmin=false) は /login?gate=forbidden へ redirect` | `session.isAdmin=false` 分岐 | `REDIRECT:/login?gate=forbidden` を throw し、`redirect` が `"/login?gate=forbidden"` で呼ばれる | AC-4 | = 維持 |
| TC-03 | `AdminLayout` › `admin session: SidebarShell が描画され admin shell DOM contract を維持する` | admin render パス | 外側 div に `data-testid="admin-shell"` / `data-theme="cool"` / `data-route-group="admin"` / `data-shell-mode="sidebar"`、`<main data-route="admin">` が存在し、children が main 配下に mount される | AC-5/AC-7 | * 更新（旧 topbar slot assert を shell mount assert へ差し替え） |
| TC-04 | `AdminLayout` › `nav に Public 3 + Members 1 + Admin 9 = 全 13 item が表示される` | `SidebarShellServer` 経由の nav 描画 | nav 内の `<a>` href が全 13 経路（`/`, `/members`, `/register`, `/profile`, `/admin`, `/admin/dashboard/attendance`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit`）を含む | AC-5 | + 新規 |
| TC-05 | `AdminLayout` › `schemaDiffCount は queued status のみカウントされ warn badge が描画される` | `safeServerFetch("/admin/schema/diff")` ok + queued 2 / resolved 1 | schema nav（`a[href="/admin/schema"]` 周辺）に `2` が表示される | AC-6 | * 更新（mount 先が shell 内 nav へ移る） |
| TC-06 | `AdminLayout` › `safeServerFetch 失敗時は badge が表示されない (count=0)` | `safeServerFetch` が `{ ok:false }` | render 成功し、schema nav に数字が表示されない（badge 非表示） | AC-6 | * 更新 |
| TC-07 | `AdminLayout` › `layout は単独『管理』テキストを含まない` | admin render パス | 葉ノードに `textContent === "管理"` の要素が 0 件 | AC-7 回帰 | = 維持 |
| TC-08 | `AdminLayout` › `admin session render で axe critical 違反 0` | admin render パス | `axe(container).violations` の `impact === "critical"` が 0 件 | AC-7 回帰 | = 維持 |

> マトリクス上の最低 4 ケース要件（プロンプト指定）は TC-01 / TC-02 / (TC-03+TC-04) / (TC-05+TC-06) で充足する。

## 既存 7 ケースの扱い（回帰方針）

移行で DOM 構造が「layout 直下に旧 `AdminSidebar`（`data-shell="sidebar"` aside）+ user chip」から「layout 直下に `SidebarShellServer`」へ変わる。assert の維持・更新・削除を以下に固定する。

| 既存ケース（layout.spec.tsx 現行） | 移行後の扱い |
| --- | --- |
| 未認証 → `/login?next=/admin` | **維持**（TC-01）。guard は layout に残るため変化なし |
| non-admin → `/login?gate=forbidden` | **維持**（TC-02） |
| shell DOM contract（topbar slot / 固定『管理』が消えている） | **更新**（TC-03）。`data-testid="admin-shell"` 等の維持 assert は残すが、`[data-shell="sidebar"]`（旧 aside `hidden md:block`）/ `[data-shell="topbar"]` / `[data-component="admin-breadcrumb-slot"]` / `[data-component="admin-topbar-actions"]` への直接 assert は **SidebarShell 内部構造へ移譲されるため削除**し、代わりに「shell が mount され children が main 配下にある」を assert する |
| 単独『管理』テキストなし | **維持**（TC-07）。SidebarShell 移行後も layout 直下に裸の「管理」文字列を出さない契約は保つ |
| safeServerFetch 失敗時 badge なし | **更新**（TC-06）。schema link への assert 先が shell 内 nav へ移る |
| queued のみ count | **更新**（TC-05） |
| axe critical 0 | **維持**（TC-08） |

> user chip（`data-component="user-chip"` / `user-chip-name` / `user-chip-email`）への assert は **削除**する。user chip は Task B の `SidebarUserMenu` へ移譲されるため、layout.spec では検証対象としない（Task B 側 spec の責務）。

## mock 構成

既存 mock を踏襲しつつ、SidebarShell 移行に合わせて `SidebarShell.server` の mock を追加する。

| mock 対象 | 形 | 目的 |
| --- | --- | --- |
| `next/navigation` | `redirect`: `vi.fn` で `throw new Error("REDIRECT:" + url)` / `usePathname`: `vi.fn(() => "/admin")` | redirect 分岐の捕捉（既存踏襲）。`usePathname` は client nav item（Task A 内）の active 判定 seed |
| `../../src/lib/session` | `{ getSession: vi.fn() }` | session 分岐（null / isAdmin=false / admin）の制御 |
| `../../src/lib/admin/safe-server-fetch` | `{ safeServerFetch: vi.fn() }` | schemaDiffCount の ok/queued/失敗を制御 |
| `../../src/components/shell/SidebarShell.server` | `{ SidebarShellServer: ... }` の mock | **Task A 完成後に最終形を確定**。下記分岐参照 |

### `SidebarShell.server` mock の 2 通り

- **方針 A（推奨・統合寄り）**: mock せず実 `SidebarShellServer` を読む。`SidebarShellServer` が内部で `getSession` / `safeServerFetch` / nav 構成 / `SidebarUserMenu` を組むため、TC-04（全 13 item）/ TC-05/06（badge）を layout.spec で end-to-end 的に検証できる。この場合、Task A が `getSession` を内部で再度呼ぶ前提に注意し、`getSession` mock は admin を返す設定を共有する。
- **方針 B（隔離寄り）**: `SidebarShellServer` を `vi.fn` で軽量 stub にし（`({ children }) => <nav data-testid="sidebar-shell-stub">{children}</nav>`）、layout の責務（guard + DOM contract + shell へ children を渡す）のみを検証する。この場合 TC-04/05/06 は Task A 側 spec の責務へ委譲する。

> **決定（Phase 5 確定事項）**: 方針 A を第一候補とし、Task A の `SidebarShellServer` が `getSession` を内部参照する設計（phase-2.md 多角的チェック観点）であれば、layout.spec の `getSession` mock がそのまま nav 描画にも効く。Task A が props で nav 構成を受け取る形に変わっていた場合は方針 B にフォールバックし、TC-04/05/06 を Task A spec へ移す旨を Phase 5 / Phase 6 で記録する。いずれの場合も TC-01/02/03/07/08 は layout.spec に残す。

## 参照資料

- 実コード: `apps/web/app/(admin)/layout.tsx` / `apps/web/app/(admin)/layout.spec.tsx`（現行 7 ケース）
- `apps/web/src/components/layout/AdminSidebar.tsx`（移行前の nav 13 item / badge 定義の正本）
- `apps/web/src/lib/session.ts`（`SessionUser` = `{ memberId, email, name?, isAdmin }`）
- `apps/web/src/lib/admin/safe-server-fetch.ts`（`safeServerFetch<T>` の戻り `SafeResult<T>`）
- phase-1.md（AC-1〜AC-10） / phase-2.md（layout 新形・契約境界） / phase-3.md（NO-GO / MINOR）

## 実行手順

### ステップ1: マトリクス確定（完了・上表）

### ステップ2: 既存ケースの維持・更新・削除区分の確定（完了・上表）

### ステップ3: mock 構成の確定（完了・上記）

Task A の `SidebarShellServer` props 確定後、mock 方針 A/B を Phase 5 着手時に最終決定する。

### ステップ4: テストデータの固定

- admin session: `{ memberId:"m1", email:"admin@example.com", name:"管理太郎", isAdmin:true }`
- non-admin session: `{ memberId:"m1", email:"a@b", isAdmin:false }`
- queued ケース: `{ ok:true, data:{ total:3, items:[{status:"queued"},{status:"queued"},{status:"resolved"}] } }`
- fetch 失敗: `{ ok:false, error:{ code:"ADMIN_FETCH_FAILED", message:"boom" } }`

## 統合テスト連携

- 検証は `apps/web/app/(admin)/layout.spec.tsx`（既存書き換え）に集約する。新規 `__tests__/` は作らない（invariant #8）。
- 旧 `AdminSidebar.spec.tsx` / `AdminSidebar.component.spec.tsx` / `AdminSidebarNavItem.spec.tsx` が cover していた nav 描画・active 判定・badge の検証責務は、移行後は Task A 側 spec（`SidebarShell.server.spec.tsx` 等）と本 layout.spec の TC-04/05/06 が引き継ぐ。本タスクではこれら 3 spec を削除（Phase 5）し、layout.spec / Task A spec へ責務を集約する。

## 多角的チェック観点（AIが判断）

- placeholder（`x-pathname` / `getSchemaDiffCount`）を mock や assert に持ち込まない。`usePathname()` と `safeServerFetch("/admin/schema/diff")` のみが実在経路。
- redirect は throw で捕捉する（`rejects.toThrow`）。render 後の assert と混在させない。
- DOM contract assert は「維持すべき属性」と「shell 内部へ移譲され削除する assert」を明確に分ける（TC-03）。
- TC-04 の 13 item は href 集合で検証し、ラベル文字列の完全一致に依存しすぎない（i18n / 文言調整に頑健にする）。

## サブタスク管理

- 単一責務。サブタスク分割なし。

## 成果物

- 本 Phase: テストマトリクス（TC-01〜08）/ 既存ケース区分表 / mock 構成（本ファイル）。

## 完了条件

- [ ] TC-01〜TC-08 を describe/it 名・対象・期待・AC 対応付きで定義した
- [ ] 最低 4 ケース要件（null redirect / non-admin redirect / shell+13 item / schemaDiff badge ok・fail）を網羅した
- [ ] 既存 7 ケースの維持・更新・削除区分を確定した（回帰方針）
- [ ] mock 構成（`next/navigation` / `getSession` / `safeServerFetch` / `SidebarShell.server` 方針 A/B）を定義した
- [ ] private method テスト方針（public render 経由）を 1 行で明記した

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] AC-1〜AC-10 のうち本 Phase で検証可能な AC（3/4/5/6/7/8）をマトリクスにマップした
- [ ] 既存契約（`/login?next=/admin` / axe critical 0 / 単独『管理』なし）を回帰させない方針を明記した

## 次Phase

Phase 5（実装）。
