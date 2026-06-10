# Phase 5: 実装（TDD Green）

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- 前提: Phase 1（要件・AC-1..AC-9）/ Phase 2（D-1..D-5 className 設計・変更 4 ファイル確定）/ Phase 3（設計レビュー PASS）/ Phase 4（テスト計画・TDD Red 確定）
- 本 Phase の責務: Phase 4 で Red 化したテスト（TC-01..08 が collapsed の `px-0 w-full justify-center` + 40px 枠不在で FAIL）を green へ転じる実コード変更を、各ファイル `対象:行` の **Before（現状の className 逐語）→ After（修正後の className 逐語）** として実装可能粒度で確定する

## 目的

Phase 4 のテスト（TC-01..TC-17）を **green** にするための実コード変更を、変更 4 ファイル + 任意 1 ファイルそれぞれについて「現行コードに一致した Before」と「適用後の After」で示す。
本 Phase は **TDD の Green フェーズ**であり、Phase 4 の Red（collapsed 時の `px-3` 残存・40px 枠不在・`SidebarBrand` の collapsed 分岐欠如）を実装で解消する。
本変更は **表現層（Tailwind className）のみ**。props / state / データフロー / data 属性 / 色トークンは一切変更しない。API（`apps/api`）/ D1 schema / Google Form schema / endpoint surface / fetch URL は一切変更しない（AC-8・不変条件 #1 #5）。

## 0. 変更ファイル一覧（[Feedback RT-03]）

| # | パス | 種別 | 変更概要 |
| --- | --- | --- | --- |
| 1 | `apps/web/src/components/shell/SidebarNavItem.tsx` | **修正** | L30 itemClassName から `px-3` 除去、collapsed 分岐に `px-0 w-full py-2`、icon span を collapsed 時 `h-10 w-10` 中央枠化 |
| 2 | `apps/web/src/components/shell/SidebarUserMenu.tsx` | **修正** | L54 summary から `px-3` 除去、collapsed 分岐に `px-0 w-full py-2` |
| 3 | `apps/web/src/components/shell/SidebarBrand.tsx` | **修正** | L16 Link に collapsed 分岐を新設（`px-0 w-full justify-center` / expanded `gap-2 px-3`） |
| 4 | `apps/web/src/components/shell/SidebarShell.tsx` | **修正** | L32 AdminPublicReturn から `px-3` 除去、collapsed 分岐に `px-0 w-full py-2`、icon span を collapsed 時 `h-10 w-10` 中央枠化 |
| 5 | `apps/web/src/components/shell/SidebarNav.tsx` | **無変更（任意確認）** | L18 collapsed `overflow-visible` は px-0 中央化で実害なし。挙動不変につき **無変更** |

新規作成ファイル: **なし**。新規 primitive / 型 / 定数 / ヘルパー関数: なし。

## 1. 実装順序

依存のない独立 4 ファイルの className 編集のため順序依存はないが、回帰確認しやすさのため次の順で進める。各ファイル編集後に focused vitest を回す。

| 手順 | 対象 | 変更 | ステップ後の検証 |
| --- | --- | --- | --- |
| 1 | `SidebarNavItem.tsx` | L30 itemClassName + icon span（TC-01/05/08/09/10/11） | `SidebarNavItem.spec.tsx` |
| 2 | `SidebarShell.tsx`（`AdminPublicReturn`） | L32 className + icon span（TC-04/14） | `SidebarShell.spec.tsx` |
| 3 | `SidebarUserMenu.tsx` | L54 summary className（TC-02/06/12/15/16） | `SidebarUserMenu.spec.tsx` |
| 4 | `SidebarBrand.tsx` | L16 Link className collapsed 分岐新設（TC-03/07/08/13/17） | `SidebarShell.spec.tsx`（Phase 6） |

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__
```

## 2. 共通 collapsed レイアウト規約（D-1..D-4 を逐語に落とす）

§4.2（_shared-context.md）の方針を、4 行すべてで一致させる collapsed/expanded className 分岐の逐語形に固定する:

- **collapsed 分岐の逐語**: `justify-center gap-0 px-0 py-2 w-full`
- **expanded 分岐の逐語**: 各コンポーネントの **現行 expanded gap 値を逐語保持** + `px-3 py-2`
  - nav-item: `gap-3 px-3 py-2`（現行 expanded gap=`gap-3`）
  - admin-return: `gap-3 px-3 py-2`（現行 expanded gap=`gap-3`）
  - user-menu: `gap-2 px-3 py-2`（現行 expanded gap=`gap-2`）
  - brand: `gap-2 px-3 py-2`（現行 expanded gap=`gap-2`）
- **ベース className からは `px-3` を必ず除去**し、上記分岐へ `py-2` ごと移す（現行は `px-3 py-2` がベースに固定されているため、両方を分岐へ移し collapsed の `px-0` を有効化する）。

> 重要: 現行コードはベースに `px-3 py-2` が常時付き、`${collapsed ? "justify-center gap-0" : "gap-2/3"}` だけを分岐していた。
> この設計では collapsed でも `px-3` が残り `justify-center` が 16px 領域に潰されて無効だった（根本原因）。
> 本修正はベースから `px-3 py-2` を抜き、`py-2` は両分岐に・`px-3` は expanded 分岐のみに置く。

## 3. ファイル別 Before → After（逐語）

### 3.1 `SidebarNavItem.tsx`（D-1・対象 L30・L33-38）

**対象: L30 `itemClassName`**

Before（現状逐語）:

```tsx
  const itemClassName = `relative flex items-center rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] ${collapsed ? "justify-center gap-0" : "gap-3"}`;
```

After（修正後逐語・ベースから `px-3 py-2` を抜き分岐へ移す）:

```tsx
  const itemClassName = `relative flex items-center rounded-sm text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] ${collapsed ? "justify-center gap-0 px-0 py-2 w-full" : "gap-3 px-3 py-2"}`;
```

**対象: L33-38 icon span（40px 角中央枠化）**

Before（現状逐語）:

```tsx
      <span
        aria-hidden="true"
        className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)]"
      >
        <ShellIcon id={item.icon} />
      </span>
```

After（collapsed 時のみ 40px 角枠 `h-10 w-10`・内側 `ShellIcon`(18px SVG) は無変更で中央配置）:

```tsx
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}`}
      >
        <ShellIcon id={item.icon} />
      </span>
```

- expanded は `h-[18px] w-[18px]` を逐語保持（regression なし・TC-11）。
- collapsed は `h-10 w-10`=40px 枠。`items-center justify-center` で内側 18px SVG が枠中央（左右 11px 余白）に置かれ、aside 内側 40px に収まる（AC-2・TC-05）。
- badge dot（L48-54 `absolute right-1 top-1`）は無変更。40px 枠を持つ `a`（`relative`）基準で右上に収まる（既存 `SidebarNavItem.spec.tsx:107-128` のドット assertion を維持）。

**active 表現（L88・AC-4）**: `border-l-2 border-transparent data-[active=true]:border-[var(--ubm-color-accent)] ...` は **無変更**。`itemClassName` に追記される形（L88 のテンプレートリテラル合成）も維持する。collapsed の `w-full justify-center` 中央枠でも、`a` の左端に付く `border-l-2` は `a` 自身の左辺（aside 内側左端）に描かれるため破綻しない（中央化されるのは内側の icon 枠であって `a` の box 自体は `w-full`）。TC-09/10 で active+collapsed / active+expanded 双方の border クラス維持を確認する。

### 3.2 `SidebarShell.tsx` — `AdminPublicReturn`（D-4・対象 L32・L34-39）

**対象: L32 Link className**

Before（現状逐語）:

```tsx
        className={`flex items-center rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-secondary)] hover:bg-[var(--shell-active-bg)] hover:text-[var(--ubm-color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] ${collapsed ? "justify-center gap-0" : "gap-3"}`}
```

After（nav-item と同一 collapsed 規約へ統一・expanded gap=`gap-3` 逐語保持）:

```tsx
        className={`flex items-center rounded-sm text-sm text-[var(--ubm-color-text-secondary)] hover:bg-[var(--shell-active-bg)] hover:text-[var(--ubm-color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] ${collapsed ? "justify-center gap-0 px-0 py-2 w-full" : "gap-3 px-3 py-2"}`}
```

**対象: L34-39 icon span（nav-item と同じ 40px 枠中央化で統一）**

Before（現状逐語）:

```tsx
        <span
          aria-hidden="true"
          className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)]"
        >
          <ShellIcon id="home" />
        </span>
```

After:

```tsx
        <span
          aria-hidden="true"
          className={`inline-flex shrink-0 items-center justify-center text-[var(--ubm-color-text-secondary)] ${collapsed ? "h-10 w-10" : "h-[18px] w-[18px]"}`}
        >
          <ShellIcon id="home" />
        </span>
```

- AdminPublicReturn は admin role のみ表示だが、nav-item と軸を統一する（AC-3 の「全行が同一 collapsed レイアウト規約」）。TC-04/14 で検証。
- `SidebarShell.tsx` のその他（aside L102 の `p-3 overflow-visible w-[var(--shell-bar-w)] data-[collapsed=true]:w-[var(--shell-bar-w-collapsed)]`、footer L107、collapse-toggle wrapper L110 `${collapsed ? "flex justify-center" : "flex justify-end"}`）は **無変更**。aside の `p-3`（内側 40px の前提）と `overflow-visible` は触らない（CSS surface 責務・globals.css の `[data-shell="sidebar"]{overflow:hidden}` も触らない）。

### 3.3 `SidebarUserMenu.tsx`（D-2・対象 L54）

**対象: L54 `summary` className**

Before（現状逐語）:

```tsx
        className={`relative flex cursor-pointer list-none items-center rounded-sm px-3 py-2 hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] ${collapsed ? "justify-center gap-0" : "gap-2"}`}
```

After（ベースから `px-3 py-2` を抜く・expanded gap=`gap-2` 逐語保持）:

```tsx
        className={`relative flex cursor-pointer list-none items-center rounded-sm hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] ${collapsed ? "justify-center gap-0 px-0 py-2 w-full" : "gap-2 px-3 py-2"}`}
```

- `SidebarUserAvatar`（L56・`size="md"`=`h-9 w-9`=36px）は **無変更**（decision D-2）。summary の `w-full justify-center` で 36px avatar が 40px 領域の中央（左右 2px 余白）に置かれ、aside 内側 40px に収まる（AC-2・TC-06）。
- displayName/role の sr-only ラップ（L57 `${collapsed ? "sr-only" : "flex min-w-0 flex-col leading-tight"}`）は **無変更**（AC-6・TC-15/16）。
- popover（L76-79 `absolute bottom-full left-0`）は **無変更**。中央寄せレイアウトでも `left-0` 基準で破綻しない（既存 popover spec を維持）。
- tooltip span（L70-74）は **無変更**（OOS-1 の overflow clip は baseline・本サイクル非対象）。

### 3.4 `SidebarBrand.tsx`（D-3・collapsed 分岐を新設・対象 L16）

**対象: L16 Link className（現状 collapsed 分岐が存在しない）**

Before（現状逐語・collapsed 分岐なし）:

```tsx
      className="flex items-center gap-2 rounded-sm px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
```

After（`collapsed` prop（既存・L10 で受領済み）を使い collapsed 分岐を新設・expanded gap=`gap-2` 逐語保持）:

```tsx
      className={`flex items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)] ${collapsed ? "justify-center gap-0 px-0 py-2 w-full" : "gap-2 px-3 py-2"}`}
```

- `collapsed` prop は既に `SidebarBrandProps`（L6-8）で定義され `SidebarBrand({ collapsed })`（L10）で受領済み。**props 契約は変更しない**（既存 prop の利用先を className に拡張するだけ）。
- mark span（L18-23 `inline-flex h-8 w-8 ...`=32px）は **無変更**（decision D-3）。Link の `w-full justify-center` で 32px mark が 40px 領域の中央（左右 4px 余白）へ収まる（AC-2・TC-07）。`h-8 w-8` は 40px 枠より小さいため `h-10 w-10` 化は不要（mark 自体の見た目を変えない方針）。
- text span（L24-29 `${collapsed ? "sr-only" : "flex flex-col leading-tight"}`）は **無変更**（既に collapsed で sr-only・AC-6・TC-17）。

### 3.5 `SidebarNav.tsx`（D-5・任意・無変更判断）

L18 の collapsed 時 `overflow-visible` は、`px-0` 中央化で nav-item のはみ出しが解消された後は実害がない（はみ出すコンテンツ自体が消える）。挙動不変につき **無変更**。
既存 `SidebarShell.spec.tsx:108`（`nav?.className` に `overflow-visible` を含む）/ `:106-107`（aside `overflow-visible`）の assertion を壊さないためにも触らない。Phase 9 QA で「collapsed 時に nav 項目が縦に多い場合の挙動」を確認し、問題があれば別途検討（本サイクルでは無変更で完結）。

## 4. 入力・出力・副作用

- **入力**: 各コンポーネントの既存 props（`collapsed: boolean` ほか）。新規 prop なし。
- **出力**: 同一の DOM ツリー（要素・data 属性・role・aria は不変）。差分は `className` 文字列のみ。
- **副作用**: なし。state（`useSidebarState`）・cookie・データフェッチ・router 挙動は不変。本変更は純粋に Tailwind utility class の付替え。

## 5. デザイントークン整合（AC-7・不変条件 #2）

- 変更は `px-*` / `py-*` / `gap-*` / `w-*` / `h-*` / `justify-*` の spacing/layout utility のみ。
- 色は既存の `var(--ubm-color-*)` / `var(--shell-active-bg)` をそのまま保持。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の **新規追加なし**。`h-[18px]` / `w-[18px]` は既存の arbitrary spacing（色リテラルではない）で `verify:tokens` の forbidden-color-literal scan 対象外。
- `--shell-bar-w-collapsed`（64px）は参照のみ・トークン値は変更しない。

## 6. DoD（Definition of Done）

| 項目 | 基準 |
| --- | --- |
| typecheck | `mise exec -- pnpm typecheck` green |
| lint | `mise exec -- pnpm lint` green |
| focused vitest | `apps/web/src/components/shell/__tests__` 全 spec green（TC-01..17 + 既存全件） |
| token | `mise exec -- pnpm verify:tokens` green（HEX 新規 0・AC-7） |
| apps/api 非変更 | `git diff --name-only -- apps/api` が空（AC-8） |
| collapsed レイアウト | brand / nav-item / user-menu / admin-return が collapsed で `px-0 w-full justify-center`、icon/avatar/mark が 64px 内・40px 枠中央に整列（AC-1/2/3・Phase 11 視覚で最終確認） |
| active 維持 | collapsed + active で `border-l-2` active 表現が破綻しない（AC-4） |
| expanded regression なし | expanded で `gap-3`/`gap-2` + `px-3` を逐語保持（AC-5） |

> OOS-1（collapsed tooltip の overflow clip）は baseline 扱いで本サイクルの実装・テスト対象外（_shared-context.md §7）。Phase 11 で clip の有無を実機確認する。
