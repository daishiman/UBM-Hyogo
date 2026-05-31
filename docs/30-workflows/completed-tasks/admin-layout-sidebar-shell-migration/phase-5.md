# Phase 5: 実装

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 前 Phase: 4（テスト計画） / 次 Phase: 6（回帰確認）
- 実装区分: **実装仕様書**（CONST_004 判定根拠は `index.md` 参照）
- 実装着手ゲート: **Task A / Task B 完成が物理前提**（phase-3.md NO-GO 条件）。`apps/web/src/components/shell/` 不在の間は本 Phase に進まない。
- 検証コマンド: `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)/layout.spec.tsx`

## 目的

`apps/web/app/(admin)/layout.tsx` を `SidebarShellServer` ベースへ書き換え、旧 `AdminSidebar` 系 6 ファイルを物理削除し、
既存 `layout.spec.tsx` を Phase 4 マトリクスへ書き換える。完了 gate は
`git grep -l "components/layout/AdminSidebar"` の **ヒット 0 件**（AC-2）。

## `.claude` 正本更新の要否

本タスクは admin layout の実装書き換えであり、`.claude/skills/**` 配下の正本仕様を変更する内容を含まない。
**`.claude` 正本更新は本 Phase では該当なし**。skill への知見反映（lessons-learned / inventory 等）は Phase 12 の
skill-feedback-report で扱う。

## 実装着手ゲート（NO-GO 再掲）

以下のいずれかが成立する間は **本 Phase に着手しない**（phase-3.md NO-GO 条件と同義）:

1. `apps/web/src/components/shell/SidebarShell.server.tsx` の `SidebarShellServer({ activePath, children, mobileTriggerSlot })` 未実装、または props 契約が phase-2 設計と乖離。
2. Task B の admin role `SidebarUserMenu`（4 action）未実装。
3. schemaDiffCount SSOT 未確定（Task A 内算出も helper 抽出も未合意）。
4. `SidebarMobileTrigger`（Task E）未提供（暫定で空 slot を許容するが Phase 11 で要確認）。

## 実行タスク

- タスク1: `layout.tsx` を `SidebarShellServer` 形へ書き換える（guard + DOM contract のみ残す）。
- タスク2: schemaDiffCount SSOT を確定する（Task A 内算出 / フォールバック helper 抽出）。
- タスク3: 旧 `AdminSidebar` 系 6 ファイルを物理削除する。
- タスク4: `layout.spec.tsx` を Phase 4 マトリクスへ書き換える。
- タスク5: `git grep` gate で旧コンポーネント参照 0 件を確認する。

## 実行手順（順序厳守）

順序を誤ると一時的に build 不能になる（削除を先行すると `layout.tsx` の import が壊れる）。**(a)→(b)→(c)→(d)→(e)** の順で実施する。

### ステップ (a): `layout.tsx` を SidebarShellServer 形へ書き換える

移行後の `apps/web/app/(admin)/layout.tsx`（phase-2.md 再掲・相対 import・実コード規約に合わせる）:

```tsx
// apps/web/app/(admin)/layout.tsx
// admin-layout-sidebar-shell-migration:
// - 旧 AdminSidebar（client）を撤去し SidebarShellServer（Task A）へ委譲。
// - layout の責務を auth guard + shell 呼び出し + admin shell DOM contract 維持へ縮約。
// 不変条件 #11 維持: session.isAdmin !== true は redirect（root proxy.ts と layout guard の二段防御）。
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession } from "../../src/lib/session";
import { SidebarShellServer } from "../../src/components/shell/SidebarShell.server"; // Task A
import { SidebarMobileTrigger } from "../../src/components/shell/SidebarMobileTrigger"; // Task E

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
      className="ubm-admin-shell min-h-screen bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-testid="admin-shell"
      data-theme="cool"
      data-route-group="admin"
      data-shell-mode="sidebar"
    >
      <SidebarShellServer
        activePath="/admin"
        mobileTriggerSlot={<SidebarMobileTrigger />}
      >
        <main
          className="flex min-w-0 flex-col gap-4 p-4 md:p-6"
          data-route="admin"
          data-section-rhythm="compact"
        >
          {children}
        </main>
      </SidebarShellServer>
    </div>
  );
}
```

#### ステップ (a) の決定事項（DOM contract）

| 維持する点 | 備考 |
| --- | --- |
| `data-testid="admin-shell"` / `data-theme="cool"` / `data-route-group="admin"` / `data-shell-mode="sidebar"` | 外側 div に維持（AC-7） |
| `<main data-route="admin">` | children ラッパとして維持（AC-7） |
| `export const dynamic = "force-dynamic"` | 維持 |
| `redirect("/login?next=/admin")` / `redirect("/login?gate=forbidden")` | 既存契約維持（AC-3/AC-4） |

| 撤去する点 | 移譲先 |
| --- | --- |
| `import { AdminSidebar }` / 旧 `<aside class="hidden md:block">` | `SidebarShellServer` 内部の sidebar（Task A） |
| `loadSchemaDiffCount()` / `safeServerFetch("/admin/schema/diff")` の呼び出し | schemaDiffCount SSOT（ステップ (b)） |
| user chip / `SignOutButton` の embed | `SidebarUserMenu`（Task B） |

> `<main>` を layout が持つか shell が持つかは Task A 契約に依存する。`SidebarShellServer` が内部で `<main>` を描画する設計なら、layout の `<main>` ラッパは二重化を避けるため shell へ寄せ、layout は children をそのまま渡す。`SidebarShellServer` が children をそのまま描画する設計なら上記コードのとおり layout が `<main data-route="admin">` を保持する。**Task A の実装を確認し、`main[data-route="admin"]` が DOM 上に 1 つだけ存在する形に調整する**（AC-7 / TC-03）。

### ステップ (b): schemaDiffCount SSOT の確定

移行前 `layout.tsx#loadSchemaDiffCount` は `safeServerFetch<SchemaDiffListView>("/admin/schema/diff")` の
`items.filter(i => i.status === "queued").length`（失敗時 0）。この算出責務を以下のいずれかへ移設する。

| 分岐 | 条件 | 対応 |
| --- | --- | --- |
| 第一案（推奨） | Task A の `SidebarShellServer` が内部で同等ロジックを実装済み | layout から count 算出を**完全に削除**。layout は count を渡さない |
| フォールバック（TECH-M-01） | Task A 完了時点で shell に count 算出が無い | `apps/web/src/lib/admin/schema-diff-count.ts` に純関数 + fetch helper を新設し、Task A・D 双方が import する（owner=Task D が新設、A が呼ぶ） |

#### フォールバック helper の形（フォールバック採用時のみ新設）

```ts
// apps/web/src/lib/admin/schema-diff-count.ts
import { safeServerFetch } from "./safe-server-fetch";
import type { SchemaDiffListView } from "../../components/admin/SchemaDiffPanel";

export function countQueuedDiffs(view: SchemaDiffListView): number {
  return view.items.filter((item) => item.status === "queued").length;
}

export async function loadSchemaDiffCount(): Promise<number> {
  const result = await safeServerFetch<SchemaDiffListView>("/admin/schema/diff");
  if (!result.ok) return 0;
  return countQueuedDiffs(result.data);
}
```

> フォールバックを採用した場合、`countQueuedDiffs` は純関数として単体テスト（queued のみ count / 空配列 0 / 失敗時 0）を `apps/web/src/lib/admin/schema-diff-count.spec.ts` に追加する（invariant #8: `*.spec.ts`）。第一案（Task A 内算出）なら helper は新設しない。どちらを採ったかを Phase 6 / Phase 9 で記録する（TECH-M-01 解決確認）。

### ステップ (c): orphan 再利用チェック → 6 ファイル削除

削除前に Task A が orphan を再利用していないことを確認する:

```bash
git grep -ln "AdminBrandBlock\|AdminSidebarNavItem" apps/web/src/components/shell
```

ヒットがあれば該当ファイルは削除対象から外し、Phase 3 へ差し戻す（再利用なら orphan ではない）。
ヒット 0 件を確認後、以下 6 ファイルを物理削除する:

| # | 削除ファイル |
| --- | --- |
| 1 | `apps/web/src/components/layout/AdminSidebar.tsx` |
| 2 | `apps/web/src/components/layout/AdminSidebarNavItem.tsx` |
| 3 | `apps/web/src/components/layout/AdminBrandBlock.tsx` |
| 4 | `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` |
| 5 | `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` |
| 6 | `apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx` |

```bash
git rm apps/web/src/components/layout/AdminSidebar.tsx \
       apps/web/src/components/layout/AdminSidebarNavItem.tsx \
       apps/web/src/components/layout/AdminBrandBlock.tsx \
       apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx \
       apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx \
       apps/web/src/components/layout/__tests__/AdminSidebarNavItem.spec.tsx
```

> 削除後 `__tests__/` ディレクトリが空になる場合はディレクトリも残さない（git は空ディレクトリを追跡しないため自然に消える）。

### ステップ (d): `layout.spec.tsx` を Phase 4 マトリクスへ書き換える

`apps/web/app/(admin)/layout.spec.tsx`（**既存ファイルを書き換え**・新設しない）を Phase 4 の TC-01〜TC-08 へ更新する。

- mock に `../../src/components/shell/SidebarShell.server` を追加（Phase 4 方針 A/B のどちらかを Task A 実態に合わせて確定）。
- 旧 `[data-shell="topbar"]` / `[data-component="admin-breadcrumb-slot"]` / `[data-component="admin-topbar-actions"]` / `[data-component="user-chip*"]` への assert を削除し、TC-03（shell mount + main 配下 children）へ差し替える。
- `[data-shell="sidebar"]` の `hidden md:block` への直接 assert は SidebarShell 内部構造へ移譲されるため削除する。
- TC-04（全 13 item href 集合）/ TC-05/06（badge）を追加・更新する。
- TC-01/02/07/08（redirect 2 件 / 単独『管理』なし / axe critical 0）は維持する。

### ステップ (e): grep gate で 0 件確認

```bash
git grep -l "components/layout/AdminSidebar"
```

**ヒット 0 件**を確認する（AC-2）。1 件でも残れば未削除参照があるため (a)〜(d) を見直す。

## 初回 validation（Phase 5 内）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)/layout.spec.tsx
mise exec -- pnpm typecheck
git grep -l "components/layout/AdminSidebar"   # → 0 件
```

## 参照資料

- phase-2.md（layout 新形・削除スコープ表・schemaDiffCount SSOT 決定）
- phase-4.md（TC-01〜08 マトリクス・mock 構成）
- 実コード: `apps/web/app/(admin)/layout.tsx`（移行前） / `apps/web/src/components/layout/AdminSidebar.tsx`（nav 13 item の正本）
- `apps/web/src/lib/admin/safe-server-fetch.ts` / `apps/web/src/lib/session.ts`

## 統合テスト連携

- 書き換え後の `layout.spec.tsx` が Phase 4 TC-01〜08 を green にする。
- 削除した 3 spec の検証責務は layout.spec（TC-04/05/06）と Task A spec へ集約済み（Phase 4 統合テスト連携参照）。

## 多角的チェック観点（AIが判断）

- **順序厳守**: mount 書換 (a) → SSOT (b) → 削除 (c) → spec 書換 (d) → grep (e)。削除先行は禁止。
- `main[data-route="admin"]` が DOM 上に 1 つだけ存在する形に調整（layout / shell の二重 main を避ける）。
- placeholder（`x-pathname` / `getSchemaDiffCount`）を実装本文へ持ち込まない。
- HEX 直書き禁止。色は `var(--ubm-color-*)` のみ（不変条件 #1）。
- D1 / API 追加変更なし（不変条件 #6）。`getSession()` + 既存 `safeServerFetch` のみで描画する。

## サブタスク管理

- 単一責務。サブタスク分割なし。

## 成果物

- 本 Phase（コード成果物・`outputs/` には置かない）:
  - `apps/web/app/(admin)/layout.tsx`（書き換え）
  - `apps/web/app/(admin)/layout.spec.tsx`（書き換え）
  - 6 ファイル削除
  - フォールバック採用時のみ `apps/web/src/lib/admin/schema-diff-count.ts` + `.spec.ts`

## 完了条件

- [ ] `layout.tsx` を `SidebarShellServer` 形へ書き換え、`import { AdminSidebar }` を含まない（AC-1）
- [ ] schemaDiffCount SSOT を確定した（Task A 内算出 / フォールバック helper のいずれか・TECH-M-01）
- [ ] 6 ファイルを物理削除した
- [ ] `layout.spec.tsx` を TC-01〜08 へ書き換えた
- [ ] `git grep -l "components/layout/AdminSidebar"` が 0 件（AC-2）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/\(admin\)/layout.spec.tsx` が green
- [ ] `mise exec -- pnpm typecheck` が green
- [ ] DOM contract（`data-testid="admin-shell"` 等 + `main[data-route="admin"]` 1 つ）を維持した（AC-7）

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] 実装着手ゲート（Task A/B 完成）を満たしてから着手した
- [ ] 実装順序 (a)→(e) を守り、削除先行による build 不能を発生させていない

## 次Phase

Phase 6（回帰確認）。
