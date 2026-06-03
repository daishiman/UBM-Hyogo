# Implementation Guide — サイドバー表示条件の正本化 + SSR active 正確化 + viewer/active UX

## Part 1: 中学生にもわかる説明（なぜ・なに）

### なぜこれが必要なのか

お店にたとえてみます。お店には「会員さん専用の案内コーナー（左側のメニュー）」があります。
本来このコーナーは、**お店に入って会員カードを見せた人**のために出すものです。

ところが今のアプリでは、**まだログインしていない「入口（ログイン画面）」にも、この会員向け案内コーナーが
出てしまっています**。これは「店の外（受付の前）に、店内用の案内板を置いてしまっている」ようなもので、
お客さんは「あれ、もう入店しているのかな？ログインって必要なの？」と混乱します。入口（ログイン）の案内と、
店内の案内が二重になってしまうのです。

さらに 2 つ、見ていて気持ちよくない点があります。

1. ログインしていない人（ゲスト）にも案内コーナーが「会員さんっぽい見た目」で出るので、
   自分がログインしているのかしていないのか分かりにくい。
2. 今いるページがメニューのどこなのか、最初の表示で正しく光らない（少し遅れてから正しい場所が光る）。
   たとえば「会員一覧」ページにいるのに、最初は「ダッシュボード」が光っていて、一瞬してから直る、という具合です。

### 何をするか（たとえ話で）

- **入口（ログイン画面）からは会員向け案内コーナーを外す**。入口は「ログインしてね」だけのシンプルな画面にします。
  これで「もう入店済み？」という勘違いがなくなります。
- どの画面で案内コーナーを出すか／出さないかを、**フォルダの置き場所（部屋の名前）だけで決める**ようにします。
  入口だけ `(auth)`（＝認証）という別の部屋に引っ越しさせ、その部屋には案内コーナーを置きません。
  引っ越しても住所（URL `/login`）は変わりません。Next.js の `(かっこ)` 付きフォルダは住所に出ないからです。
- ゲスト（未ログイン）には案内コーナーの名札を **「ゲスト（未ログイン）」とはっきり書き、「ログイン」ボタンを目立たせ**ます。
  これで自分が今どっちの状態か一目で分かります。
- 今いるページが**最初からきちんと光る**ようにします。受付の人（middleware）が「今どのページにいるか」のメモを
  渡してくれるので、表示の最初から正しい場所が光ります。

### 今回作ったもの

- `/login` 専用の bare route group `(auth)` と、shell を被せない `AuthLayout`。
- middleware から layout へ現在の pathname を渡す `x-pathname` request header。
- viewer を「ゲスト / 未ログイン」として見せる user menu とログイン CTA。
- active nav / schema badge の視認性補強と、それらを固定する direct focused tests。

### たとえば、こうなる

- 変更前: ログイン画面にも会員向け案内コーナーが出ていて、ログイン済みかどうか分かりにくい。
- 変更後: ログイン画面は案内コーナー無しのスッキリした入口。ゲストには「ゲスト＋ログインボタン」、
  会員には今いるページが最初から正しく光る案内コーナーが出る。住所（URL）はどれも変わらない。

## Part 2: 技術者向け解説（実装の事実）

> 本サイクルは **`implemented_local_evidence_captured`**。実コード・direct focused Vitest・typecheck・lint・grep gate と
> 認証不要ルートの local pixel screenshot 4 PNG は完了済み。
> admin/staging screenshot・staging visual baseline・commit/PR は user-gated に残す。識別子は実コードを grep 確認して引用している。

### 概要

3 つの単一責務タスクで構成し、同一サイクル内で実装した（Phase 1 T1〜T3・CONST_007）:

- **T1 route topology**: `/login` を `(public)` から `(auth)` route group へ移動し bare 化。表示条件マトリクスを
  09h §1.6 へ明示し、login=shell 外を保証する invariant test を追加した。
- **T2 SSR active**: `middleware.ts` が全 request に `x-pathname` request header を注入し、各 route group layout が
  `activePath` として渡す。`(admin)/layout.tsx` の `activePath="/admin"` ハードコードを撤廃した。
- **T3 shell UX**: viewer（ゲスト）identity 表記 + ログイン CTA、active nav item の `aria-current="page"` と視認性、
  admin schema badge の視認性を、既存 shell primitive の分岐強化で実現した（新規 primitive ゼロ）。

### route group トポロジ（T1・Phase 2 §1.1 から引用）

```
変更前                                    変更後
app/(public)/login/page.tsx (shell が被る)   app/(auth)/login/page.tsx (shell 無し)
app/(public)/layout.tsx (shell)             app/(auth)/layout.tsx (新規 bare layout)
                                            app/(public)/layout.tsx (shell, 不変)
```

- 移動元は着手前に実在確認済み: `apps/web/app/(public)/login/page.tsx`。現在の移動先は `apps/web/app/(auth)/login/page.tsx`。
- `(public)/login` と `(auth)/login` は同一階層深度（`app/<group>/login/`）のため相対 import は不変。移動後に direct focused tests / grep gate で機械確認した（MINOR-1）。
- route group `()` は URL セグメントに含まれないため `/login` の URL・redirect / query 契約は不変（AC-3）。

```tsx
// apps/web/app/(auth)/layout.tsx — bare（shell なし）。認証導線の二重化を避ける（09h §1.6）。
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div data-theme="warm" data-route-group="auth" data-shell-mode="bare" data-testid="auth-shell">
      {children}
    </div>
  );
}
```

- `SidebarShellServer`（`apps/web/src/components/shell/SidebarShell.server.tsx`）を **import しない**（AC-2）。
- `data-shell-mode="bare"` を DOM 契約として宣言。`(public)/(member)/(admin)` 側は既存の `data-shell-mode="sidebar"` 維持。

### middleware x-pathname 契約（T2・実コード確認済み）

`apps/web/middleware.ts` は request header に `x-nonce` / `Content-Security-Policy` とあわせて
`x-pathname` を注入する。全 request が通る request header 経路へ 1 行追加済み。

| 対象 | Before | After |
| --- | --- | --- |
| `middleware.ts` | `requestHeaders.set("x-nonce", nonce)` のみ | 加えて `requestHeaders.set("x-pathname", req.nextUrl.pathname)` を guard 判定より前の共通ヘッダー設定として付与 |
| `(admin)/layout.tsx` | `activePath="/admin"`（ハードコード・実コード `apps/web/app/(admin)/layout.tsx:37` 確認済み） | `const pathname = (await headers()).get("x-pathname") ?? "/admin"; ... activePath={pathname}` |
| `(public)` / `(member)` | `headers().get("x-pathname") ?? fallback`（既存・注入で自動正確化） | 変更不要 |

- `x-pathname` 注入は guard（admin/profile redirect）より前の共通ヘッダー設定として行い、**redirect レスポンスには付与しない**
  （MINOR-2）。`req.nextUrl.pathname` は query を含まないため active 判定に過不足ない。
- auth guard ロジック・redirect 契約は不変（不変条件 #11 fail-closed を壊さない・AC-4）。

### shell role 分岐（T3・実コード確認済み）

role は `SidebarShell.server.tsx` の `resolveRole(session: SessionUser | null): ShellRole`（実コード `:12` 確認済み）が
`getSession()` 結果から判定し（fail-open: viewer fallback）、`buildNavForRole`（`shell-config.ts:110`）が nav を構築する。
T3 は以下の既存 primitive 分岐強化に閉じる:

| 対象ファイル（実在確認済み） | 変更 |
| --- | --- |
| `SidebarUserMenu.tsx`（`SidebarUserMenu({ role, user, collapsed })` / `roleDisplayLabel(role)`）| viewer 分岐で「ゲスト」+ サブ「未ログイン」+ ログイン CTA（`data-shell-block="login-cta"`、collapsed 時 icon + sr-only） |
| `SidebarUserAvatar.tsx`（`SidebarUserAvatar({ initials, role, size })`）| viewer variant（initials の代わりにゲスト表現） |
| `SidebarNavItem.tsx`（`SidebarNavItem({ item, collapsed, activePath })` / `isNavItemActive(item.href, pathname)`）| active 時 `aria-current="page"` + token ベース背景/左 accent。badge（`item.badge.count`）を tone=warn・collapsed 時 dot 縮約 |

- active 判定は client の `usePathname() ?? activePath`（`SidebarNavItem.tsx:26` 確認済み）を正本とし、SSR 初期 active は
  layout から渡る `activePath`（middleware `x-pathname`）で graceful degradation する（SSR と client の二重保険）。

### APIシグネチャ

| 対象 | シグネチャ |
| --- | --- |
| `AuthLayout` | `({ children }: { readonly children: ReactNode })`（戻り値注釈なし。既存 layout と同じく型推論に委ねる）|
| `resolveRole` | `(session: SessionUser \| null): ShellRole`（既存・不変）|
| `buildNavForRole` | `(...)`（既存・`shell-config.ts:110`・不変）|
| `isNavItemActive` | `(itemHref: string, pathname: string): boolean`（既存・`shell-config.ts:125`・不変）|
| `SidebarUserMenu` | `({ role, user, collapsed }: SidebarUserMenuProps)`（`role: ShellRole`・viewer 分岐強化）|
| `SidebarNavItem` | `({ item, collapsed, activePath }: SidebarNavItemProps)`（active/badge 視認性強化）|

### 使用例

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts \
  "apps/web/app/(auth)" \
  "apps/web/app/(admin)/layout.spec.tsx" \
  "apps/web/src/components/shell" \
  "apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts" \
  "apps/web/src/__tests__/static-invariants.runtime.spec.ts" \
  "apps/web/__tests__/middleware.spec.ts"
```

### AC マッピング

| AC | 実装ポイント |
| --- | --- |
| AC-1 / AC-2 | `(auth)/layout.tsx` が shell 非 import・`data-shell-mode="bare"`。`/login` は `app/(auth)/login/page.tsx` |
| AC-3 | route group `()` は URL に出ず `/login` 不変。redirect / query 契約維持 |
| AC-4 | `middleware.ts` の `nextWithRequestHeaders` 経路へ `x-pathname` 注入。redirect には付与しない |
| AC-5 | `(admin)/layout.tsx` の `activePath="/admin"` を `x-pathname` 解決へ置換 |
| AC-6 | `SidebarUserMenu` viewer 分岐（「ゲスト」+ ログイン CTA）|
| AC-7 | `SidebarNavItem` の `aria-current="page"` + 視認性 + badge |
| AC-8 | 09h §1.6 マトリクスへ `(auth) /login bare` 明示 + login=shell外 invariant test |
| AC-9 | `pnpm typecheck` / `pnpm lint` / 対象 vitest green・HEX 0 |

### エラーハンドリング

| 項目 | 内容 |
| --- | --- |
| 入力 | `headers()`（`x-pathname` or fallback）、`children`、`session`（shell 内部）|
| 出力 | `(auth)` は bare DOM、`(public)/(member)/(admin)` は shell でラップした DOM |
| 副作用 | layout 自体は副作用なし（API / D1 なし）。session 取得・admin schemaDiff は `SidebarShellServer` 内部（既存 endpoint surface のみ・不変条件 #1）|
| エラー | `getSession` 失敗時は shell 内部で role=viewer fallback（fail-open）。auth 境界（admin/profile）は middleware + layout 二段防御を維持（fail-closed・不変条件 #11）|

### エッジケース

| ケース | 扱い |
| --- | --- |
| `/login?next=/login?...` | redirect loop を避け、認証済みユーザーは `/profile` へ fallback |
| middleware 未経由の layout test | `x-pathname` が無い場合は public=`/`、member=`/profile`、admin=`/admin` に fallback |
| redirect response | `x-pathname` は `NextResponse.next` の request header 用で、redirect 契約は既存通り |
| collapsed sidebar の viewer CTA | icon + `sr-only` ラベルで「ログイン」を保持 |

### 設定項目と定数一覧

| キー | 値 | 備考 |
| --- | --- | --- |
| `data-shell-mode` | `"bare"`（auth）/ `"sidebar"`（public/member/admin）| DOM 契約 |
| `data-route-group` | `"auth"` / `"public"` / `"member"` / `"admin"` | route group 識別 |
| request header | `x-pathname` = `req.nextUrl.pathname` | middleware 単一注入元 |
| viewer CTA marker | `data-shell-block="login-cta"` | collapsed 時 icon + sr-only |
| package 名 | `@ubm-hyogo/web` | コマンドの filter 対象 |

### テスト構成

| 層 | 対象 |
| --- | --- |
| route topology | `apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts` |
| login bare / redirect | `apps/web/app/(auth)/login/**.spec.tsx` |
| middleware | `apps/web/__tests__/middleware.spec.ts` |
| admin activePath | `apps/web/app/(admin)/layout.spec.tsx` |
| shell UX | `apps/web/src/components/shell/__tests__/*.spec.tsx` |
| static/token gates | `static-invariants.runtime.spec.ts` / `verify-design-tokens` |

## 視覚証跡

本タスクは **VISUAL**。local deterministic evidence と認証不要ルートの local pixel screenshot 4 PNG は取得済み。
admin 認証・API Worker・D1 を要する staging visual baseline は **pending（user-gated）** である。

- capture 計画: `phase-11-manual-test.md` の route × 状態マトリクス（8 件）。
- local screenshot: `outputs/phase-11/screenshots/login-bare.png`,
  `sidebar-viewer-guest.png`, `sidebar-viewer-guest-mobile.png`, `sidebar-mobile-drawer.png`。
- canonical ファイル名: `outputs/phase-11/manual-test-result.md` の screenshot 一覧（`<screen>-<state>.png`）。
  admin 例 `sidebar-admin-active-members.png` は staging 認証下に user-gated 取得する。
- 主ソース: direct focused Vitest（20 files / 98 tests PASS）/ typecheck / lint / grep gate + local screenshot 4 PNG。staging screenshot は user-gated 取得分を追記する。
