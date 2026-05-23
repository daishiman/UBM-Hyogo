import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const replaceMock = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParams,
  usePathname: () => "/members",
}));

import { DensityToggle } from "../DensityToggle.client";

beforeEach(() => {
  replaceMock.mockClear();
});

afterEach(() => cleanup());

describe("DensityToggle", () => {
  it("3 種の radio を Segmented として描画し value で aria-checked を反映する", () => {
    const { container } = render(<DensityToggle value="comfy" />);
    expect(
      screen.getByRole("radiogroup", { name: "表示密度" }),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-component="density-toggle"]'),
    ).toBeTruthy();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "ゆったり" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "密" }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("radio", { name: "リスト" }).getAttribute("aria-checked")).toBe("false");
  });

  it("comfy 選択時は density param を削除して /members に replace する", () => {
    render(<DensityToggle value="dense" />);
    fireEvent.click(screen.getByRole("radio", { name: "ゆったり" }));
    expect(replaceMock).toHaveBeenCalledWith("/members", { scroll: false });
  });

  it("dense 選択時は density=dense を URL に付与する", () => {
    render(<DensityToggle value="comfy" />);
    fireEvent.click(screen.getByRole("radio", { name: "密" }));
    expect(replaceMock).toHaveBeenCalledWith("/members?density=dense", {
      scroll: false,
    });
  });
});
