// workflow: mypage-prototype-alignment / Phase 4 RED test
// 対象: RevalidateModal（ST-4 client / Modal 合成）
// 操作対象: external prop（open は prop。RevalidateModal は internal state を持たない）。

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { RevalidateModal } from "../RevalidateModal";

afterEach(() => cleanup());

describe("RevalidateModal", () => {
  it("open=false のとき何も描画しない", () => {
    render(
      <RevalidateModal
        open={false}
        onClose={vi.fn()}
        editResponseUrl="https://edit.example"
        fallbackResponderUrl="https://fallback.example"
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("open=true で再回答の説明文を描画する", () => {
    render(
      <RevalidateModal
        open={true}
        onClose={vi.fn()}
        editResponseUrl="https://edit.example"
        fallbackResponderUrl="https://fallback.example"
      />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/Googleフォームから再回答/)).toBeTruthy();
    expect(screen.getByText(/stableKey/)).toBeTruthy();
  });

  it("editResponseUrl があるとき フォームを開くは editResponseUrl を指す", () => {
    render(
      <RevalidateModal
        open={true}
        onClose={vi.fn()}
        editResponseUrl="https://edit.example"
        fallbackResponderUrl="https://fallback.example"
      />,
    );
    const link = screen.getByRole("link", { name: /フォームを開く/ });
    expect(link.getAttribute("href")).toBe("https://edit.example");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("editResponseUrl=null のとき フォームを開くは fallbackResponderUrl を指す", () => {
    render(
      <RevalidateModal
        open={true}
        onClose={vi.fn()}
        editResponseUrl={null}
        fallbackResponderUrl="https://fallback.example"
      />,
    );
    const link = screen.getByRole("link", { name: /フォームを開く/ });
    expect(link.getAttribute("href")).toBe("https://fallback.example");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  // Phase 6: 追加 fail path
  it("フォームを開く click 後に onClose が呼ばれる", () => {
    const onClose = vi.fn();
    render(
      <RevalidateModal
        open={true}
        onClose={onClose}
        editResponseUrl="https://edit.example"
        fallbackResponderUrl="https://fallback.example"
      />,
    );
    const link = screen.getByRole("link", { name: /フォームを開く/ });
    link.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("editResponseUrl も fallback も空文字のとき href は空（防御）", () => {
    const { container } = render(
      <RevalidateModal
        open={true}
        onClose={vi.fn()}
        editResponseUrl=""
        fallbackResponderUrl=""
      />,
    );
    // 空 href の <a> は role=link を持たないため、属性セレクタで取得する
    const link = container.querySelector<HTMLAnchorElement>(
      'a[data-cta="open-revalidate-form"]',
    );
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("");
  });
});
