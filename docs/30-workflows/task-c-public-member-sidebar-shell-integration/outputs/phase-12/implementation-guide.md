# Implementation Guide — Task C: 公開 / 会員 layout を SidebarShell へ統合

## Part 1: 中学生にもわかる説明（なぜ・なに）

### なぜこれが必要なのか

たとえば、家に部屋がたくさんあるとします。今の家は、リビングには「リビング専用の玄関」、
寝室には「寝室専用の玄関」が別々についている状態です。部屋を移動するたびに玄関が
ガチャガチャ組み替わって、見ていて落ち着きません。

このアプリも同じで、トップページ（`/`）や会員ページ（`/profile`）など **画面ごとに別々の
「ヘッダー」（上のメニュー帯）** が付いていました。ページを移動するたびにヘッダーが
作り直されて、一瞬チラついて（flash して）見えることがあります。

そこでこのタスクでは、**家じゅうの玄関を 1 つの「共通の玄関（サイドバー）」にまとめます**。
どの部屋（ページ）に行っても、同じ玄関がずっと左側に立っているので、移動しても玄関は
組み替わりません。これが「チラつきなし（flash なし）」の正体です。

### なにをするのか（たとえ話で）

- **共通の玄関を作る**（これは別の担当 = Task A/B/E が用意する `SidebarShell`）。
- このタスク（Task C）は、**各部屋に「自分の玄関」を捨てさせて、共通の玄関を使うように配線する**だけ。
  新しい玄関の中身（メニューの並びやログアウトボタン）は作りません。
- バラバラの場所にあった部屋（`/`・`/privacy`・`/terms`・`/login`）を、**1 つのフロア（`(public)`
  というグループ）に引っ越し**させます。引っ越しても「住所（URL）」は変わりません。
  Next.js の `(かっこ)` 付きフォルダは住所に出ないからです。
- 古い玄関（`PublicHeader` / `MemberHeader`）は **完全に取り壊します（ファイル削除）**。

### たとえば、こうなる

- 引っ越し前: `/` の部屋は 1 階の独立した場所にあり、自分専用の玄関を持っていた。
- 引っ越し後: `/` の部屋は `(public)` フロアに入り、フロア共通の玄関（サイドバー）を使う。
  住所は引っ越し前と同じ `/` のまま。

## Part 2: 技術者向け解説（実装の事実）

### 概要

Task C は公開 6 route（`/`, `/members`, `/register`, `/privacy`, `/terms`, `/login`）と
会員 1 route（`/profile`）の shell 所有権を **page から layout へ移し**、共通
`SidebarShellServer` を route group の `layout.tsx` で 1 度だけ mount する配線タスクである。
shell の内部（session 取得・role 判定・nav 構築・UserMenu 注入）は Task A/B/E が所有し、
Task C は再実装しない（AC-C5 / 不変条件 #2,#3）。

### 本サイクルの実装スコープ（CONST_006/009 — ラベル超過の判断根拠）

> Task C 仕様の「サイクル方針」は *今サイクルは Phase 1-13 仕様作成まで、A/B/E と実コードは user-gated wave* と
> していたが、実装プロンプト（CONST_006/009: 実コード実装を完遂し、先送りをデフォルトにしない）に従い、
> **依存 Task A/B/E（`apps/web/src/components/shell/` の primitive 群）を本サイクルで先行新規実装したうえで
> Task C を実装完了**させた。理由: Task C の layout は `SidebarShellServer` 等を import して動作するため、
> A/B/E 不在のままでは実コードが typecheck / test で成立せず「実コード変更あり」を達成できない（構造的前提）。
> よってラベル（spec 作成のみ）より実態（コード変更必須）を優先した。pixel screenshot のみ running stack 依存で
> Gate-C に残す（[manual-test-result.md](../phase-11/manual-test-result.md)）。

#### 本サイクルで新規実装した Task A/B/E primitive（`apps/web/src/components/shell/`）

| Task | ファイル |
| --- | --- |
| A | `shell-config.ts`, `icons.tsx`, `useSidebarState.ts`, `SidebarShellContext.tsx`, `SidebarBrand.tsx`, `SidebarNav.tsx`, `SidebarNavGroup.tsx`, `SidebarNavItem.tsx`, `SidebarCollapseToggle.tsx`, `SidebarShell.tsx`, `SidebarShell.server.tsx` + `__tests__/{shell-config,useSidebarState,SidebarShell}.spec` |
| B | `user-menu-config.ts`, `SidebarUserAvatar.tsx`, `SidebarUserMenu.tsx` + `__tests__/{user-menu-config,SidebarUserMenu}.spec` |
| E | `SidebarMobileTrigger.tsx`, `SidebarDrawer.tsx` + `__tests__/{SidebarMobileTrigger,SidebarDrawer}.spec` |
| A（編集） | `apps/web/src/styles/tokens.css`（shell OKLch トークン 5 件追加: `--shell-bar-w` 他、`[data-theme=cool]` の `--shell-active-bg`） |

> `SidebarShellServer` は admin role のときのみ `safeServerFetch("/admin/schema/diff")` で schemaDiffCount を取得
> （既存 admin layout と同じ endpoint surface・新規 endpoint なし / 不変条件 #1）。getSession 失敗時は viewer fallback。

### 消費する依存 interface（Task A 確定 contract・phase-2 から引用）

```tsx
// apps/web/src/components/shell/SidebarShell.server.tsx（Task A 提供）
export async function SidebarShellServer(props: {
  activePath: string
  children: ReactNode
  mobileTriggerSlot: ReactNode
}): Promise<JSX.Element>
// 内部で getSession() → role 判定 → buildNavForRole() → <SidebarUserMenu /> を注入する。
// Task C は role 判定・UserMenu 組み立てを再実装しない。
```

### layout async 化 + SidebarShellServer mount（phase-2 スケッチから引用）

```tsx
// apps/web/app/(public)/layout.tsx
import type { ReactNode } from "react";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";
import { PublicFooter } from "../../src/components/public/PublicFooter";
import { headers } from "next/headers";

export default async function PublicLayout({ children }: { readonly children: ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  return (
    <div data-theme="warm" data-route-group="public" data-shell-mode="sidebar" data-testid="public-shell">
      <SidebarShellServer activePath={pathname} mobileTriggerSlot={<SidebarMobileTrigger />}>
        {children}
        <PublicFooter />
      </SidebarShellServer>
    </div>
  );
}
```

```tsx
// apps/web/app/(member)/layout.tsx
import type { ReactNode } from "react";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server";
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger";
import { headers } from "next/headers";

export default async function MemberLayout({ children }: { readonly children: ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "/profile";
  return (
    <div data-theme="warm" data-route-group="member" data-shell-mode="sidebar" data-testid="member-shell">
      <SidebarShellServer activePath={pathname} mobileTriggerSlot={<SidebarMobileTrigger />}>
        {children}
      </SidebarShellServer>
    </div>
  );
}
```

- 両 layout を `async` 化し、`headers()` を `await` する（Next.js 16 dynamic API 規約）。
- `PublicFooter` は **削除せず** `(public)/layout.tsx` の children 末尾に保持（AC-C4 / 不変条件 #6）。
- DOM 契約: `data-shell-mode="sidebar"` を 7 route 共通で付与（AC-C1）。

### route group 集約（git mv・URL 不変）

| from | to | URL |
| --- | --- | --- |
| `apps/web/app/page.tsx` | `apps/web/app/(public)/page.tsx` | `/`（不変） |
| `apps/web/app/page.spec.tsx`（存在すれば） | `apps/web/app/(public)/page.spec.tsx` | — |
| `apps/web/app/privacy/page.tsx` | `apps/web/app/(public)/privacy/page.tsx` | `/privacy`（不変） |
| `apps/web/app/terms/page.tsx` | `apps/web/app/(public)/terms/page.tsx` | `/terms`（不変） |
| `apps/web/app/login/`（dir 一式） | `apps/web/app/(public)/login/` | `/login`（不変） |

- route group `()` は URL セグメントに含まれないため URL は不変（AC-C7）。
- `/members` `/register` は既に `(public)` 配下のため移動不要。
- 移動 page の相対 import は階層深度に合わせて補正（`../src/...` → `../../src/...`）。`@/` alias 箇所は不変（AC-C10）。

### 削除した component（git delete）

| ファイル | 理由 |
| --- | --- |
| `apps/web/src/components/public/PublicHeader.tsx` | shell へ統合 |
| `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` | 対象削除に伴う |
| `apps/web/src/components/layout/MemberHeader.tsx` | shell へ統合 |
| `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 同上 |

- 削除後 `git grep -n "PublicHeader\|MemberHeader" -- apps/web` が **0 ヒット**（doc / archive 除く・AC-C2/C3）。
- `(public)/page.tsx` の `PublicHeader` 直 mount、`(member)/profile/page.tsx` の `MemberHeader` 直 mount 2 箇所を剥がす（AC-C6）。
- `SessionAwarePublicHeader.tsx` / `PublicHeaderWithPath.tsx` は **存在しない** ため削除対象外（Phase 1 是正済み）。

### 型 / シグネチャ

| 対象 | シグネチャ |
| --- | --- |
| `PublicLayout` | `async ({ children }: { readonly children: ReactNode })`（戻り値注釈なし。実態の React 19 / Next 16 には global `JSX` 名前空間がなく `Promise<JSX.Element>` は TS2503 になるため、既存 admin layout と同じく型推論に委ねる） |
| `MemberLayout` | `async ({ children }: { readonly children: ReactNode })` |
| `SidebarShellServer` | `async (props: { activePath: string; children: ReactNode; mobileTriggerSlot: ReactNode })`（Task A・本サイクル実装） |

### x-pathname fallback（middleware 不変 / AC-C8）

- `x-pathname` は middleware で **未配線**。auth middleware は変更しない（AC-C8 / 不変条件 #4）。
- `headers().get("x-pathname") ?? "/"`（member は `?? "/profile"`）で fallback を持つ。
- active state の最終確定は client 側 `usePathname()`（Task A `isNavItemActive`）による graceful degradation。
- SSR 初期 active は fallback ベース。これは Task A の責務範囲で吸収。
- middleware への `x-pathname` 注入は別 surface（auth 境界）変更となり AC-C8 に抵触するため行わない。
  fallback で active 表示が不足する場合は `unassigned-task-detection.md`（M-1）で検出する。

### エラーハンドリング・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `headers()`（x-pathname or fallback）、`children` |
| 出力 | shell でラップされた DOM |
| 副作用 | なし（API call なし・D1 なし）。session 取得は `SidebarShellServer` 内部 |
| エラー | `getSession` 失敗時は shell 内部で role=viewer fallback（Task A 仕様）。layout は throw しない |

### 設定 / 定数一覧

| キー | 値 | 備考 |
| --- | --- | --- |
| `data-shell-mode` | `"sidebar"` | 7 route 共通 DOM 契約（AC-C1） |
| `data-route-group` | `"public"` / `"member"` | route group 識別 |
| `data-theme` | `"warm"` | 既存維持 |
| `data-testid` | `"public-shell"` / `"member-shell"` | test selector |
| x-pathname fallback | `"/"`（public）/ `"/profile"`（member） | middleware 未配線時の graceful 値 |
| package 名 | `@ubm-hyogo/web` | コマンドの filter 対象 |

## 視覚証跡

本タスクは **VISUAL** だが、実 pixel screenshot capture は **pending（Gate-C user-gated）** である。
依存 Task A/B/E（`apps/web/src/components/shell/`）と Task C の layout 統合は本ブランチでローカル実装済みであり、
focused vitest / typecheck / lint の source-level evidence は取得済みである。
未取得なのは production-equivalent running stack（認証済みセッション・API Worker・D1）上の pixel screenshot と
staging visual baseline であり、これは commit/push/PR と同じ user-gated runtime 境界として残す。

- capture 計画: `phase-11-manual-test.md` の route × 状態マトリクス（9 件）。
- canonical ファイル名: `outputs/phase-11/manual-test-result.md` の screenshot 一覧（`<surface>-<state>.png`）。
- 主ソース: focused vitest（source-level 証跡）。実 screenshot は Gate-C 取得分を追記。
