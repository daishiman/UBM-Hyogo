import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const replaceMock = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParams,
}));

import { DensityToggle } from "../DensityToggle.client";

beforeEach(() => {
  replaceMock.mockClear();
});

afterEach(() => cleanup());

describe("DensityToggle", () => {
  it("3 種の radio を radiogroup として描画し value で選択状態を反映する", () => {
    render(<DensityToggle value="comfy" />);
    expect(
      screen.getByRole("radiogroup", { name: "表示密度" }),
    ).toBeTruthy();
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(3);
    expect(radios.find((r) => r.value === "comfy")?.checked).toBe(true);
    expect(radios.find((r) => r.value === "dense")?.checked).toBe(false);
    expect(radios.find((r) => r.value === "list")?.checked).toBe(false);
  });

  it("comfy 選択時は density param を削除して /members に replace する", () => {
    render(<DensityToggle value="dense" />);
    const comfy = screen
      .getAllByRole("radio")
      .find((r) => (r as HTMLInputElement).value === "comfy") as HTMLInputElement;
    fireEvent.click(comfy);
    expect(replaceMock).toHaveBeenCalledWith("/members");
  });

  it("dense 選択時は density=dense を URL に付与する", () => {
    render(<DensityToggle value="comfy" />);
    const dense = screen
      .getAllByRole("radio")
      .find((r) => (r as HTMLInputElement).value === "dense") as HTMLInputElement;
    fireEvent.click(dense);
    expect(replaceMock).toHaveBeenCalledWith("/members?density=dense");
  });
});
