// workflow: mypage-prototype-alignment / Phase 4 RED test
// 対象: EditCta（ST-4 client component / Modal を内包）
// 操作対象: internal state（open は EditCta の useState）。Modal 実物を使用（happy-dom）。

import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { EditCta } from "../EditCta";

afterEach(() => cleanup());

const baseProps = {
  editResponseUrl: "https://edit.example",
  fallbackResponderUrl: "https://fallback.example",
} as const;

describe("EditCta", () => {
  it("初期状態では Modal が閉じている", () => {
    render(<EditCta {...baseProps} variant="header" />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("情報を更新するボタン click で Modal が開く", () => {
    render(<EditCta {...baseProps} variant="header" />);
    fireEvent.click(screen.getByRole("button", { name: /情報を更新する/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/再回答/)).toBeTruthy();
  });

  it("Modal のキャンセルで閉じる", () => {
    render(<EditCta {...baseProps} variant="header" />);
    fireEvent.click(screen.getByRole("button", { name: /情報を更新する/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /キャンセル/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("variant=inline でも開閉できる", () => {
    render(<EditCta {...baseProps} variant="inline" />);
    fireEvent.click(
      screen.getByRole("button", { name: /フォームを開いて更新/ }),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  // Phase 6: 追加 fail path
  it("editResponseUrl=null でも Modal を開閉できる", () => {
    render(
      <EditCta
        editResponseUrl={null}
        fallbackResponderUrl="https://fallback.example"
        variant="header"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /情報を更新する/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /キャンセル/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
