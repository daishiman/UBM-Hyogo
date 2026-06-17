import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => cleanup());

import { PageShell } from "../PageShell";

describe("PageShell", () => {
  // TC-4-1
  it("既定で data 属性と ui-page-shell を付与する", () => {
    render(<PageShell>x</PageShell>);
    const el = screen.getByText("x");
    expect(el.getAttribute("data-component")).toBe("page-shell");
    expect(el.getAttribute("data-max-width")).toBe("default");
    expect(el.getAttribute("data-bg")).toBe("base");
    expect(el.getAttribute("data-gap")).toBe("lg");
    expect(el.className).toContain("ui-page-shell");
  });

  // TC-4-2
  it("maxWidth=narrow を反映する", () => {
    render(<PageShell maxWidth="narrow">x</PageShell>);
    expect(screen.getByText("x").getAttribute("data-max-width")).toBe("narrow");
  });

  // TC-4-3
  it("background=bare を反映する", () => {
    render(<PageShell background="bare">x</PageShell>);
    expect(screen.getByText("x").getAttribute("data-bg")).toBe("bare");
  });

  // TC-4-4
  it("gap=sm を反映する", () => {
    render(<PageShell gap="sm">x</PageShell>);
    expect(screen.getByText("x").getAttribute("data-gap")).toBe("sm");
  });

  // TC-4-5
  it("className を透過する", () => {
    render(<PageShell className="x-extra">x</PageShell>);
    const el = screen.getByText("x");
    expect(el.className).toContain("ui-page-shell");
    expect(el.className).toContain("x-extra");
  });

  // TC-4-6
  it("children を描画する", () => {
    render(
      <PageShell>
        <p>child</p>
      </PageShell>,
    );
    expect(screen.getByText("child")).toBeTruthy();
  });

  // TC-6-1（既定値で undefined を出さない）
  it("variant 系未指定で既定値が data 属性に出る", () => {
    render(<PageShell>x</PageShell>);
    const el = screen.getByText("x");
    expect(el.getAttribute("data-max-width")).toBe("default");
    expect(el.getAttribute("data-bg")).toBe("base");
    expect(el.getAttribute("data-gap")).toBe("lg");
  });
});
