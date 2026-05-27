import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { Timeline, yyyyMm, dd } from "../Timeline";

afterEach(() => cleanup());

describe("Timeline", () => {
  it("renders entries in given order with tl-row layout (happy)", () => {
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
    const rows = container.querySelectorAll('[data-role="tl-row"]');
    expect(rows).toHaveLength(3);
    expect(container.querySelector('[data-role="eyebrow"]')?.textContent).toBe(
      "RECENT MEETINGS",
    );
    expect(
      container.querySelector('[data-role="chip-cadence"]')?.textContent,
    ).toContain("毎月第2木曜開催");
  });

  it("renders EmptyState when entries=[] (empty)", () => {
    const { container } = render(<Timeline entries={[]} />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("まだ支部会の記録がありません")).toBeTruthy();
    // header still rendered
    expect(container.querySelector('[data-role="eyebrow"]')).toBeTruthy();
  });

  it("renders note and attendees when provided", () => {
    const { container } = render(
      <Timeline
        entries={[
          {
            sessionId: "s1",
            title: "T",
            heldOn: "2026-05-14",
            note: "ノート本文",
            attendees: 12,
          },
        ]}
      />,
    );
    expect(container.querySelector('[data-role="tl-note"]')?.textContent).toBe(
      "ノート本文",
    );
    expect(
      container.querySelector('[data-role="tl-attendees"]')?.textContent,
    ).toBe("12名参加");
  });

  it("omits note/attendees gracefully when missing", () => {
    const { container } = render(
      <Timeline
        entries={[{ sessionId: "s1", title: "T", heldOn: "2026-05-14" }]}
      />,
    );
    expect(container.querySelector('[data-role="tl-note"]')).toBeNull();
    expect(container.querySelector('[data-role="tl-attendees"]')).toBeNull();
  });

  it("accepts custom cadenceLabel", () => {
    const { container } = render(
      <Timeline entries={[]} cadenceLabel="隔月開催" />,
    );
    expect(
      container.querySelector('[data-role="chip-cadence"]')?.textContent,
    ).toContain("隔月開催");
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

describe("yyyyMm / dd helpers", () => {
  it("formats ISO date to yyyy.MM and zero-padded day", () => {
    expect(yyyyMm("2026-05-14")).toBe("2026.05");
    expect(dd("2026-05-14")).toBe("14");
  });

  it("falls back to slice when input is not parseable", () => {
    expect(yyyyMm("not-a-date")).toBe("not-a-d");
    expect(dd("not-a-date")).toBe("te");
  });
});
