# Phase 4: テスト作成

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 4 / 13                      |
| 名称      | テスト作成                  |
| 状態      | completed                   |
| 作成日    | 2026-05-28                  |

## 1. テスト対象

`apps/web/app/__tests__/page.spec.tsx` を新規作成。`vi.mock("../../src/lib/auth-view", ...)` で root page の実 import と一致させる。

## 2. テストケース（TDD RED）

| ID     | ケース                                        | mock 入力                                                    | 期待 DOM 出力                                                       |
| ------ | --------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| TC-01  | guest 状態                                    | `getAuthView` returns `{ kind: "guest" }`                    | `data-auth-state="guest"` + `<a href="/login">` を含む               |
| TC-02  | member 状態                                   | `getAuthView` returns `{ kind: "member", profileHref: "/profile" }` | `data-auth-state="member"` + `<a href="/profile">` を含む           |

## 3. mock 設計

```ts
import { vi, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../src/lib/auth-view", () => ({
  getAuthView: vi.fn(),
}));
vi.mock("../../src/lib/api/public", () => ({
  PUBLIC_API_REVALIDATE: { stats: 60, members: 60 },
  getStats: vi.fn(async () => ({ totalMembers: 0, publishedMembers: 0, recentMeetings: [] })),
  listMembersRaw: vi.fn(async () => ({ items: [] })),
}));

import { getAuthView } from "../../src/lib/auth-view";
import HomePage from "../page";

describe("app/page.tsx HomePage", () => {
  it("TC-01 guest: renders public header with /login link", async () => {
    (getAuthView as any).mockResolvedValue({ kind: "guest" });
    const ui = await HomePage();
    render(ui);
    expect(screen.getByTestId("public-header").getAttribute("data-auth-state")).toBe("guest");
  });

  it("TC-02 member: renders public header with /profile link", async () => {
    (getAuthView as any).mockResolvedValue({ kind: "member", profileHref: "/profile" });
    const ui = await HomePage();
    render(ui);
    expect(screen.getByTestId("public-header").getAttribute("data-auth-state")).toBe("member");
  });
});
```

> 既存 page spec が存在する場合は当該 spec に上記 mock ブロックを統合する。Task A 側の `PublicHeader` 実装で `data-testid="public-header"` と `data-auth-state` 属性が出ている前提。

## 4. 実行コマンド

```bash
mise exec -- pnpm exec vitest run apps/web/app/__tests__/page.spec.tsx
```

## 5. テスト操作対象（VSCPKR-03）

| 観点                          | 値                                       |
| ----------------------------- | ---------------------------------------- |
| internal state vs external prop | external prop（`authView` is server prop） |
| client-side `useState` 操作   | 該当なし                                  |
| RED 期待                      | Task A 未実装 / props 未配線時にfail   |

## 6. private method テスト方針

該当なし（root page は public default export のみ）。

## 7. 完了条件

- TC-01 / TC-02 が GREEN
- focused run（単一ファイル）で 100% pass
- `data-auth-state` の grep gate と整合する出力
