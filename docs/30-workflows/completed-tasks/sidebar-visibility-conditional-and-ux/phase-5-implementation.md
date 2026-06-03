# Phase 5: 実装手順

> 本 Phase は Phase 1 要件（FR-1〜5 / AC-1〜9 / T1〜T3）と Phase 2 設計（route topology / SSR active / shell UX）を **後続実装者がそのまま着手できる実行ステップ** へ展開する（CONST_005 準拠）。
> 依存 shell primitive（`apps/web/src/components/shell/`）は dev マージ済み（Task A/B/C/E）であることが着手前提。本件はその上の差分修正である。

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 入力 | Phase 1（要件） / Phase 2（設計） |
| 出力 | 影響ファイル一覧・step by step 手順・最終シグネチャ・grep 機械確認・DoD |
| 実装区分 | 実装仕様書（route topology / middleware / shell component のコード変更を伴う） |
| 実装作業 | T1（route topology）/ T2（SSR active）/ T3（shell UX）。全て 1 サイクル内 |

## 0. 前提（着手チェック）

```bash
# 依存 shell primitive の存在確認（不在なら本件は着手不可。先に Task A/B/C/E を確認）
ls apps/web/src/components/shell/SidebarShell.server.tsx \
   apps/web/src/components/shell/SidebarMobileTrigger.tsx \
   apps/web/src/components/shell/SidebarUserMenu.tsx \
   apps/web/src/components/shell/SidebarUserAvatar.tsx \
   apps/web/src/components/shell/SidebarNavItem.tsx \
   apps/web/src/components/shell/shell-config.ts \
   apps/web/src/components/shell/user-menu-config.ts

# 移動対象（login dir）の現状確認
ls "apps/web/app/(public)/login"

# worktree 直後の依存・esbuild 整合（不変条件: worktree ごとに node_modules 独立）
mise exec -- pnpm install
mise exec -- pnpm verify:vitest-runtime
```

- 着手前提（Phase 1 P50）: current branch に本実装は存在せず（new）、dev/main は 0 behind。`docs/sidebar-visibility-conditional-and-ux-spec` 系の実装ブランチで着手する。
- 依存 primitive は **mount / 分岐拡張するだけ**で新規 primitive を増やさない（NFR-3 / UI alignment #3）。

## 1. 影響ファイル一覧（RT-03 / 見落とし防止）

> login dir の実ファイル列挙は `find "apps/web/app/(public)/login" -type f` の結果に基づく（着手前に再実行して差分が無いことを確認）。現状ファイル: `page.tsx` / `error.tsx` / `error.spec.tsx` / `loading.tsx` / `loading.spec.tsx` / `__tests__/page.spec.tsx` / `__tests__/error.component.spec.tsx` / `_components/{GoogleOAuthButton.client,MagicLinkForm.client,LoginPanel.client,OrDivider,LoginCard,LoginShell,LoginStatus}.tsx` / `_components/MagicLinkForm.component.spec.tsx` / `_components/__tests__/{LoginCard,LoginPanel}.component.spec.tsx`。

### 1.1 新規作成

| ファイル | 内容 |
| --- | --- |
| `apps/web/app/(auth)/layout.tsx` | bare layout（shell 無し）。`data-route-group="auth"` / `data-shell-mode="bare"` / `data-testid="auth-shell"`。`SidebarShellServer` / `SidebarMobileTrigger` を import しない（AC-2） |
| `apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts` | invariant: `(auth)/layout.tsx` が `SidebarShellServer` を import しない / login が `(auth)` 配下に存在する（静的 source grep ベース・AC-8） |

### 1.2 修正

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/middleware.ts` | 共通 request header 設定部（`requestHeaders.set("x-nonce", nonce)` 付近）に `requestHeaders.set("x-pathname", req.nextUrl.pathname)` を 1 行追加（T2 / AC-4） |
| `apps/web/app/(admin)/layout.tsx` | `activePath="/admin"` ハードコードを撤廃し、`headers()` から `x-pathname` を読み `activePath={pathname}` に（T2 / AC-5）。`headers` import 追加 |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | viewer 分岐で「ゲスト / 未ログイン」表記 + ログイン CTA を primary tone・`data-shell-block="login-cta"` で描画（T3 / FR-4 / AC-6） |
| `apps/web/src/components/shell/SidebarUserAvatar.tsx` | viewer variant（ゲスト表現アイコン）を追加。viewer は initials の代わりにゲスト記号、admin badge dot は admin 専用のまま（T3 / AC-6） |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | active 視認性・badge tone の**確認とハードニング**（既に `aria-current="page"` / `data-active` / token active style / collapsed badge sr-only を持つ。collapsed 時の active 識別性と badge dot 縮約を検証し、不足があれば token で補強）（T3 / FR-5 / AC-7） |
| `apps/web/app/(member)/profile/page.tsx` 系 | **変更不要見込み**（shell は layout が所有・既に統合済み）。grep 確認のみ |
| `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` | §1.6 の route→shell マトリクスに `(auth)`=bare（login=shell外）を反映（AC-8 / Step 9） |

### 1.3 移動（`git mv`・URL 不変）

| from | to | 備考 |
| --- | --- | --- |
| `apps/web/app/(public)/login` | `apps/web/app/(auth)/login` | dir ごと移動。`/login` の URL は不変（route group `()` は URL 非寄与）。`page.tsx` / `error.tsx` / `error.spec.tsx` / `loading.tsx` / `loading.spec.tsx` / `__tests__/` / `_components/`（配下 `__tests__/` 含む）を一括移動 |

> **import 深度が不変である根拠（機械確認済み）**: 移動前 `app/(public)/login/<x>` と移動後 `app/(auth)/login/<x>` は **同一階層深度**（`app/<group>/login/<x>`）。実際の login dir の `src/` 相対 import は `page.tsx` / `error.tsx` が `../../../src/`、`_components/*` が `../../../../src/`、各 `__tests__/*` が `../../../../src/` で、いずれも group 名のみが変わり段数は変化しない。dir 内相対（`./_components/...` / `../page` / `../error` / `../LoginCard` / `../LoginPanel.client`）も dir ごと移動のため不変。**ただし移動後に Step 2 の grep で機械確認すること**（補正漏れ 0 を保証してから次へ進む）。

### 1.4 削除（`git rm`）

| ファイル | 理由 |
| --- | --- |
| （なし） | T1 は **移動**であり削除は発生しない。`(public)/login` dir は `git mv` により消える（= 旧 path の物理消滅）。旧 component の git delete は本件のスコープ外（Task C で完了済み） |

> 旧 `(public)/login` への live import / path 参照が残れば FAIL（Step 5 grep / Phase 9 削除確認で判定）。

## 2. ステップ by ステップ手順

### Step 1: login dir を `(auth)` group へ移動（`git mv`）

```bash
# (auth) group dir は git mv が親ごと作成する。事前 mkdir 不要。
git mv "apps/web/app/(public)/login" "apps/web/app/(auth)/login"
```

- dir ごと移動するため、dir 内相対 import（`./_components/...` / `../page` / `../error` / `../LoginCard` / `../LoginPanel.client` / `../MagicLinkForm.client` 等）は不変。
- `git mv` で履歴を保つ。route group `()` は URL セグメントに含まれないため `/login` の URL・既存 redirect / query 契約は不変（AC-3）。

### Step 2: 移動後 import grep 確認（深度不変の機械検証）

route group 名が変わるだけで階層深度は変わらない見込みだが、**必ず grep で破壊が無いことを確認**してから次へ進む。

```bash
# (a) 移動先の src 相対 import 段数が移動前と一致しているか目視（page/error=../../../src/、_components/*・__tests__/*=../../../../src/）
grep -rn 'from "\.\./\(\.\./\)*src/' "apps/web/app/(auth)/login"

# (b) 旧 path 参照（live import / config / smoke / harness）が 0 件か
grep -rn 'app/(public)/login\|app/login' apps/web/ --include="*.ts" --include="*.tsx" | grep -v node_modules || echo "OK: no stale (public)/login refs"

# (c) typecheck で import 解決を最終保証（深度補正漏れがあればここで失敗）
mise exec -- pnpm typecheck
```

- 万一 typecheck が import 解決で失敗した場合のみ、該当ファイルの `../...src/` 段数を `+1` / `-1` 調整する（設計上は発生しない想定）。
- URL 参照（`href="/login"` / `redirect("/login...")` / middleware の `url.pathname = "/login"`）は **修正不要**（URL 不変）。

### Step 3: `(auth)/layout.tsx`（bare layout）を新規作成

```tsx
// apps/web/app/(auth)/layout.tsx — bare（shell なし）。認証導線の二重化を避ける（09h §1.6）。
// SidebarShellServer / SidebarMobileTrigger を import しない（AC-2）。
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div
      data-theme="warm"
      data-route-group="auth"
      data-shell-mode="bare"
      data-testid="auth-shell"
    >
      {children}
    </div>
  );
}
```

- `data-shell-mode="bare"` で「shell を被らない」ことを DOM 契約として宣言。
- `LoginShell`（`<main className="auth-shell" data-route="login">`）は移動後もそのまま使用（既存 auth-shell スタイルを再利用）。
- root layout（`app/layout.tsx`）は変更しない（既に bare = html/body/ToastProvider のみ）。

### Step 4: `middleware.ts` に `x-pathname` 注入（T2 / AC-4）

共通 request header 設定部（`guardedMiddleware` 呼出前）に 1 行追加する。guard 判定・redirect レスポンスには影響させない。

```ts
// apps/web/middleware.ts — export async function middleware(req) 内
const requestHeaders = new Headers(req.headers);
requestHeaders.set("x-nonce", nonce);
requestHeaders.set("x-pathname", req.nextUrl.pathname); // ← 追加（T2 / AC-4）
requestHeaders.set("Content-Security-Policy", csp);

const response = await guardedMiddleware(req, requestHeaders);
```

- `x-pathname` は `nextWithRequestHeaders(requestHeaders)` 経路（guarded / unguarded 双方）で request に乗る。redirect（`NextResponse.redirect`）には付与しない（redirect は header 不要）。
- `req.nextUrl.pathname` は query を含まないため active 判定に過不足ない。
- middleware matcher（`/((?!_next/static|_next/image|favicon.ico).*)`）は全 app route を網羅するため、全 layout の `x-pathname` が正確化される。

### Step 5: `(admin)/layout.tsx` の activePath を `x-pathname` から解決（T2 / AC-5）

```tsx
// apps/web/app/(admin)/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers"; // ← 追加

import { getSession } from "../../src/lib/session";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin"); // 不変条件 #11 二段防御（不変）
  if (!session.isAdmin) redirect("/login?gate=forbidden"); // fail-closed（不変）

  const pathname = (await headers()).get("x-pathname") ?? "/admin"; // ← ハードコード撤廃

  return (
    <div
      className="ubm-admin-shell min-h-screen bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-testid="admin-shell"
      data-theme="cool"
      data-route-group="admin"
      data-auth-state="admin"
      data-shell-mode="sidebar"
    >
      <SidebarShellServer
        activePath={pathname} {/* ← "/admin" 固定から x-pathname へ */}
        mobileTriggerSlot={<SidebarMobileTrigger />}
        routeKey="admin"
        sectionRhythm="compact"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarShellServer>
    </div>
  );
}
```

- **不変条件 #11 二段防御を壊さない**: `getSession()` → `!session` / `!session.isAdmin` の redirect guard は順序・内容とも不変。`x-pathname` 読込は guard 通過後に行う。
- `(public)/layout.tsx` / `(member)/layout.tsx` は既に `headers().get("x-pathname") ?? fallback` を読むため **変更不要**（Step 4 の注入で自動的に正確化される）。fallback はそのまま保持（middleware 未経由経路の保険）。

### Step 6: `SidebarUserMenu.tsx` の viewer 分岐強化（T3 / FR-4 / AC-6）

viewer のとき identity を「ゲスト / 未ログイン」と明示し、ログイン CTA を primary tone・`data-shell-block="login-cta"` で描画する。member / admin の `<details>` popover 経路は不変。

設計方針（既存構造への分岐追加）:
- `role === "viewer"` のとき、`<details>` popover ではなく **CTA ブロック**を描画する（viewer の唯一 action は `LOGIN`。popover を開く意味が無く、1 クリックでログインへ誘導する方が UX 良）。
- displayName を `"ゲスト"`、サブラベルを `"未ログイン"` 固定にする（`user` は viewer では `null`）。
- CTA は `next/link` で `href="/login"`（`buildUserMenuActions("viewer")` が返す `LOGIN.href` を利用）、primary tone は token クラス（`bg-[var(--ubm-color-accent)]` 系の既存 primary 表現 = `ui-button` primary か token 直）で表現。**HEX / `bg-[#xxx]` 禁止**。
- collapsed 時は CTA を icon + `sr-only` ラベルへ縮約。

実装スケッチ（viewer 早期 return を分岐の冒頭に追加）:

```tsx
// apps/web/src/components/shell/SidebarUserMenu.tsx 内、return 前に viewer 分岐
if (role === "viewer") {
  return (
    <div
      data-shell-block="user-menu"
      data-role="viewer"
      className="border-t border-[var(--shell-bar-border)] pt-2"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <SidebarUserAvatar initials="" role="viewer" size="md" />
        <span className={collapsed ? "sr-only" : "flex min-w-0 flex-col leading-tight"}>
          <span className="truncate text-sm font-medium text-[var(--ubm-color-text-primary)]">ゲスト</span>
          <span className="truncate text-xs text-[var(--ubm-color-text-secondary)]">未ログイン</span>
        </span>
      </div>
      <Link
        href="/login"
        data-shell-block="login-cta"
        data-action="login"
        className="mt-1 flex items-center justify-center gap-2 rounded-sm bg-[var(--ubm-color-accent)] px-3 py-2 text-sm font-semibold text-[var(--ubm-color-accent-contrast)] hover:bg-[var(--ubm-color-accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
      >
        <ShellIcon id="login-cta-icon-or-existing" /> {/* 既存 icon set に無ければ icon 無しでも可。新規 primitive は増やさない */}
        <span className={collapsed ? "sr-only" : undefined}>ログイン</span>
      </Link>
    </div>
  );
}
```

> token 名（`--ubm-color-accent-contrast` / `--ubm-color-accent-strong`）は `apps/web/src/styles/tokens.css` の実在 token に合わせること（未定義なら `--ubm-color-accent-ink` / `--shell-active-bg` 等の既存 token で代替）。実装前に `grep -n "ubm-color-accent" apps/web/src/styles/tokens.css` で実在 token を確認する。icon は既存 `ShellIcon` の id 集合に無ければ付与しない（新規 primitive を生やさない）。

### Step 7: `SidebarUserAvatar.tsx` の viewer variant 追加（T3 / AC-6）

viewer のとき initials の代わりにゲスト表現（中立アイコン / `?` ではなくゲスト記号）を表示し、メンバー風 initials 円との誤認を解消する。admin badge dot は admin 専用のまま不変。

```tsx
// apps/web/src/components/shell/SidebarUserAvatar.tsx
export function SidebarUserAvatar({ initials, role, size = "md" }: SidebarUserAvatarProps) {
  const dimension = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const isGuest = role === "viewer";
  return (
    <span
      data-shell-block="user-avatar"
      data-role={role === "admin" ? "admin" : role === "viewer" ? "viewer" : undefined}
      className="relative inline-flex shrink-0"
    >
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center rounded-full border border-[var(--ubm-color-border-default)] ${
          isGuest
            ? "bg-[var(--ubm-color-surface-muted)] text-[var(--ubm-color-text-secondary)]"
            : "bg-[var(--ubm-color-accent-soft)] text-[var(--ubm-color-accent-ink)] font-semibold"
        } ${dimension}`}
      >
        {isGuest ? <ShellIcon id="guest-or-profile" /> : initials || "?"} {/* ゲストアイコン or 中立記号 */}
      </span>
      {role === "admin" ? (
        <span
          data-shell-block="user-avatar-admin-badge"
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 inline-block h-2.5 w-2.5 rounded-full border border-[var(--ubm-color-surface-panel)] bg-[var(--ubm-color-accent)]"
        />
      ) : null}
    </span>
  );
}
```

> ゲストアイコンは既存 `ShellIcon`（`./icons`）に適当な id があれば利用、無ければゲスト表現の中立文字（例: 「視」/「客」ではなく汎用 person 記号）で代替し、**新規 icon primitive を生やさない**。token は `tokens.css` 実在分のみ（`--ubm-color-surface-muted` 等が無ければ `--ubm-color-surface-panel` で代替）。

### Step 8: `SidebarNavItem.tsx` の active / badge 視認性の確認・ハードニング（T3 / FR-5 / AC-7）

> **現状確認（実コード）**: `SidebarNavItem.tsx` は既に (a) `aria-current={active ? "page" : undefined}`、(b) `data-active`、(c) `data-[active=true]:bg-[var(--shell-active-bg)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent-ink)]` の token active style、(d) badge を `Chip tone` で描画し collapsed 時に `sr-only` で数値を隠す実装を持つ。**T3 のこの部分は主に検証 + collapsed 視認性の補強であり、ゼロからの新規追加ではない。**

確認・補強項目:
- **collapsed 時の active 識別性**: collapsed では label が `sr-only` になり背景 active 色のみで識別する。背景 active 色だけでは弱い場合、左 accent border（token `--ubm-color-accent`）を `data-[active=true]:border-l-2` 等で補強し、collapsed でも active が一目で分かるようにする（HEX 禁止・token のみ）。
- **admin schema badge の collapsed dot**: `item.badge.tone="warn"`（`buildAdminGroup` が schemaDiffCount>0 で付与）を collapsed 時は数値非表示の dot に縮約する。現状は `Chip` 内 `<span className={collapsed ? "sr-only" : undefined}>{count}</span>` で数値を隠すが、Chip 自体が dot に見えるか確認し、必要なら collapsed 時の Chip を小型 dot 表現へ調整する。
- いずれも token のみ。新規 primitive・新規 Chip variant は増やさない（既存 `Chip tone="warning"` を利用）。

### Step 9: 09h spec の表示条件マトリクス反映（AC-8）

`docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` §1.6（route→shell）に Phase 2 §1.4 のマトリクスを反映する:

| route group | route | shell | サイドバー |
|-------------|-------|-------|-----------|
| `(auth)` | `/login` | **bare** | **非表示** |
| `(public)` | `/`・`/members`・`/members/[id]`・`/register`・`/privacy`・`/terms` | SidebarShell | 表示（viewer=PUBLIC のみ） |
| `(member)` | `/profile` | SidebarShell | 表示（PUBLIC+MEMBERS[+ADMIN]） |
| `(admin)` | `/admin`・`/admin/{...}` | SidebarShell | 表示（PUBLIC+MEMBERS+ADMIN） |

- 「`/login` は shell 外 bare」を正本仕様として明記（実装が正本へ一致＝spec drift 解消）。
- §1.7（実装出典）に本ワークフローと `(auth)/layout.tsx` を追記。

### Step 10: spec / test の追加・更新（Phase 4 ケース反映）

- **新規** `apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts`: source を読み (a) `(auth)/layout.tsx` が `SidebarShellServer` / `SidebarMobileTrigger` を import しない、(b) `app/(auth)/login/page.tsx` が存在する、(c) `app/(public)/login` が存在しない、を静的に assert（AC-2 / AC-8 invariant）。
- **移動** `apps/web/app/(auth)/login/__tests__/page.spec.tsx`: 移動に伴い import 解決のみ（深度不変なら本文不変）。login render DOM に `data-testid="public-shell"` / `aside` が無いこと（AC-1）を確認するケースを追加。
- **middleware spec**（新規 or 拡張） `apps/web/src/__tests__/middleware-x-pathname.spec.ts` もしくは `apps/web/middleware.spec.ts`: 全 request の request header に `x-pathname = req.nextUrl.pathname` が設定されること（AC-4）。redirect 経路では付与されないことを確認。
- **更新** `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx`: `role="viewer"` で「ゲスト」「未ログイン」表記と `data-shell-block="login-cta"`（href=/login）が描画されること（AC-6）。
- **更新** `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`: active item の `aria-current="page"` と active token style（`data-active="true"`）、collapsed 時の active 識別・badge dot 縮約（AC-7）。
- **回帰** `apps/web/src/components/shell/__tests__/shell-config.spec.ts`: `buildNavForRole` / `isNavItemActive` 既存ケース green を維持。

## 3. 各ファイルの最終関数シグネチャ

| ファイル | シグネチャ |
| --- | --- |
| `app/(auth)/layout.tsx` | `export default function AuthLayout({ children }: { readonly children: ReactNode }): JSX.Element` |
| `app/(admin)/layout.tsx` | `export default async function AdminLayout({ children }: { readonly children: ReactNode })`（戻り型は既存維持。`headers()` 読込追加） |
| `middleware.ts` | `export async function middleware(req: NextRequest)`（シグネチャ不変。本文に 1 行追加のみ） |
| `SidebarUserMenu.tsx` | `export function SidebarUserMenu({ role, user, collapsed }: SidebarUserMenuProps)`（props 不変。viewer 分岐 return を追加） |
| `SidebarUserAvatar.tsx` | `export function SidebarUserAvatar({ initials, role, size = "md" }: SidebarUserAvatarProps)`（props 不変。viewer variant 分岐を追加） |
| `SidebarNavItem.tsx` | `export function SidebarNavItem({ item, collapsed, activePath }: SidebarNavItemProps)`（props 不変。className / 構造の補強のみ） |

## 4. 入出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `middleware`: `NextRequest`（`req.nextUrl.pathname`）。`(admin)/layout`: `headers()`（`x-pathname` or `/admin` fallback）+ `getSession()`。shell component: props（role / user / collapsed） |
| 出力 | `(auth)/layout`: bare DOM（`data-shell-mode="bare"`）。`middleware`: request header に `x-pathname` 付与。shell component: role 別 DOM |
| 副作用 | **API call / D1 アクセス / Google Form schema 変更なし**（NFR-1 / 不変条件 #1・#5）。middleware の guard / redirect 挙動・auth 二段防御は不変（不変条件 #11） |
| エラー | `(admin)` guard 失敗は従来通り redirect（fail-closed・不変条件 #11）。shell の role 解決失敗は `SidebarShellServer` 内部で viewer fallback（fail-open・不変）。`(auth)/layout` は純 JSX で throw しない |

## 5. grep 機械確認チェックリスト

```bash
# (1) 移動後の src 相対 import 段数が一致（破壊なし）— page/error=../../../src/、_components・__tests__=../../../../src/
grep -rn 'from "\.\./\(\.\./\)*src/' "apps/web/app/(auth)/login"

# (2) 旧 path 参照 0（live import / config / smoke / harness）
grep -rn 'app/(public)/login\|app/login' apps/web/ --include="*.ts" --include="*.tsx" | grep -v node_modules || echo "OK: stale login path refs 0"

# (3) (auth)/layout に SidebarShellServer / SidebarMobileTrigger が import されていない（AC-2）
grep -n "SidebarShellServer\|SidebarMobileTrigger" "apps/web/app/(auth)/layout.tsx" && echo "FAIL: shell import 残存" || echo "OK: (auth) layout に shell import 0"

# (4) HEX 直書き / bg-[#xxx] / text-[#xxx] が本件変更ファイルに 0（NFR-2 / verify-design-tokens）
grep -rnE '#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#' \
  "apps/web/app/(auth)/layout.tsx" \
  "apps/web/src/components/shell/SidebarUserMenu.tsx" \
  "apps/web/src/components/shell/SidebarUserAvatar.tsx" \
  "apps/web/src/components/shell/SidebarNavItem.tsx" \
  "apps/web/app/(admin)/layout.tsx" || echo "OK: HEX 0"

# (5) middleware に x-pathname 注入が入った（AC-4）
grep -n 'requestHeaders.set("x-pathname"' apps/web/middleware.ts && echo "OK: x-pathname 注入あり" || echo "FAIL: x-pathname 未注入"

# (6) (admin)/layout の activePath ハードコード撤廃（AC-5）
grep -n 'activePath="/admin"' "apps/web/app/(admin)/layout.tsx" && echo "FAIL: ハードコード残存" || echo "OK: activePath ハードコード撤廃"

# (7) viewer CTA が描画される（AC-6）
grep -n 'data-shell-block="login-cta"' "apps/web/src/components/shell/SidebarUserMenu.tsx" && echo "OK: login-cta あり" || echo "FAIL: login-cta 無し"
```

## 6. ローカル検証コマンド + DoD

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts \
  "apps/web/app/(auth)" \
  "apps/web/src/components/shell" \
  "apps/web/src/__tests__"
```

### Definition of Done

- [ ] `mise exec -- pnpm typecheck` green（移動後 import 解決 / `(admin)` の `headers()` 追加 OK）
- [ ] `mise exec -- pnpm lint` green
- [ ] focused test（`(auth)` / `src/components/shell` / `src/__tests__`）green（route-topology invariant / middleware x-pathname / viewer CTA / active aria-current 全ケース）
- [ ] grep (1)〜(7) が全て期待結果（HEX 0 / 旧 path 参照 0 / (auth) に shell import 0 / x-pathname 注入あり / activePath ハードコード撤廃 / login-cta あり）
- [ ] `/login` render DOM に `data-testid="public-shell"` / `aside`（サイドバー）が存在しない（AC-1）
- [ ] `app/(auth)/login/page.tsx` が存在し `app/(public)/login` が消えている（`git status` に rename `R` が出る）（AC-2）
- [ ] URL 不変: `/login`（route group `()` は URL 非寄与）。既存 login query / redirect テスト green（AC-3）
- [ ] middleware が全 request に `x-pathname` を注入（AC-4）/ `(admin)` が x-pathname から activePath 解決（AC-5）
- [ ] viewer=ゲスト表記 + ログイン CTA、member/admin と視覚区別（AC-6）/ active item の `aria-current="page"` + 視認 style（AC-7）
- [ ] 09h §1.6 に `(auth)`=bare（login=shell外）マトリクスと invariant test が反映（AC-8）
- [ ] 不変条件 #5（D1 直アクセスなし）/ #11（admin guard 二段防御不変）を壊していない

> 実コード実装・direct focused tests・typecheck・lint・local screenshot 4 PNG は本サイクルで完了済み。admin/staging screenshot・staging visual baseline・commit・push・PR は user-gated Gate-C（VISUAL タスクだが admin screenshot は staging 認証必須のため capture 計画と canonical 名を確定し、取得は user-gated に分離）。

## 参照資料

- Phase 1（要件定義）: FR-1〜5 / AC-1〜9 / T1〜T3 / targeted test ファイルリスト
- Phase 2（設計）: route topology §1 / SSR active §2 / shell UX §3 / 状態所有権 §2.3
- 正本仕様: `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`（§1.2 / §1.6 / §1.7）
- デザイントークン: `docs/00-getting-started-manual/specs/09b-design-tokens.md` / `apps/web/src/styles/tokens.css`
- 着手前状態: `apps/web/middleware.ts` / `apps/web/app/(admin)/layout.tsx` / `apps/web/app/(public)/layout.tsx` / `apps/web/app/(member)/layout.tsx` / `apps/web/app/(public)/login/page.tsx` / `apps/web/src/components/shell/{SidebarUserMenu,SidebarUserAvatar,SidebarNavItem,SidebarShell.server,shell-config,user-menu-config}.tsx`
- 参考粒度: `docs/30-workflows/task-c-public-member-sidebar-shell-integration/phase-5-implementation.md`

## 完了条件

- [x] 着手前提（前提チェック）を明記した
- [x] 影響ファイル一覧（新規 / 修正 / 移動 / 削除）をパスと変更種別で漏れなく列挙した（RT-03）
- [x] Step 1〜10 を対象ファイルパス・差分方針・コード断片（関数シグネチャ）付きで展開した
- [x] 各ファイルの最終関数シグネチャ・入出力・副作用を明記した
- [x] grep 機械確認チェックリスト（移動 import 破壊なし / 旧 path 0 / HEX 0 / (auth) に shell 無し）を用意した
- [x] ローカル検証コマンドと Definition of Done（AC-1〜9 充足）を定義した
