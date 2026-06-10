import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Checkbox } from "../Checkbox";

afterEach(() => cleanup());

describe("Checkbox", () => {
  it("label 付き checkbox として checked を切り替えられる", () => {
    render(<Checkbox label="山田 太郎" />);

    const checkbox = screen.getByRole("checkbox", { name: "山田 太郎" }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);

    expect(checkbox.checked).toBe(true);
  });
});
