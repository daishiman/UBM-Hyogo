# Phase 2: 設計

## 要件レビュー思考法（システム / 戦略 / 問題解決の 3 系統）

### 1. 真の論点

> 「同一ユーザーが公開 → /profile と遷移しても shell が一度も組み替わらない」状態を、
> route group の物理構造で保証する。

現象（header が 2 種類ある）ではなく、**shell mount 点を route group 単位に一本化する**ことが主問題。
page ごとに header を直 mount している現状は「shell 所有権が page に漏れている」状態であり、
これを **layout に所有権を集約**することで解く。

### 2. 依存関係・責務境界

| レイヤ | 責務 | 所有者 |
| --- | --- | --- |
| `SidebarShell.server.tsx` | session 取得・role 判定・nav 構築・UserMenu 注入 | Task A/B |
| `(public)/layout.tsx` | `activePath` を渡し shell を mount、`PublicFooter` を children 末尾に配置 | **Task C** |
| `(member)/layout.tsx` | 同上（member theme） | **Task C** |
| page（`page.tsx`） | コンテンツのみ。shell / header を持たない | **Task C が剥がす** |

Task C は **「shell の所有権を page から layout へ移す」配線タスク**であり、shell の内部実装は持たない。
state 所有権（session / role / collapse）はすべて Task A の `SidebarShellServer` / `useSidebarState` 側にある。

### 3. 価値とコストの不均衡

- **最大価値**: route group 集約による「真の単一 mount 点」。flash なしを CSS/JS でなく構造で保証する。
- **最大コスト**: `/`・`/privacy`・`/terms`・`/login` の物理移動に伴う相対 import 深度変化と colocated test / smoke route の追従。
  → ユーザー決定（Option A）により受容。Phase 5 で移動チェックリストを機械的に消化する。

### 4. 改善優先順位

1. route 移動（構造確定）→ 2. layout 配線 → 3. page から header 剥がし → 4. 旧 component 削除 → 5. import/test 補修

### 5. 4 条件評価

- 価値性: 公開・会員ユーザーの「UI 組み替わり」体験コストをゼロにする。✅
- 実現性: 既存 `SidebarShellServer` contract を mount するだけ。新規 UI 実装ゼロ（FB-SDK-07-1 再利用優先）。✅
- 整合性: shell の state 所有権は A/B/E 側。Task C は配線のみで境界が閉じる。✅
- 運用性: auth middleware 不変・URL 不変のため既存 e2e / smoke の前提を壊さない。✅

## 強化ループ / バランスループ

- 強化ループ（R）: layout 集約 → page が薄くなる → 新規 public route 追加時も自動で shell 適用 → 一貫性向上。
- バランスループ（B）: route 移動 → 相対 import 破壊リスク → 移動チェックリスト + typecheck gate で抑制。

## ファイル設計（移動 / 編集 / 削除）

### 移動（`git mv`、URL 不変）

| from | to | 備考 |
| --- | --- | --- |
| `apps/web/app/page.tsx` | `apps/web/app/(public)/page.tsx` | root index → public group。`/` 不変 |
| `apps/web/app/page.spec.tsx`（存在すれば） | `apps/web/app/(public)/page.spec.tsx` | colocated test 追従 |
| `apps/web/app/privacy/page.tsx` | `apps/web/app/(public)/privacy/page.tsx` | `/privacy` 不変 |
| `apps/web/app/terms/page.tsx` | `apps/web/app/(public)/terms/page.tsx` | `/terms` 不変 |
| `apps/web/app/login/` (dir 一式: page.tsx / _components / __tests__ / error.spec.tsx / loading.spec.tsx) | `apps/web/app/(public)/login/` | `/login` 不変。dir ごと移動 |

> 移動は `git mv` を用い、履歴を保つ。Next.js の route group `()` は URL セグメントに含まれないため URL は不変。

### 編集

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/app/(public)/layout.tsx` | `async` 化。`<header><PublicHeader/></header>` を削除し `SidebarShellServer` で wrap。`PublicFooter` は children 末尾に保持。`data-shell-mode="sidebar"` 付与 |
| `apps/web/app/(member)/layout.tsx` | `async` 化。`<header><MemberHeader/></header>` を削除し `SidebarShellServer` で wrap。`data-route-group="member"` 維持 |
| `apps/web/app/(public)/page.tsx`（移動後の `/`） | `<PublicHeader />` の直接 mount を削除（layout が担う） |
| `apps/web/app/(member)/profile/page.tsx` | `MemberHeader` import + 直接 mount 2 箇所を削除 |
| 移動した page の相対 import | `../../src/...` 等の深度を移動後の階層に合わせて補正（`@/` alias 利用箇所は不変） |

### 削除（git delete）

| ファイル | 理由 |
| --- | --- |
| `apps/web/src/components/public/PublicHeader.tsx` | shell へ統合 |
| `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` | 対象 component 削除に伴う |
| `apps/web/src/components/layout/MemberHeader.tsx` | shell へ統合 |
| `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 同上 |

> `SessionAwarePublicHeader.tsx` / `PublicHeaderWithPath.tsx` は存在しないため削除対象外（Phase 1 是正済み）。

### 保持

- `apps/web/src/components/public/PublicFooter.tsx`（shell children 末尾に配置）

## layout 実装スケッチ

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

> `SidebarShellServer` 内部で `getSession()` → role 判定 → `<SidebarUserMenu role user />` を組み立てる。
> admin ユーザーが `/profile` を開くと role=admin が選ばれ、sidebar に ADMIN グループも表示される（親仕様通り）。

## activePath / x-pathname の扱い（middleware 不変 / AC-C8）

`x-pathname` は middleware 未配線。auth middleware は変更しない（AC-C8）。よって:

1. `headers().get("x-pathname") ?? "/"`（または `"/profile"`）で **fallback** を持つ。
2. active state の最終確定は client 側 `usePathname()`（Task A の `isNavItemActive` が client で評価）に委ねる graceful degradation。
3. SSR 初期 active は fallback ベース（flash しない範囲）。これは Task A の責務範囲で吸収される設計とする。

> middleware への `x-pathname` 注入は別 surface（auth 境界）への変更となり AC-C8 / 不変条件 #4 に抵触するため、本タスクでは行わない。
> もし Task A が `activePath` を必須とし fallback だけでは active 表示が崩れる場合は、Phase 12 で未タスク（middleware `x-pathname` 注入の是非）として検出する。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 再利用 | 内容 |
| --- | --- |
| ✅ `SidebarShellServer`（A） | role 判定・nav・UserMenu を内包。Task C は mount のみ |
| ✅ `SidebarUserMenu`（B） | SignOut / profile / 編集申請を内包 |
| ✅ `SidebarMobileTrigger`（E） | mobile drawer trigger |
| ✅ `PublicFooter` | 既存をそのまま保持 |
| ❌ 新規 UI | 作らない（配線のみ） |

## SubAgent lane / validation path

| lane | 並列 | 内容 |
| --- | --- | --- |
| Lane-1 | seq | route 移動（`git mv`）→ 相対 import 補修 |
| Lane-2 | seq（Lane-1 後） | layout async 化 + shell mount |
| Lane-3 | par | page header 剥がし（`/` page / profile page） |
| Lane-4 | par | 旧 component + spec 削除 |
| Validation | seq（締め） | typecheck → lint → focused test → grep gate |

## ステップ間状態引き渡し（route 移動の影響表）

| 移動 page | 相対 import の変化 | colocated test | smoke / harness 参照 |
| --- | --- | --- | --- |
| `page.tsx` → `(public)/page.tsx` | `../src/...` → `../../src/...`（1 段深くなる）。`@/` alias は不変 | `page.spec.tsx` を同時移動 | `app/__tests__/layout.spec.tsx` の root layout 参照は不変（root layout は移動しない） |
| `privacy/page.tsx` → `(public)/privacy/page.tsx` | `../../src/...` → `../../../src/...` | なし | なし |
| `terms/page.tsx` → `(public)/terms/page.tsx` | 同上 | なし | なし |
| `login/` dir → `(public)/login/` | dir 内相対は不変（dir ごと移動）、dir 外参照のみ深度補正 | `__tests__/` / `*.spec.tsx` 同時移動 | login error/loading spec の相対参照確認 |

## エラーハンドリング・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `headers()`（x-pathname or fallback）、children |
| 出力 | shell でラップされた DOM |
| 副作用 | なし（API call なし、D1 なし）。session 取得は `SidebarShellServer` 内部 |
| エラー | `getSession` 失敗時は shell 内部で role=viewer fallback（Task A 仕様）。layout は throw しない |

## 完了条件

ファイル移動 / 編集 / 削除の一覧と layout スケッチ・状態引き渡し表が確定し、Phase 3 review gate へ trace 可能。
