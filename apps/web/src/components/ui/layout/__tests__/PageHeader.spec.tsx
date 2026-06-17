import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => cleanup());

import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  // TC-4-7
  it("title を h1(level 1) として描画する", () => {
    render(<PageHeader title="会員一覧" />);
    expect(screen.getByRole("heading", { level: 1, name: "会員一覧" })).toBeTruthy();
  });

  // TC-4-8
  it("eyebrow を ui-page-header__eyebrow に描画する", () => {
    const { container } = render(<PageHeader eyebrow="MEMBERS" title="会員一覧" />);
    const eyebrow = container.querySelector(".ui-page-header__eyebrow");
    expect(eyebrow?.textContent).toBe("MEMBERS");
  });

  // TC-4-9
  it("lead を ui-page-header__lead に描画する", () => {
    const { container } = render(<PageHeader title="会員一覧" lead="紹介文" />);
    const lead = container.querySelector(".ui-page-header__lead");
    expect(lead?.textContent).toBe("紹介文");
  });

  // TC-4-10
  it("actions slot にボタンを配置する", () => {
    const { container } = render(<PageHeader title="会員一覧" actions={<button>密度</button>} />);
    const actions = container.querySelector(".ui-page-header__actions");
    expect(actions?.querySelector("button")?.textContent).toBe("密度");
  });

  // TC-4-11
  it("既定で data-align=start", () => {
    const { container } = render(<PageHeader title="t" />);
    expect(container.querySelector(".ui-page-header")?.getAttribute("data-align")).toBe("start");
  });

  // TC-4-12
  it("align=center を反映する", () => {
    const { container } = render(<PageHeader title="t" align="center" />);
    expect(container.querySelector(".ui-page-header")?.getAttribute("data-align")).toBe("center");
  });

  // TC-4-13 / TC-6-6
  it("eyebrow / lead 未指定でその要素が DOM に出ない", () => {
    const { container } = render(<PageHeader title="t" />);
    expect(container.querySelector(".ui-page-header__eyebrow")).toBeNull();
    expect(container.querySelector(".ui-page-header__lead")).toBeNull();
  });
});
