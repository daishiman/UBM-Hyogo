# Phase 4 — テスト計画（TDD RED）

## 1. テストファイル

| パス | 種別 | 件数 |
|------|------|-----|
| `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | 新規 unit | 4 |
| `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` | 編集 (既存 2 + 追加) | 6+ |

## 2. `resolveAuthView.spec.ts`

```ts
import { describe, it, expect } from "vitest";
import { resolveAuthView } from "../resolveAuthView";

describe("resolveAuthView", () => {
  it("TC-RAV-01: null session → guest", () => {
    expect(resolveAuthView(null)).toEqual({ kind: "guest" });
  });

  it("TC-RAV-02: empty memberId → guest", () => {
    expect(resolveAuthView({ user: { memberId: "" } })).toEqual({ kind: "guest" });
  });

  it("TC-RAV-03: memberId only → member", () => {
    expect(resolveAuthView({ user: { memberId: "m1" } }))
      .toEqual({ kind: "member", profileHref: "/profile" });
  });

  it("TC-RAV-04: memberId + isAdmin=true → admin", () => {
    expect(resolveAuthView({ user: { memberId: "m1", isAdmin: true } }))
      .toEqual({ kind: "admin", profileHref: "/profile", adminHref: "/admin" });
  });
});
```

## 3. `PublicHeader.spec.tsx`

```ts
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicHeader } from "../PublicHeader";

async function renderAsync(props?: Parameters<typeof PublicHeader>[0]) {
  const element = await PublicHeader(props);
  return render(element);
}

describe("PublicHeader", () => {
  it("TC-PH-01: brand + nav 3 link を描画（既存 retention）", async () => {
    await renderAsync({ authView: { kind: "guest" } });
    expect(screen.getByText(/UBM/i)).toBeInTheDocument();
    // 3 nav link 存在確認
  });

  it("TC-PH-02: guest → data-auth-state=guest + /login link", async () => {
    const { container } = await renderAsync({ authView: { kind: "guest" } });
    expect(container.querySelector("header")?.getAttribute("data-auth-state")).toBe("guest");
    expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute("href", "/login");
  });

  it("TC-PH-03: member → member-cta + sign-out + /login 不存在", async () => {
    const { container } = await renderAsync({
      authView: { kind: "member", profileHref: "/profile" },
    });
    expect(container.querySelector("header")?.getAttribute("data-auth-state")).toBe("member");
    expect(container.querySelector('[data-role="member-cta"]')).toHaveAttribute("href", "/profile");
    expect(container.querySelector('[data-testid="sign-out-button"]')).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ログイン" })).toBeNull();
  });

  it("TC-PH-04: admin → admin-cta + member-cta 両方", async () => {
    const { container } = await renderAsync({
      authView: { kind: "admin", profileHref: "/profile", adminHref: "/admin" },
    });
    expect(container.querySelector("header")?.getAttribute("data-auth-state")).toBe("admin");
    expect(container.querySelector('[data-role="member-cta"]')).toHaveAttribute("href", "/profile");
    expect(container.querySelector('[data-role="admin-cta"]')).toHaveAttribute("href", "/admin");
  });

  it("TC-PH-05: currentPath で aria-current=page 付与（既存 retention）", async () => {
    await renderAsync({ authView: { kind: "guest" }, currentPath: "/members" });
    const link = screen.getByRole("link", { name: /会員/ });
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("TC-PH-06: authView 省略時は getAuthView fallback（guest 描画）", async () => {
    // getAuth モック未設定環境では guest になる
    const { container } = await renderAsync();
    expect(container.querySelector("header")?.getAttribute("data-auth-state")).toBe("guest");
  });
});
```

## 4. 期待値（TDD RED 段階）

- 全 10 ケースが「未実装で fail」する状態を Phase 5 着手前に確認。
- 実装後 Phase 6 で全 PASS を観測。

## 5. テスト操作対象（VSCPKR-03）

| ケース | 操作対象 | 種別 |
|--------|---------|------|
| TC-RAV-* | `resolveAuthView()` 戻り値 | pure function |
| TC-PH-01..05 | `authView` prop（external） | props |
| TC-PH-06 | `getAuthView()` fallback | external（mock） |

内部 state テスト無し。

## 6. private method テスト方針

該当なし（全 export は public）。

## 7. ローカル実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  src/components/public/__tests__/PublicHeader.spec.tsx
```
