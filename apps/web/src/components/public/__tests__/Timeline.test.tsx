import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { Timeline } from "../Timeline";

afterEach(() => cleanup());

describe("Timeline", () => {
  it("renders entries in given order with time[dateTime] (happy)", () => {
    const entries = [
      { sessionId: "s1", title: "1月会", heldOn: "2026-01-10" },
      { sessionId: "s2", title: "2月会", heldOn: "2026-02-10" },
      { sessionId: "s3", title: "3月会", heldOn: "2026-03-10" },
    ];
    const { container } = render(<Timeline entries={entries} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "最近の支部会",
    );
    const times = container.querySelectorAll("time");
    expect(times[0]?.getAttribute("datetime")).toBe("2026-01-10");
    expect(times[2]?.textContent).toBe("2026-03-10");
  });

  it("returns null when entries=[] (empty)", () => {
    const { container } = render(<Timeline entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders single entry without React key warning (variant)", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Timeline
        entries={[{ sessionId: "only", title: "唯一", heldOn: "2026-04-01" }]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("唯一")).toBeTruthy();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
