import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Segmented } from "../Segmented";

afterEach(() => cleanup());

const options = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];

describe("Segmented", () => {
  it("role=radiogroup と全 option が radio として描画される", () => {
    render(<Segmented options={options} value="a" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("選択中 option は aria-checked=true", () => {
    render(<Segmented options={options} value="a" onChange={() => {}} />);
    const radios = screen.getAllByRole("radio");
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
    expect(radios[1].getAttribute("aria-checked")).toBe("false");
  });

  it("クリックで onChange に value が渡る", () => {
    const onChange = vi.fn();
    render(<Segmented options={options} value="a" onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
