import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Field } from "../Field";

afterEach(() => cleanup());

describe("Field", () => {
  it("hint あり: label / hint 両方が描画される", () => {
    render(
      <Field id="x" label="ラベル" hint="ヒント">
        <input id="x" />
      </Field>,
    );
    expect(document.querySelector('label[for="x"]')?.textContent).toBe("ラベル");
    expect(document.getElementById("x-hint")?.textContent).toBe("ヒント");
  });

  it("hint なし: hint 要素を出さない", () => {
    render(
      <Field id="y" label="ラベル">
        <input id="y" />
      </Field>,
    );
    expect(screen.getByLabelText("ラベル")).toBeTruthy();
    expect(document.getElementById("y-hint")).toBeNull();
  });

  it("children は label の直後に描画される", () => {
    render(
      <Field id="z" label="L">
        <input id="z" data-testid="child" />
      </Field>,
    );
    expect(screen.getByTestId("child")).toBeTruthy();
  });
});
