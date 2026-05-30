# Phase 5: 実装手順

> Task C の実装手順（CONST_005 準拠）。Phase 2 の移動 / 編集 / 削除設計を**実行可能なステップ**へ展開する。
> 依存 Task A/B/E（`apps/web/src/components/shell/`）が実装済みであることが着手前提（実装 wave: A/B/E → C）。

## 0. 前提（着手チェック）

```bash
# 依存 shell primitive の存在確認（不在なら Task A/B/E を先に実装）
ls apps/web/src/components/shell/SidebarShell.server.tsx \
   apps/web/src/components/shell/SidebarMobileTrigger.tsx \
   apps/web/src/components/shell/SidebarUserMenu.tsx
# worktree 直後の依存・esbuild 整合
mise exec -- pnpm install
mise exec -- pnpm verify:vitest-runtime
```

## 1. 影響ファイル一覧（RT-03 / 見落とし防止）

### 1.1 新規作成

| ファイル | 内容 |
| --- | --- |
| `apps/web/app/(public)/page.spec.tsx` | root `/` の移動先 spec（移動前は root に spec が存在しないため新規作成。§後述の P-1..MV-1 をカバー） |

### 1.2 修正

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/app/(public)/layout.tsx` | `async` 化 + `SidebarShellServer` mount + `PublicFooter` を children 末尾保持 + `data-shell-mode="sidebar"` 付与 + 旧 `PublicHeader` 削除 |
| `apps/web/app/(member)/layout.tsx` | `async` 化 + `SidebarShellServer` mount + `data-shell-mode="sidebar"` 付与 + 旧 `MemberHeader` 削除 |
| `apps/web/app/(public)/page.tsx`（= 移動後の `/`） | `<PublicHeader />` 直接 mount 削除 + 相対 import 深度補正（`../src` → `../../src`） |
| `apps/web/app/(member)/profile/page.tsx` | `MemberHeader` import + 直接 mount 2 箇所削除（`@/` alias 利用のため import 深度補正は不要） |
| `apps/web/app/(public)/layout.spec.tsx` | async render 形式 + shell mount / 旧 header 不在アサーションへ更新（Phase 4 P-1..P-11） |
| `apps/web/app/(member)/layout.spec.tsx` | 同上（Phase 4 M-1..M-9） |
| `apps/web/app/(member)/profile/page.spec.tsx` | MemberHeader 非 render 回帰 guard 追加（Phase 4 PR-1..PR-4） |
| `apps/web/app/(public)/privacy/page.tsx`（移動後） | 相対 import 深度補正（`../../src` → `../../../src`） |
| `apps/web/app/(public)/terms/page.tsx`（移動後） | 同上 |
| `apps/web/app/(public)/login/page.tsx`（移動後） | 相対 import 深度補正（`../../src` → `../../../src`） |
| `apps/web/app/(public)/login/error.tsx`（移動後） | 同上（`../../src` → `../../../src`） |
| `apps/web/app/(public)/login/_components/*.tsx`（移動後） | 相対 import 深度補正（`../../../src` → `../../../../src`） |
| `apps/web/app/(public)/login/__tests__/error.component.spec.tsx`（移動後） | `../../../src` → `../../../../src`、`../error` は dir 内相対のため不変 |
| `apps/web/app/(public)/login/_components/__tests__/*.spec.tsx`（移動後） | dir 内相対のみ（`../X`）。dir ごと移動するため変更不要（要 grep 確認） |

### 1.3 移動（`git mv`・URL 不変）

| from | to | 備考 |
| --- | --- | --- |
| `apps/web/app/page.tsx` | `apps/web/app/(public)/page.tsx` | `/` 不変 |
| `apps/web/app/privacy/page.tsx` | `apps/web/app/(public)/privacy/page.tsx` | `/privacy` 不変 |
| `apps/web/app/terms/page.tsx` | `apps/web/app/(public)/terms/page.tsx` | `/terms` 不変 |
| `apps/web/app/login/`（dir 一式） | `apps/web/app/(public)/login/` | `/login` 不変。`page.tsx` / `error.tsx` / `error.spec.tsx` / `loading.tsx` / `loading.spec.tsx` / `_components/` / `__tests__/` を dir ごと移動 |

> root に `page.spec.tsx` は存在しない（確認済み）ため、`page.spec.tsx` の `git mv` は対象外。`(public)/page.spec.tsx` は §1.1 で新規作成する。

### 1.4 削除（`git rm`）

| ファイル | 理由 |
| --- | --- |
| `apps/web/src/components/public/PublicHeader.tsx` | shell へ統合 |
| `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` | 対象 component 削除に伴う |
| `apps/web/src/components/layout/MemberHeader.tsx` | shell へ統合 |
| `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 同上 |

> `SessionAwarePublicHeader.tsx` / `PublicHeaderWithPath.tsx` は存在しないため削除対象外（Phase 1 是正済み）。

## 2. ステップ by ステップ手順

### Step 1: route 移動（`git mv`）

```bash
# (public) group が既存（members / register あり）なので mkdir 不要。サブディレクトリは git mv が作る。
git mv "apps/web/app/page.tsx"          "apps/web/app/(public)/page.tsx"
git mv "apps/web/app/privacy"           "apps/web/app/(public)/privacy"
git mv "apps/web/app/terms"             "apps/web/app/(public)/terms"
git mv "apps/web/app/login"             "apps/web/app/(public)/login"
```

- `login/` は dir ごと移動するため、`_components/` / `__tests__/` 配下の **dir 内相対 import（`../X` / `../../X` で src を跨がないもの）は変化しない**。変化するのは「dir 外（`src/`）を相対参照している箇所」のみ。
- `git mv` で履歴を保つ。Next.js の route group `()` は URL セグメントに含まれないため、移動後も URL は不変（`/` `/privacy` `/terms` `/login`）。

### Step 2: 移動 page の相対 import 深度補正

route group `()` が 1 階層追加されるため、`src/` を相対参照している import を 1 段深くする。`@/` alias は不変。

| ファイル | before | after |
| --- | --- | --- |
| `(public)/page.tsx` | `from "../src/..."` | `from "../../src/..."` |
| `(public)/privacy/page.tsx` | `from "../../src/components/legal/LegalProse"` | `from "../../../src/components/legal/LegalProse"` |
| `(public)/terms/page.tsx` | `from "../../src/components/legal/LegalProse"` | `from "../../../src/components/legal/LegalProse"` |
| `(public)/login/page.tsx` | `from "../../src/lib/url/login-query"` | `from "../../../src/lib/url/login-query"` |
| `(public)/login/error.tsx` | `from "../../src/lib/a11y/useAutoFocusOnMount"` / `from "../../src/lib/logger"` | `from "../../../src/..."` |
| `(public)/login/_components/*.tsx` | `from "../../../src/..."` | `from "../../../../src/..."` |
| `(public)/login/__tests__/error.component.spec.tsx` | `from "../../../src/lib/logger"`（`../error` は不変） | `from "../../../../src/lib/logger"` |

> `(public)/login/loading.tsx` / `loading.spec.tsx` は `src/` 相対 import を持たない（確認済み）ため補正不要。
> `_components/__tests__/*.spec.tsx`（LoginCard / LoginPanel）は `../X`（dir 内相対）のみのため、要 grep 確認の上、`src/` 相対があれば `+1` 段。

機械的補正の補助（要レビュー、`-i` での一括置換は対象を絞ること）:

```bash
# 深度 +1 の候補抽出（手で確認してから編集）
grep -rn 'from "\.\./\(\.\./\)*src/' \
  "apps/web/app/(public)/page.tsx" \
  "apps/web/app/(public)/privacy" \
  "apps/web/app/(public)/terms" \
  "apps/web/app/(public)/login"
```

### Step 3: `(public)/layout.tsx` を async 化 + shell mount

最終形（Phase 2 スケッチ採用）:

```tsx
// apps/web/app/(public)/layout.tsx
import type { ReactNode } from "react";
import { headers } from "next/headers";

import { PublicFooter } from "../../src/components/public/PublicFooter";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";

export default async function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}): Promise<JSX.Element> {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  return (
    <div
      data-theme="warm"
      data-route-group="public"
      data-shell-mode="sidebar"
      data-testid="public-shell"
    >
      <SidebarShellServer
        activePath={pathname}
        mobileTriggerSlot={<SidebarMobileTrigger />}
      >
        {children}
        <PublicFooter />
      </SidebarShellServer>
    </div>
  );
}
```

- 旧 `<header data-shell="topbar"><PublicHeader /></header>` / `<main data-route="public">` / `<footer>` の手組みを除去し、shell に所有権を移す。
- `PublicHeader` の import を削除する（AC-C2 grep 0 の一部）。
- `data-theme="warm"` / `data-route-group="public"` は維持（既存 spec / visual 回帰保護）。`data-shell-mode="sidebar"` を新設。
- レイアウト grid / token クラスは shell（Task A）が内部で提供するため layout 側 className は最小化する（旧 `grid min-h-screen ...` は shell へ委譲）。

### Step 4: `(member)/layout.tsx` を async 化 + shell mount

```tsx
// apps/web/app/(member)/layout.tsx
import type { ReactNode } from "react";
import { headers } from "next/headers";

import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";

export default async function MemberLayout({
  children,
}: {
  readonly children: ReactNode;
}): Promise<JSX.Element> {
  const pathname = (await headers()).get("x-pathname") ?? "/profile";
  return (
    <div
      data-theme="warm"
      data-route-group="member"
      data-shell-mode="sidebar"
      data-testid="member-shell"
    >
      <SidebarShellServer
        activePath={pathname}
        mobileTriggerSlot={<SidebarMobileTrigger />}
      >
        {children}
      </SidebarShellServer>
    </div>
  );
}
```

- 旧 `<header data-shell="topbar"><MemberHeader /></header>` / `<main data-route="member">` を除去し、`MemberHeader` import を削除。
- member には footer がないため `PublicFooter` は配置しない。
- `data-route-group="member"` / `data-theme="warm"` 維持、`data-shell-mode="sidebar"` 新設。

### Step 5: `(public)/page.tsx`（`/`）から `<PublicHeader />` 直接 mount 除去

- import 文 `import { PublicHeader } from "../../src/components/public/PublicHeader";`（Step 2 で深度補正済みのパス）を削除。
- JSX の `<PublicHeader />`（現 L48 相当）を削除。`<main>` / `<PublicFooter />` の扱い:
  - layout が shell + footer を提供するため、**page 側の `<PublicFooter />`（現 L82）も削除**し、page は content のみ（`<main>` と各 section）にする。重複 footer を防ぐ（layout の PublicFooter が正本）。
  - `<>...</>` Fragment ラッパーは `<main>` だけを残す形へ整理（page が複数トップレベル要素を返さなくなるなら Fragment 不要）。
- 結果: page は `Hero` / `Stats` / `AboutUbm` / `FeaturedMembers` / `Timeline` / `CallToActionCTA` を含む `<main>` のみを返す。

> 注意: `(public)/page.tsx` の `PublicFooter` import も併せて削除する（footer は layout 集約）。grep G-1 で PublicHeader、重複描画チェックで PublicFooter 二重を防ぐ。

### Step 6: `(member)/profile/page.tsx` から MemberHeader を除去

- `import { MemberHeader } from "@/components/layout/MemberHeader";`（現 L25）を削除（`@/` alias のため深度補正不要）。
- 2 箇所の `<MemberHeader />`（`!meResult.ok` 分岐 L51 / `!profileResult.ok` 分岐 L77）を削除。
- 各分岐の `<>...</>` Fragment は `<main>` だけを返す形へ整理（degrade 時も layout の shell 内で content だけを描く）。
- 正常系 return（L100 の `<div data-testid="profile-authenticated-root">`）は変更不要（元から MemberHeader を持たない）。

### Step 7: 旧 component + spec を `git rm`

```bash
git rm "apps/web/src/components/public/PublicHeader.tsx"
git rm "apps/web/src/components/public/__tests__/PublicHeader.spec.tsx"
git rm "apps/web/src/components/layout/MemberHeader.tsx"
git rm "apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx"
```

> 削除後、`src/components/layout/` が空になる場合はディレクトリ残骸を確認（他ファイルがあれば残す）。

### Step 8: spec の更新（Phase 4 ケース反映）

- `(public)/layout.spec.tsx`: async render（`render(await PublicLayout({ children }))`）+ shell スタブ + headers スタブで P-1..P-11 を実装。
- `(member)/layout.spec.tsx`: 同様に M-1..M-9。
- `(member)/profile/page.spec.tsx`: 既存 4 ケースを維持しつつ PR-1..PR-4（MemberHeader 非 render）を追加。
- `(public)/page.spec.tsx`: 新規作成。`/` page が footer / header を持たず content のみを返すこと、移動先で import 解決できることを確認（MV-1）。

## 3. 各ファイルの最終関数シグネチャ

| ファイル | シグネチャ |
| --- | --- |
| `(public)/layout.tsx` | `export default async function PublicLayout({ children }: { readonly children: ReactNode }): Promise<JSX.Element>` |
| `(member)/layout.tsx` | `export default async function MemberLayout({ children }: { readonly children: ReactNode }): Promise<JSX.Element>` |
| `(public)/page.tsx` | `export default async function HomePage(): Promise<JSX.Element>`（既存 async 維持。header/footer mount のみ除去） |
| `(member)/profile/page.tsx` | `export default async function ProfilePage()`（既存維持。MemberHeader mount のみ除去） |

## 4. 入出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `headers()`（`x-pathname` or fallback）、`children` |
| 出力 | `SidebarShellServer` でラップした DOM（`data-shell-mode="sidebar"`） |
| 副作用 | **なし**。API call なし / D1 アクセスなし / Google Form schema 不変 / auth middleware 不変。session 取得・role 判定は `SidebarShellServer` 内部に閉じる（Task C は再判定しない / AC-C5・AC-C8） |
| エラー | `getSession` 失敗時は shell 内部で role=viewer fallback（Task A 仕様）。layout は throw しない |

## 5. `x-pathname` fallback の扱い（AC-C8 / middleware 不変）

- `x-pathname` は middleware で未注入（リポジトリ全体に注入箇所なし。確認済み）。**auth middleware は変更しない**（AC-C8 / 不変条件 #4）。
- layout は `(await headers()).get("x-pathname") ?? "/"`（member は `?? "/profile"`）で fallback を持つ。
- active state の最終確定は client 側 `usePathname()`（Task A の `isNavItemActive` が client 評価）に委ねる graceful degradation。SSR 初期 active は fallback ベース。
- middleware への `x-pathname` 注入の是非は Phase 12 `unassigned-task-detection.md`（MINOR M-1）で current/baseline 分離して再評価する。

## 6. 移動チェックリスト（grep で機械確認）

```bash
# (a) 移動 page の src 相対 import が破壊されていない（深度補正漏れ検出）
grep -rn 'from "\.\./\(\.\./\)*src/' "apps/web/app/(public)/login" \
  "apps/web/app/(public)/page.tsx" "apps/web/app/(public)/privacy" "apps/web/app/(public)/terms"

# (b) login dir 内 colocated test が新パスに揃っている
ls "apps/web/app/(public)/login/__tests__" "apps/web/app/(public)/login/_components/__tests__"

# (c) 旧 path 参照が残っていない（smoke / harness / config からの参照）
grep -rn 'app/login\|app/privacy\|app/terms\|app/page' apps/web/ --include="*.ts" --include="*.tsx" \
  | grep -v 'app/(public)' | grep -v node_modules

# (d) 旧 header 参照 0（AC-C2）
grep -rn "PublicHeader\|MemberHeader" apps/web/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

> (c) で root layout（`apps/web/app/layout.tsx`）や `__smoke__` / `visual-harness` が `/` 等を URL として参照している場合、URL は不変なので修正不要。ファイルパス参照（import）の場合のみ補正する。

## 7. ローカル検証コマンド + DoD

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  "apps/web/app/(public)" "apps/web/app/(member)"
```

### Definition of Done

- [ ] `pnpm typecheck` green（相対 import 深度補正漏れ 0 / async 化 OK）
- [ ] `pnpm lint` green
- [ ] focused test（`(public)` / `(member)`）green（Phase 4 P/M/PR/MV 全ケース）
- [ ] grep G-1/G-2（`PublicHeader` / `MemberHeader`）ヒット 0
- [ ] `git status` に旧 4 component/spec の削除（`D`）が出ている（AC-C3）
- [ ] URL 不変: `/` `/privacy` `/terms` `/login` `/members` `/register` `/profile`（route group `()` は URL 非寄与）
- [ ] PublicFooter は `(public)/layout.tsx` で 1 回だけ描画（page 側重複なし）

> 実コード実装・focused tests・typecheck・lint は本サイクルで完了済み。pixel screenshot・staging visual baseline・commit・push・PR は user-gated Gate-C。
