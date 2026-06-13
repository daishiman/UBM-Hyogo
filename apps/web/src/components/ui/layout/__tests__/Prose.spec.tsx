import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

afterEach(() => cleanup());

import { Prose } from "../Prose";

describe("Prose", () => {
  // TC-4-35
  it("data-component と ui-prose を付与する", () => {
    const { container } = render(
      <Prose>
        <h2>条項</h2>
        <p>本文</p>
      </Prose>,
    );
    const el = container.querySelector(".ui-prose");
    expect(el?.getAttribute("data-component")).toBe("prose");
    expect(el?.className).toContain("ui-prose");
  });

  // TC-4-36 / TC-6-1
  it("既定で data-size=default", () => {
    const { container } = render(<Prose>x</Prose>);
    expect(container.querySelector(".ui-prose")?.getAttribute("data-size")).toBe("default");
  });

  // TC-4-37 / TC-6-4
  it("size=compact を反映する", () => {
    const { container } = render(<Prose size="compact">x</Prose>);
    expect(container.querySelector(".ui-prose")?.getAttribute("data-size")).toBe("compact");
  });

  // TC-4-38
  it("子孫の h2 / p / a が DOM 上に存在する", () => {
    const { container } = render(
      <Prose>
        <h2>見出し</h2>
        <p>本文</p>
        <a href="/x">link</a>
      </Prose>,
    );
    const root = container.querySelector(".ui-prose");
    expect(root?.querySelector("h2")).toBeTruthy();
    expect(root?.querySelector("p")).toBeTruthy();
    expect(root?.querySelector("a")).toBeTruthy();
  });

  // TC-4-39
  it("className を透過する", () => {
    const { container } = render(<Prose className="legal">x</Prose>);
    const el = container.querySelector(".ui-prose");
    expect(el?.className).toContain("ui-prose");
    expect(el?.className).toContain("legal");
  });
});
