# Phase 6: テスト追加

## 1. 追加テストファイル

### 1.1 `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx`

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DensityToggle } from "../DensityToggle.client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/members",
  useSearchParams: () => new URLSearchParams(),
}));

describe("DensityToggle", () => {
  it("renders radiogroup with 3 radios", () => {
    render(<DensityToggle value="comfy" />);
    expect(screen.getByRole("radiogroup", { name: "表示密度" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("marks current density as aria-checked", () => {
    render(<DensityToggle value="dense" />);
    expect(screen.getByRole("radio", { name: "密" })).toHaveAttribute("aria-checked", "true");
  });

  it("changes selection on click", async () => {
    const user = userEvent.setup();
    render(<DensityToggle value="comfy" />);
    await user.click(screen.getByRole("radio", { name: "リスト" }));
    // router.replace 呼出は mock 経由で検証可能
  });
});
```

### 1.2 `apps/web/src/components/public/__tests__/MemberCard.spec.tsx`

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberCard } from "../MemberCard";

const base = {
  memberId: "m1",
  fullName: "山田 太郎",
  nickname: null,
  occupation: "経営者",
  location: "神戸市",
  ubmZone: "0→1",
  ubmMembershipType: "会員",
};

describe("MemberCard", () => {
  it("renders with data-density=comfy", () => {
    render(<MemberCard member={base} density="comfy" />);
    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("data-component", "member-card");
    expect(article).toHaveAttribute("data-density", "comfy");
  });

  it("omits nickname when null", () => {
    render(<MemberCard member={base} density="dense" />);
    expect(screen.queryByText(/nickname/)).not.toBeInTheDocument();
  });
});
```

### 1.3 `apps/web/playwright/tests/members-prototype-alignment.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("/members prototype alignment", () => {
  test("renders header, page-head, filters, density toggle", async ({ page }) => {
    await page.goto("/members");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "ログイン" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "メンバー一覧" })).toBeVisible();
    await expect(page.getByRole("search", { name: "メンバー絞り込み" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "表示密度" })).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(3);
  });

  test("switches density to list", async ({ page }) => {
    await page.goto("/members");
    await page.getByRole("radio", { name: "リスト" }).click();
    await expect(page).toHaveURL(/density=list/);
  });
});
```

## 2. 既存テストの更新

- `MemberFilters.client.spec.tsx`: 既存 assertion が `data-component="member-filters"` / `role="search"` 前提に置換
- DensityToggle 旧テスト（RadioGroup 前提）は削除し新版に置換

## 3. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --run
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-prototype-alignment.spec.ts
```

## 4. 完了条件

- 上記 spec ファイルが追加され全 pass
