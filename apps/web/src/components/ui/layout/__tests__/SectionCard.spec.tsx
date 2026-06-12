import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => cleanup());

import { SectionCard } from "../SectionCard";

describe("SectionCard", () => {
  // TC-4-14
  it("既定で data 属性と ui-section-card を付与する", () => {
    const { container } = render(<SectionCard>body</SectionCard>);
    const el = container.querySelector(".ui-section-card");
    expect(el?.getAttribute("data-component")).toBe("section-card");
    expect(el?.getAttribute("data-tone")).toBe("default");
    expect(el?.getAttribute("data-padding")).toBe("md");
    expect(el?.className).toContain("ui-section-card");
  });

  // TC-4-15
  it("tone=accent を反映する", () => {
    const { container } = render(<SectionCard tone="accent">b</SectionCard>);
    expect(container.querySelector(".ui-section-card")?.getAttribute("data-tone")).toBe("accent");
  });

  // TC-4-16
  it("padding=lg を反映する", () => {
    const { container } = render(<SectionCard padding="lg">b</SectionCard>);
    expect(container.querySelector(".ui-section-card")?.getAttribute("data-padding")).toBe("lg");
  });

  // TC-4-17
  it("title を head 内に描画する", () => {
    const { container } = render(<SectionCard title="事業概要">b</SectionCard>);
    expect(container.querySelector(".ui-section-card__head")).toBeTruthy();
    expect(screen.getByText("事業概要")).toBeTruthy();
  });

  // TC-4-18
  it("description を head 内に描画する", () => {
    const { container } = render(
      <SectionCard title="t" description="補足">
        b
      </SectionCard>,
    );
    const head = container.querySelector(".ui-section-card__head");
    expect(head?.textContent).toContain("補足");
  });

  // TC-4-19
  it("actions slot を描画する", () => {
    const { container } = render(
      <SectionCard title="t" actions={<a href="/x">more</a>}>
        b
      </SectionCard>,
    );
    const actions = container.querySelector(".ui-section-card__actions");
    expect(actions?.querySelector("a")?.textContent).toBe("more");
  });

  // TC-4-20 / TC-6-5
  it("title 未指定で head が DOM に出ない", () => {
    const { container } = render(<SectionCard>b</SectionCard>);
    expect(container.querySelector(".ui-section-card__head")).toBeNull();
  });

  // TC-4-21
  it("as=article で tagName が ARTICLE", () => {
    const { container } = render(<SectionCard as="article">b</SectionCard>);
    expect(container.querySelector(".ui-section-card")?.tagName).toBe("ARTICLE");
  });

  // TC-4-22 / TC-6-7
  it("as 未指定で tagName が SECTION、as=div で DIV", () => {
    const { container: c1 } = render(<SectionCard>b</SectionCard>);
    expect(c1.querySelector(".ui-section-card")?.tagName).toBe("SECTION");
    const { container: c2 } = render(<SectionCard as="div">b</SectionCard>);
    expect(c2.querySelector(".ui-section-card")?.tagName).toBe("DIV");
  });

  // TC-4-23
  it("id を透過する（機械可読 ID 保全・I-7）", () => {
    const { container } = render(<SectionCard id="member-detail-business">b</SectionCard>);
    expect(container.querySelector("#member-detail-business")).toBeTruthy();
  });

  // TC-4-24
  it("children を body 内に描画する", () => {
    const { container } = render(<SectionCard>本文</SectionCard>);
    expect(container.querySelector(".ui-section-card__body")?.textContent).toContain("本文");
  });

  // TC-6-8（I-7 透過の回帰）
  it("data-testid / data-component を spread で透過し既定 data-component を上書きする", () => {
    const { container } = render(
      <SectionCard data-testid="x" data-component="login-card">
        b
      </SectionCard>,
    );
    const el = container.querySelector(".ui-section-card");
    expect(el?.getAttribute("data-testid")).toBe("x");
    expect(el?.getAttribute("data-component")).toBe("login-card");
  });
});
