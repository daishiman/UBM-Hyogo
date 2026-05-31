# Phase 2: 設計

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 実装区分: **実装仕様書**
- 前 Phase: 1（要件定義） / 次 Phase: 3（設計レビュー）
- concern 数: 3（layout 新形 / 削除スコープ / Task A 契約境界）→ 単一 `phase-2.md` 内でセクション分割

## 目的

Phase 1 で固定した実態と AC を、(1) layout の新形、(2) 旧 `AdminSidebar` 削除スコープ、
(3) Task A `SidebarShellServer` との契約境界（特に schemaDiffCount の SSOT）に落とし込む。

## 実行タスク

- タスク1: layout 新形の設計（import / props / DOM contract 維持）
- タスク2: 削除スコープの確定（6 ファイル + grep gate）
- タスク3: Task A 契約境界の固定（schemaDiffCount SSOT / activePath / mobileTriggerSlot）

## 実行手順

### ステップ1: layout 新形の設計（concern 1）

移行後の `apps/web/app/(admin)/layout.tsx`（**相対 import**・実コード規約に合わせる。`@/` alias は現行未使用）:

```tsx
// apps/web/app/(admin)/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession } from "../../src/lib/session";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server"; // Task A
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger"; // Task E（mobileTriggerSlot）

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin"); // AC-3: 既存契約維持
  if (!session.isAdmin) redirect("/login?gate=forbidden"); // AC-4: fail-closed

  return (
    <div
      data-testid="admin-shell"
      data-theme="cool"
      data-route-group="admin"
      data-shell-mode="sidebar"
    >
      <SidebarShellServer
        activePath="/admin"
        mobileTriggerSlot={<SidebarMobileTrigger />}
      >
        {children}
      </SidebarShellServer>
    </div>
  );
}
```

#### 設計上の決定

| 決定 | 内容 | 根拠 |
| --- | --- | --- |
| import 形式 | 相対 import（`../../src/...`） | 現行 layout.tsx が相対 import。`@/` alias は admin layout 周辺で未使用 |
| auth guard | layout に残す（shell へ移譲しない） | guard は route group 境界の責務。SidebarShellServer も内部で session を読むが、redirect 判断は layout が持つ（root proxy.ts と二段防御・親不変条件 #11） |
| `redirect('/login?next=/admin')` | null session 時 | 既存 spec が assert（回帰防止・AC-3） |
| `data-*` 属性 | 移行後も `admin-shell` div に維持 | 既存 layout.spec の shell DOM contract（AC-7）。`force-dynamic` も維持 |
| `activePath="/admin"` | 固定 seed | x-pathname 不在のため server で実 pathname を解決しない。active state は SidebarNavItem（Task A・client）の `usePathname()` が決定する。`activePath` は SSR 初期表示 / test の seed のみ（phase-1 乖離補正 #5） |
| schemaDiffCount | layout から渡さない | SidebarShellServer が内部で算出（下記 concern 3） |
| user chip / SignOut | layout から消す | SidebarUserMenu（Task B）へ移譲（旧 layout の `<aside>` 内 chip は削除） |

> 注: 旧 layout の `<aside class="hidden md:block">` ラッパは SidebarShell（Task A）内部の `<aside>` に統合される。
> layout は `data-shell-mode="sidebar"` を持つ外側 div のみ保持する。Phase 4 で DOM contract の差分を test 化する。

### ステップ2: 削除スコープの確定（concern 2）

`git grep -ln AdminSidebar apps/web` と各シンボルの consumer を Phase 1 で確認済み。削除対象:

| # | ファイル | 削除理由 | 残存 consumer |
| --- | --- | --- | --- |
| 1 | `apps/web/src/components/layout/AdminSidebar.tsx` | SidebarShell へ置換 | 0（layout 書換後） |
| 2 | `apps/web/src/components/layout/AdminSidebarNavItem.tsx` | AdminSidebar 専用子 | `components/layout/` 内のみ |
| 3 | `apps/web/src/components/layout/AdminBrandBlock.tsx` | AdminSidebar からのみ参照（orphan 化） | `AdminSidebar.tsx` のみ → 削除後 0 |
| 4 | `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | 対象削除に伴う | — |
| 5 | `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | 同上 | — |
| 6 | `apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx` | 同上 | — |

**削除前の最終確認（Phase 5 実装時）**: `git grep -ln "AdminBrandBlock\|AdminSidebarNavItem" apps/web/src/components/shell` で
Task A が orphan を再利用していないことを確認してから削除する（再利用していれば削除対象から外し Phase 3 へ差戻し）。

### ステップ3: Task A 契約境界の固定（concern 3）— dependency matrix

| 共有境界 | owner（canonical 編集権） | co-owner（参照側） | 同期タイミング |
| --- | --- | --- | --- |
| `SidebarShell.server.tsx#SidebarShellServer` props | Task A | Task D（本タスク・呼出側） | A 完了 → D 実装着手 |
| schemaDiffCount 算出ロジック | Task A（shell 内部へ移設） | Task D（旧 layout から移設元を削除） | A 完了時 same-wave |
| `SidebarMobileTrigger` | Task E | Task D（mobileTriggerSlot に注入） | E 完了 → D 配線 |

#### schemaDiffCount SSOT 決定（仕様語 ↔ 実装語の対応表）

| 仕様語 | 実装語（実コード） | 移行後の所在 |
| --- | --- | --- |
| 「schemaDiff badge」 | `safeServerFetch<SchemaDiffListView>("/admin/schema/diff")` → `items.filter(i => i.status === "queued").length` | **Task A の `SidebarShellServer` 内部**（または共有 helper `apps/web/src/lib/admin/schema-diff-count.ts`）へ移設 |
| 「失敗時 count=0」 | `if (!result.ok) return 0` | 同上（既存挙動維持・AC-6） |

**契約**: 本タスク（D）は旧 `layout.tsx#loadSchemaDiffCount` を**削除**し、count 算出責務を Task A へ委譲する。
Task A が `SidebarShellServer` 内で同等ロジック（`safeServerFetch("/admin/schema/diff")` + queued filter + 失敗時 0）を
実装することを前提とする。**もし A 完了時点で count 算出が shell に無い場合**は、Phase 5 で
`apps/web/src/lib/admin/schema-diff-count.ts` に純関数 + fetch helper を抽出し、A・D 双方が import する
（owner=Task D が helper を新設、A が呼ぶ）形へフォールバックする。この分岐は Phase 3 で MINOR 追跡する。

### ステップ4: validation matrix（command 単位）

| command | 目的 | 実在確認 |
| --- | --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)` | layout.spec 実行 | `@ubm-hyogo/web` に `test` script 実在 |
| `mise exec -- pnpm typecheck` | 型整合 | ルート script 実在 |
| `mise exec -- pnpm lint` | lint | ルート script 実在 |
| `git grep -l "components/layout/AdminSidebar"` | 削除完了 gate | — |
| `bash scripts/coverage-guard.sh` | coverage | 実在 |

## 統合テスト連携

- layout.spec.tsx の mock 構成（`next/navigation` の `redirect` throw / `usePathname`、`getSession`、
  `safeServerFetch`）は既存を踏襲しつつ、SidebarShellServer 移行に合わせて
  `../../src/components/shell/SidebarShell.server` の mock を追加する（Phase 4 で詳細化）。

## 多角的チェック観点（AIが判断）

- DI 境界: SidebarShellServer は具象 `getSession` を内部参照する Server Component。layout は props を渡すのみ。
- 二段防御（root proxy.ts + layout guard）を壊さない。
- 削除と mount の順序を誤ると一時的に build 不能 → Phase 5 で「mount 書換 → 削除 → grep」の順を固定。

## サブタスク管理

- 単一責務。concern 分割のみ（本ファイル内）。

## 成果物

- 本 Phase: layout 新形 / 削除スコープ表 / Task A 契約 + schemaDiffCount SSOT 決定（本ファイル）。

## 完了条件

- [ ] layout 新形（import / guard / DOM contract / activePath 方針）を確定した
- [ ] 削除 6 ファイルと grep gate を確定した
- [ ] schemaDiffCount SSOT（Task A 委譲 + フォールバック helper）を決定した
- [ ] validation matrix を実在 script で記述した

## タスク100%実行確認【必須】

- [ ] 3 concern すべて設計済み
- [ ] placeholder（x-pathname / getSchemaDiffCount）を設計本文に持ち込んでいない

## 次Phase

Phase 3（設計レビュー）。
