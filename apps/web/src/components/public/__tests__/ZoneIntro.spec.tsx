import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { ZoneIntro } from "../ZoneIntro";

afterEach(() => cleanup());

describe("ZoneIntro", () => {
  it("セクション見出しと 3 ゾーンカードをレンダーする", () => {
    const { container } = render(<ZoneIntro />);
    expect(
      screen.getByRole("heading", { level: 2, name: "3 つの成長ゾーン" }),
    ).toBeTruthy();
    const items = container.querySelectorAll('[data-zone]');
    expect(items).toHaveLength(3);
    const zones = Array.from(items).map((el) => el.getAttribute("data-zone"));
    expect(zones).toEqual(["0_to_1", "1_to_10", "10_to_100"]);
  });

  it("各カードに label / title / description を含む", () => {
    render(<ZoneIntro />);
    expect(screen.getByText("0 → 1")).toBeTruthy();
    expect(screen.getByText("1 → 10")).toBeTruthy();
    expect(screen.getByText("10 → 100")).toBeTruthy();
    expect(screen.getByText("立ち上げる")).toBeTruthy();
    expect(screen.getByText("広げる")).toBeTruthy();
    expect(screen.getByText("拡張する")).toBeTruthy();
  });
});
