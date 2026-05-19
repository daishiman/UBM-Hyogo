# Phase 4: テスト計画

## 1. テストレベルとファイル

| Level | File | 目的 |
|---|---|---|
| Unit / Component | `apps/web/app/login/loading.spec.tsx` | LoginLoading の role / aria 属性 / sr-only text 検証 |
| Unit / Component | `apps/web/app/login/error.spec.tsx` | LoginError の focus 移譲 / aria-live / digest 条件 render / reset 呼び出し検証 |

> 不変条件 8: 新規 test ファイルは `*.spec.tsx` のみ。`*.test.tsx` 禁止。

## 2. テストケース一覧

### loading.spec.tsx

| TC | 観点 | 期待値 |
|---|---|---|
| L-01 | role / aria-busy / aria-live | `getByRole("status")` が `aria-busy="true"`, `aria-live="polite"` を持つ |
| L-02 | sr-only text | `getByText("ログイン画面を読み込み中")` が DOM に存在 |
| L-03 | skeleton block 数 | `bg-surface-2` class を持つ要素が 3 つ |
| L-04 | Card layout | `Card` primitive 内に render される（jsdom 上で確認可能な構造で検証） |

### error.spec.tsx

| TC | 観点 | 期待値 |
|---|---|---|
| E-01 | h1 自動 focus | render 直後に `getByRole("heading", { level: 1 })` が `toHaveFocus()` |
| E-02 | role=alert / aria-live=assertive | `getByRole("alert")` が `aria-live="assertive"` を持つ |
| E-03 | digest 有り | `error.digest = "abc123"` のとき `getByText("error id: abc123")` が表示 |
| E-04 | digest 無し | `error.digest = undefined` のとき `queryByText(/error id:/)` が null |
| E-05 | reset 呼び出し | `button` click で `reset` mock が 1 回呼ばれる |
| E-06 | console.error 呼び出し | `[login] route error` prefix で `console.error` が呼ばれる（spy で検証） |
| E-07 | tabIndex=-1 | h1 が `tabIndex={-1}` を持つ |

## 3. テスト実装スケッチ

### loading.spec.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoginLoading from "./loading";

describe("LoginLoading", () => {
  it("L-01: role=status と aria-busy / aria-live を持つ", () => {
    render(<LoginLoading />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("L-02: sr-only テキストが存在", () => {
    render(<LoginLoading />);
    expect(screen.getByText("ログイン画面を読み込み中")).toBeInTheDocument();
  });

  it("L-03: skeleton block が 3 つ", () => {
    const { container } = render(<LoginLoading />);
    expect(container.querySelectorAll(".bg-surface-2")).toHaveLength(3);
  });
});
```

### error.spec.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginError from "./error";

describe("LoginError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("E-01: マウント直後に h1 へ focus", () => {
    render(<LoginError error={new Error("boom")} reset={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("E-02: role=alert と aria-live=assertive", () => {
    render(<LoginError error={new Error("boom")} reset={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("E-03: digest があれば code 表示", () => {
    const err = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<LoginError error={err} reset={vi.fn()} />);
    expect(screen.getByText("error id: abc123")).toBeInTheDocument();
  });

  it("E-04: digest が無ければ code 非表示", () => {
    render(<LoginError error={new Error("boom")} reset={vi.fn()} />);
    expect(screen.queryByText(/error id:/)).toBeNull();
  });

  it("E-05: reset button で reset が呼ばれる", async () => {
    const reset = vi.fn();
    render(<LoginError error={new Error("boom")} reset={reset} />);
    await userEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("E-06: console.error が [login] route error prefix で呼ばれる", () => {
    render(<LoginError error={new Error("boom")} reset={vi.fn()} />);
    expect(consoleErrorSpy).toHaveBeenCalledWith("[login] route error", expect.any(Error));
  });

  it("E-07: h1 が tabIndex=-1", () => {
    render(<LoginError error={new Error("boom")} reset={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute("tabindex", "-1");
  });
});
```

## 4. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm/web test -- app/login/loading.spec.tsx app/login/error.spec.tsx
```

## 5. カバレッジ目標

- loading.tsx: 100% line / branch
- error.tsx: 100% line, branch ≥ 90%（digest 有無 / focus null path 含む）
