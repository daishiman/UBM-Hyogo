# Phase 6: テスト追加

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 6 / 13 |

## 追加・更新するテストファイル

| ファイル | 種別 | Phase 4 対応 |
|---|---|---|
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 新規 | U-1〜U-8 |
| `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` | 既存維持 | A-1〜A-4（regression） |
| `apps/web/src/components/public/__tests__/SectionError.spec.tsx` | 新規 | P-1〜P-5 |
| `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | 新規 | P-1〜P-5 |
| `apps/web/app/profile/page.spec.tsx` | 既存変更 | PR-1〜PR-5 |
| `apps/web/app/(public)/members/page.spec.tsx` | 新規 or 修正 | PM-1, PM-2 |
| `apps/web/app/(public)/members/[id]/page.spec.tsx` | 既存変更 | PD-1〜PD-4 |

## 1. unit: safe-fetch.spec.ts（雛形）

```ts
import { describe, expect, it } from "vitest";
import { safeServerFetch } from "../safe-fetch";

class AuthRequiredError extends Error {
  constructor() { super("auth required"); }
}

describe("safeServerFetch", () => {
  it("resolves to { ok: true, data } on success", async () => {
    const r = await safeServerFetch(async () => 42);
    expect(r).toEqual({ ok: true, data: 42 });
  });

  it("extracts status from 'X failed: NNN' message", async () => {
    const r = await safeServerFetch(
      async () => { throw new Error("admin api /x failed: 404"); },
      { codePrefix: "ADMIN_FETCH" },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("ADMIN_FETCH_404");
  });

  it("returns *_FAILED on generic Error", async () => {
    const r = await safeServerFetch(async () => { throw new Error("boom"); });
    if (!r.ok) expect(r.error.code).toBe("SERVER_FETCH_FAILED");
  });

  it("returns *_UNKNOWN on non-Error throw", async () => {
    const r = await safeServerFetch(async () => { throw "nope"; });
    if (!r.ok) expect(r.error.code).toBe("SERVER_FETCH_UNKNOWN");
  });

  it("re-throws when err is instance of rethrowOn", async () => {
    await expect(
      safeServerFetch(async () => { throw new AuthRequiredError(); }, { rethrowOn: [AuthRequiredError] }),
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });
});
```

## 2. unit: public/SectionError.spec.tsx（雛形）

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionError } from "../SectionError";

describe("public/SectionError", () => {
  it("renders default title", () => {
    render(<SectionError />);
    expect(screen.getByRole("alert")).toHaveTextContent("読み込みに失敗しました");
  });

  it("renders detail when provided", () => {
    render(<SectionError detail="boom" />);
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("renders retry link when retryHref provided", () => {
    render(<SectionError retryHref="/retry" />);
    expect(screen.getByRole("link", { name: "再読み込み" })).toHaveAttribute("href", "/retry");
  });

  it("has aria-live polite", () => {
    render(<SectionError />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "polite");
  });

  it("does not contain raw HEX colors in markup", () => {
    const { container } = render(<SectionError detail="x" />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
```

## 3. integration: page.spec.tsx 修正方針

### `/profile`

- `vi.mock("@/lib/fetch/authed")` で `fetchAuthed` を 2 段階制御
- PR-2: `fetchAuthed` を `/me` 成功・`/me/profile` reject(500) で並べ、`<SectionError>` が描画されることを assert
- PR-3: `/me` を `AuthRequiredError` reject → `redirect` mock が `/login` で呼ばれたことを assert

### `/(public)/members`

- `vi.mock("@/lib/api/public")` で `listMembers` を成功 / reject 制御
- PM-2: reject 時に SectionError が描画され、`MemberFilters` も同時描画されることを assert

### `/(public)/members/[id]`

- `vi.mock("@/lib/fetch/public")` で `fetchPublicOrNotFound` を制御
- PD-2: `FetchPublicNotFoundError` throw → `notFound` mock が呼ばれる
- PD-3: 一般 Error → `<SectionError>` 描画・`notFound` mock 未呼び出し

## 検証コマンド

Phase 5 の検証コマンドを再実行する。`vitest --coverage` で新規 helper の branch 100% を確認。

## 成果物

- 本ファイル

## 完了条件

- Phase 4 の全ケースに対応する test 雛形 / mock 戦略が示されている
- 既存 admin spec を改変しない方針が明記されている
