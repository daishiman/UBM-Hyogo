# Phase 5 — Implementation

## 1. 変更対象ファイル

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/src/components/layout/MemberHeader.tsx` | 編集 |
| 2 | `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 新規 or 編集 |
| 3 | `apps/web/app/(member)/layout.tsx` | 編集 |
| 4 | `apps/web/src/lib/auth-view/{types,resolveAuthView,getAuthView,index}.ts` | 新規 |
| 5 | `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | 新規 |

## 2. 実装手順

### Step 1: `auth-view` 最小基盤作成

`apps/web/src/lib/auth-view/` を追加し、`AuthView` / `resolveAuthView()` / `getAuthView()` / barrel export を提供する。`getAuthView()` は `getSession()` を呼び、例外は `{ kind: "guest" }` に吸収する。

### Step 2: `MemberHeader.tsx` 編集

Phase 2 §1.1 のシグネチャを適用する。具体的な差分:

- `import type { AuthView } from "../../lib/auth-view";` 追加
- `MemberHeaderProps` interface を追加
- 関数シグネチャを `MemberHeader({ authView }: MemberHeaderProps = {})` に変更
- `<header>` の `data-auth-state` 属性を追加（`isAdmin ? "admin" : "member"`）
- `<nav>` 内に condition 描画 `{isAdmin && <a href="/admin" data-role="admin-cta" aria-label="管理ダッシュボードへ移動">管理</a>}` を追加
- 既存 brand / "マイページ" / "公開ページ" / `<SignOutButton />` は不変

### Step 3: `(member)/layout.tsx` 編集

- `import { getAuthView } from "../../src/lib/auth-view";` 追加
- `export default function` → `export default async function` に変更
- 関数冒頭で `const authView = await getAuthView();` を実行
- `<MemberHeader />` → `<MemberHeader authView={authView} />` に変更
- 既存 `data-theme="warm"` / `data-route-group="member"` / `data-testid="member-shell"` / `data-shell="topbar"` は不変

### Step 4: `MemberHeader.spec.tsx` 作成 / 更新

Phase 4 §2 の TC-1〜TC-6 を Vitest + `@testing-library/react` で記述する。例:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemberHeader } from "../MemberHeader";

describe("MemberHeader", () => {
  it("authView 未指定で data-auth-state=member, admin リンクなし", () => {
    render(<MemberHeader />);
    const header = screen.getByTestId("member-header");
    expect(header.getAttribute("data-auth-state")).toBe("member");
    expect(header.querySelector('[data-role="admin-cta"]')).toBeNull();
  });

  it("authView.kind=member で admin リンクなし", () => {
    render(<MemberHeader authView={{ kind: "member", profileHref: "/profile" }} />);
    expect(screen.getByTestId("member-header").querySelector('[data-role="admin-cta"]')).toBeNull();
  });

  it("authView.kind=admin で admin リンク表示", () => {
    render(
      <MemberHeader
        authView={{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }}
      />,
    );
    const link = screen.getByTestId("member-header").querySelector('[data-role="admin-cta"]');
    expect(link?.getAttribute("href")).toBe("/admin");
    expect(link?.getAttribute("aria-label")).toBe("管理ダッシュボードへ移動");
  });

  it("全ケースで SignOutButton / brand / nav links が存在", () => {
    for (const view of [
      undefined,
      { kind: "member", profileHref: "/profile" } as const,
      { kind: "admin", profileHref: "/profile", adminHref: "/admin" } as const,
    ]) {
      const props = view === undefined ? {} : { authView: view };
      const { unmount } = render(<MemberHeader {...props} />);
      expect(screen.getByTestId("sign-out-button")).toBeInTheDocument();
      expect(screen.getByLabelText("UBM 兵庫")).toBeInTheDocument();
      expect(screen.getByText("マイページ")).toBeInTheDocument();
      expect(screen.getByText("公開ページ")).toBeInTheDocument();
      unmount();
    }
  });
});
```

## 3. 完了判定（CONST_005）

- [x] 変更対象 8 ファイルが上記の通り編集 / 新規作成済み
- [x] 関数シグネチャが Phase 2 §1.1 と一致
- [x] 入出力・副作用が Phase 2 §4 と一致
- [x] テスト方針（Phase 4 §2 TC-1〜7）が `MemberHeader.spec.tsx` / `resolveAuthView.spec.ts` に反映済み
- [x] ローカル実行: `mise exec -- pnpm typecheck` / `pnpm lint` / focused `vitest run` 3 つすべて green
- [x] DoD: index.md `## 完了条件` 全項目クリア

## 4. リスクと回避

| リスク | 回避策 |
|-------|--------|
| `getAuthView()` が存在しない | 本 cycle で `apps/web/src/lib/auth-view/` を追加し blocker を解消 |
| layout の async 化で hydration mismatch | Server Component のみで完結。Client Component には `authView` を渡さない（`MemberHeader` 自体は SSR で描画されるが、内部に `SignOutButton` client island を含む既存パターン継続） |
| `adminHref` の値ドリフト | リテラル `/admin` を採用し型の union 名だけで合意 |
