# Phase 6: テスト追加実装 — `/profile/error.tsx`

**[実装区分: 実装仕様書]**

## 1. 新規テストファイル

path: `apps/web/app/profile/__tests__/error.component.spec.tsx`

```tsx
/**
 * issue-800: /profile/error.tsx h1 自動 focus 横展開
 * 検証: focus / digest / aria / logger
 */

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProfileError from "../error";
import { logger } from "../../../src/lib/logger";

function mkError(
  overrides: Partial<{ digest: string; message: string }> = {}
): Error & { digest?: string } {
  const e = new Error(overrides.message ?? "boom") as Error & { digest?: string };
  if (overrides.digest) e.digest = overrides.digest;
  return e;
}

describe("ProfileError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("マウント直後に h1 へ focus が移譲される", async () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});
    render(<ProfileError error={mkError()} reset={vi.fn()} />);
    const heading = await screen.findByRole("heading", { level: 1 });
    expect(document.activeElement).toBe(heading);
    expect(heading).toHaveAttribute("tabindex", "-1");
  });

  it("error.digest が存在するとき エラーID が表示される", () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});
    render(
      <ProfileError error={mkError({ digest: "abc123" })} reset={vi.fn()} />
    );
    expect(screen.getByText(/エラーID:/)).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
  });

  it("外側コンテナに role=alert と aria-live=assertive が付与される", () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});
    render(<ProfileError error={mkError()} reset={vi.fn()} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("logger.error が event=error.boundary.caught で 1 度だけ呼ばれる", () => {
    const spy = vi.spyOn(logger, "error").mockImplementation(() => {});
    const err = mkError({ digest: "xyz" });
    render(<ProfileError error={err} reset={vi.fn()} />);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      event: "error.boundary.caught",
      digest: "xyz",
      err,
    });
  });
});
```

## 2. import path 注意点

`logger` の相対 path は `__tests__/` から 3 階層上の `apps/web/src/lib/logger`:
`"../../../src/lib/logger"` を使用する。

`ProfileError` import は `../error`（`__tests__/` から 1 階層上）。

## 3. 期待される PASS / coverage

- 5 files / 31 ケース PASS（hook default / opt-out、root/profile/login/admin focus / aria-live / digest / logger / dev stack）
- `apps/web/app/profile/error.tsx` の lines / branches を root 並みにカバー
