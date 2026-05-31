# Implementation Guide — admin-layout-sidebar-shell-migration

## Part 1: Middle-School Explanation

なぜ必要か: admin 画面だけが古い `AdminSidebar` を持ち続けると、親 workflow が作る新しい `SidebarShell` と nav 所有者が二重になる。二重所有は badge、active 表示、ユーザーメニューの修正漏れを生むため、admin layout の責務を入口チェックだけに戻す必要がある。

何をするか: admin layout はログイン済みか、管理者かだけを確認する。通ってよい人なら `SidebarShellServer` に画面の棚、ナビ、badge、ユーザーメニューを任せる。

たとえば教室の入口チェック係のイメージ。入口係は名簿を見て入室可否だけ決め、教室内の席や棚の配置は別の係に任せる。古い棚が残っていると生徒が迷うため、移行後は古い棚を片付ける。

### 今回作ったもの

- Task A: `apps/web/src/components/shell/` の shell primitive 群（`SidebarShellServer` / `SidebarShell` / nav / brand / collapse toggle / context / state hook / icons / `shell-config.ts`）。
- Task B: `SidebarUserMenu` / `SidebarUserAvatar` / `user-menu-config.ts`（3 role action 集合・`SignOutButton` embed）。
- Task D: `apps/web/app/(admin)/layout.tsx` を `SidebarShellServer` 委譲へ移行 + 旧 `AdminSidebar` 系 6 ファイル削除 + `layout.spec.tsx` 書き換え。
- Task E 最小: `SidebarMobileTrigger`（mobileTriggerSlot へ注入する drawer 起動ボタン）。
- helper: `apps/web/src/lib/admin/schema-diff-count.ts`（schemaDiffCount SSOT）。
- Phase 1-13 spec + Phase 12 strict 7 + aiworkflow-requirements 到達 ledger（quick-reference / resource-map / active ledger / artifact inventory）。

## Part 2: Technical Contract

### TypeScript 型定義

```tsx
import type { ReactNode } from "react";

type AdminLayoutProps = {
  readonly children: ReactNode;
};

// SidebarShellServer（Task A）は role を内部で getSession() から導出する。
// admin layout からは activePath（SSR/test seed）と mobileTriggerSlot のみを渡す。
type SidebarShellServerProps = {
  readonly children: ReactNode;
  readonly activePath?: string;
  readonly mobileTriggerSlot?: ReactNode;
};
```

### APIシグネチャ

```ts
declare function getSession(): Promise<SessionUser | null>;
// safeServerFetch は result オブジェクト（discriminated union）を返す。throw しない。
declare function safeServerFetch<T>(
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; error: { code: string; message: string } }>;
// schemaDiffCount SSOT（apps/web/src/lib/admin/schema-diff-count.ts）
declare function loadSchemaDiffCount(): Promise<number>;
declare function AdminLayout(props: AdminLayoutProps): Promise<JSX.Element>;
```

The layout keeps the existing session and fetch contracts. It does not add a new API endpoint, D1 table, IPC channel, Cloudflare binding, or npm package.

### 使用例

```tsx
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/login?gate=forbidden");

  return (
    <div
      className="ubm-admin-shell min-h-screen bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-testid="admin-shell"
      data-theme="cool"
      data-route-group="admin"
      data-shell-mode="sidebar"
    >
      <SidebarShellServer activePath="/admin" mobileTriggerSlot={<SidebarMobileTrigger />}>
        <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6" data-route="admin" data-section-rhythm="compact">
          {children}
        </main>
      </SidebarShellServer>
    </div>
  );
}
```

### エラーハンドリング

- `getSession()` が `null` の場合は `/login?next=/admin` へ redirect する。
- admin 以外の role は `/login?gate=forbidden` へ redirect し、shell を描画しない。
- schema diff fetch が失敗した場合は count を `0` 相当に落とし、warn badge を非表示にする。

### エッジケース

- shell primitives（Task A/B/E）は本 wave で実装済み。`apps/web/src/components/shell/` が SSOT。
- server で `x-pathname` を読まない。active state は client `usePathname()` 所有（`SidebarNavItem`）。`activePath` prop は SSR/test seed のみ。
- semantic `<main>` は layout 所有（shell は chrome のみ）。`<main>` の二重化を避ける（layout.spec TC-03 で 1 個固定を検証）。
- old `AdminSidebar` import は完全除去済み（`git grep components/layout/AdminSidebar` = 0 hit）。

### 設定項目と定数一覧

| Item | Value |
| --- | --- |
| route group | `admin` |
| data theme | `cool` |
| shell mode | `sidebar` |
| unauthenticated redirect | `/login?next=/admin` |
| forbidden redirect | `/login?gate=forbidden` |
| package name | `@ubm-hyogo/web` |

### テスト構成

| Test | Purpose |
| --- | --- |
| `apps/web/app/(admin)/layout.spec.tsx` | session null redirect / forbidden redirect / admin shell DOM contract / single `<main>` / axe critical 0（TC-01/02/03/07/08） |
| `apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx` | role→nav→schemaDiffCount→shell（TC-04/05/06 相当） |
| `apps/web/src/components/shell/__tests__/{SidebarShell,SidebarUserMenu,useSidebarState}.spec.tsx` / `{shell-config,user-menu-config}.spec.ts` | nav 13 item / active state / collapse sr-only / 3 role action 集合 |
| `apps/web/src/lib/admin/schema-diff-count.spec.ts` | queued のみ count / 失敗時 0 |
| grep gate | `components/layout/AdminSidebar` references = 0（検証済み） |
| focused web test | `mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/shell apps/web/app/\(admin\)/layout.spec.tsx apps/web/src/lib/admin/schema-diff-count.spec.ts` |
| local result | typecheck 6/6 Done / lint OK / web Vitest 1299 passed・1 skipped |
| visual evidence | 9 admin routes plus forbidden redirect（staging deploy 必須・user-gated） |

### Follow-up（分離タスク）

| Follow-up | Issue | 内容 | 仕様書 |
| --- | --- | --- | --- |
| FU-ALSSM-001 | [#1024](https://github.com/daishiman/UBM-Hyogo/issues/1024) | sidebar collapse 状態の cookie 永続化（`scripts/lint-boundaries.mjs` の storage 禁止を回避し in-memory → cookie 化）。親 workflow `unified-sidebar-shell-public-and-admin` 所有 | `docs/30-workflows/unassigned-task/unified-sidebar-shell-public-and-admin-followup-001-sidebar-collapse-cookie-persistence.md` |
