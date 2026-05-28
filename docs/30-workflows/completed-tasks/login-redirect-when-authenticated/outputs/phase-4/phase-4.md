# Phase 4 — テスト作成（TDD Red）

## 1. `apps/web/src/lib/url/__tests__/safe-next.spec.ts`（新規）

```ts
import { describe, it, expect } from "vitest";
import { safeNext } from "../safe-next";

describe("safeNext", () => {
  it.each([
    ["/profile", "/profile"],
    ["/admin/members", "/admin/members"],
    ["//evil.example.com", null],
    ["https://evil.example.com", null],
    ["javascript:alert(1)", null],
    ["\\evil", null],
    [undefined, null],
    [123, null],
    ["/" + "a".repeat(300), null],
    [["arr"], null],
  ])("input %p → %p", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});
```

| ID | 入力                 | 期待       | 根拠                       |
| -- | -------------------- | ---------- | -------------------------- |
| 1  | `"/profile"`         | `"/profile"` | 内部 path 通過             |
| 2  | `"/admin/members"`   | 同         | 内部 path 通過             |
| 3  | `"//evil..."`        | `null`     | protocol-relative 拒否     |
| 4  | `"https://..."`      | `null`     | `:` 含むため拒否           |
| 5  | `"javascript:..."`   | `null`     | `:` 含むため拒否           |
| 6  | `"\\evil"`           | `null`     | `\` 拒否                   |
| 7  | `undefined`          | `null`     | 非 string                  |
| 8  | `123`                | `null`     | 非 string                  |
| 9  | 257文字              | `null`     | 長さ上限                   |
| 10 | `["arr"]`            | `null`     | 非 string                  |

## 2. `apps/web/app/login/__tests__/page.spec.tsx`（編集 or 新規）

### 2.1 既存 spec 確認手順

```bash
ls apps/web/app/login/__tests__/page.spec.tsx 2>/dev/null
```

存在しない場合は新規。存在する場合は redirect ケース 3 件を `describe("logged-in redirect", ...)` ブロックで追記。

### 2.2 mock 方針

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const e = new Error("NEXT_REDIRECT");
    (e as Error & { url: string }).url = url;
    throw e;
  }),
}));

import LoginPage from "../page";
import { getSession } from "../../../src/lib/session";
import { redirect } from "next/navigation";

const asyncSearchParams = (
  obj: Record<string, string | string[] | undefined>,
) => Promise.resolve(obj);
```

### 2.3 テストケース

| TC   | session                              | searchParams.next  | 期待                                  |
| ---- | ------------------------------------ | ------------------ | ------------------------------------- |
| TC-1 | `null`                               | `{}`               | LoginCard 描画 / `redirect` 未呼出   |
| TC-2 | `{memberId:"m1", email:"x@x", isAdmin:false}` | undefined | `redirect("/profile")`              |
| TC-3 | 同上                                 | `"/members"`       | `redirect("/members")`                |
| TC-4 | 同上                                 | `"//evil"`         | `redirect("/profile")`（safeNext で弾く） |

### 2.4 assert パターン

```tsx
it("TC-2: logged in, no next → /profile", async () => {
  vi.mocked(getSession).mockResolvedValue({
    memberId: "m1", email: "x@x", isAdmin: false,
  });
  try {
    await LoginPage({ searchParams: asyncSearchParams({}) });
  } catch (e) {
    expect((e as Error).message).toBe("NEXT_REDIRECT");
  }
  expect(redirect).toHaveBeenCalledWith("/profile");
});
```

（既存 `app/(member)/profile/page.spec.tsx` の `redirects when /me requires auth` を参考）

## 3. TDD Red 確認コマンド

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/url/__tests__/safe-next.spec.ts \
  apps/web/app/login/__tests__/page.spec.tsx
```

期待: **Red 時点では FAIL、実装後は 22 件 PASS**

## 4. 命名規則整合チェック

- ファイル: `safe-next.ts` / `safe-next.spec.ts` ← kebab-case ✓
- export: `safeNext` ← camelCase ✓
- test id 体系: TC-1〜TC-4 + it.each table ✓
