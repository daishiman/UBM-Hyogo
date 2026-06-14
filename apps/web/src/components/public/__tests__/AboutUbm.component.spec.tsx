import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";

import { AboutUbm } from "../AboutUbm";

afterEach(() => cleanup());

describe("AboutUbm", () => {
  it("renders 2-card grid with About + Three Zones (happy)", () => {
    const { container } = render(<AboutUbm />);
    expect(container.querySelector('[data-component="about-ubm"]')).toBeTruthy();
    expect(container.querySelector('[data-role="about-card"]')).toBeTruthy();
    expect(container.querySelector('[data-role="zones-card"]')).toBeTruthy();
  });

  it("renders all 3 zones rows with chip/label/desc", () => {
    const { container } = render(<AboutUbm />);
    const rows = container.querySelectorAll('[data-role="zone-row"]');
    expect(rows).toHaveLength(3);
    expect(container.querySelector('[data-zone="0_to_1"]')).toBeTruthy();
    expect(container.querySelector('[data-zone="1_to_10"]')).toBeTruthy();
    expect(container.querySelector('[data-zone="10_to_100"]')).toBeTruthy();
    const chips = container.querySelectorAll(
      '[data-role="zone-row"] [data-role="chip"]',
    );
    expect(Array.from(chips).map((c) => c.textContent)).toEqual([
      "0→1",
      "1→10",
      "10→100",
    ]);
  });

  it("renders section headings without English eyebrows", () => {
    const { container } = render(<AboutUbm />);
    expect(container.querySelectorAll('[data-role="eyebrow"]')).toHaveLength(0);
    const headings = Array.from(
      container.querySelectorAll('[data-role="section-heading"]'),
    ).map((n) => n.textContent);
    expect(headings).toEqual(["事業支援コミュニティ「UBM」", "UBM区画"]);
  });

  it("omits zones card when showZones=false", () => {
    const { container } = render(<AboutUbm showZones={false} />);
    expect(container.querySelector('[data-role="about-card"]')).toBeTruthy();
    expect(container.querySelector('[data-role="zones-card"]')).toBeNull();
  });

  it("supports aboutCopy override", () => {
    render(<AboutUbm aboutCopy={<p data-testid="custom">CUSTOM</p>} />);
    expect(screen.getByTestId("custom").textContent).toBe("CUSTOM");
  });
});
