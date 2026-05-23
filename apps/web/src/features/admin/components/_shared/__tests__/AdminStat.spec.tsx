import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AdminStat } from "../AdminStat";

afterEach(() => cleanup());

describe("AdminStat", () => {
  it("TC-ST-01: label と value を表示する", () => {
    render(<AdminStat label="登録会員" value={120} />);
    expect(screen.getByText("登録会員")).toBeDefined();
    expect(screen.getByText("120")).toBeDefined();
  });

  it("TC-ST-02: tone 属性が data-tone に反映される", () => {
    render(<AdminStat label="X" value={1} tone="critical" />);
    expect(screen.getByTestId("admin-stat").dataset["tone"]).toBe("critical");
  });

  it("TC-ST-03: loading=true で skeleton を表示し value を出さない", () => {
    const { container } = render(<AdminStat label="X" value={1} loading />);
    expect(container.querySelector(".admin-stat__skeleton")).not.toBeNull();
    expect(screen.queryByText("1")).toBeNull();
  });

  it("TC-ST-04: hint を表示する", () => {
    render(<AdminStat label="X" value={1} hint="前週比 +3" />);
    expect(screen.getByText("前週比 +3")).toBeDefined();
  });
});
