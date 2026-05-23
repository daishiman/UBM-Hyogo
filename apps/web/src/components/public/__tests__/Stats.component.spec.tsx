import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { Stats } from "../Stats";

afterEach(() => cleanup());

const baseStats = {
  memberCount: 42,
  publicMemberCount: 30,
  zoneBreakdown: [
    { zone: "0_to_1", count: 10 },
    { zone: "1_to_10", count: 20 },
    { zone: "10_to_100", count: 12 },
  ],
  membershipBreakdown: [],
  meetingCountThisYear: 5,
  recentMeetings: [],
  lastSync: {
    schemaSync: "ok" as const,
    responseSync: "ok" as const,
    schemaSyncFinishedAt: null,
    responseSyncFinishedAt: null,
  },
  generatedAt: "2026-05-09T00:00:00.000Z",
};

describe("Stats", () => {
  it("renders 4 anchored stat tiles", () => {
    const { container } = render(<Stats stats={baseStats} />);
    expect(container.querySelector('[data-stat="total"]')).toBeTruthy();
    expect(container.querySelector('[data-stat="public"]')).toBeTruthy();
    expect(container.querySelector('[data-stat="zones"]')).toBeTruthy();
    expect(container.querySelector('[data-stat="sync"]')).toBeTruthy();
  });

  it("renders member counts from stats", () => {
    const { container } = render(<Stats stats={baseStats} />);
    expect(
      container.querySelector('[data-stat="total"] [data-role="value"]')
        ?.textContent,
    ).toBe("42");
    expect(
      container.querySelector('[data-stat="public"] [data-role="value"]')
        ?.textContent,
    ).toBe("30");
    expect(
      container.querySelector('[data-stat="zones"] [data-role="value"]')
        ?.textContent,
    ).toBe("3");
  });

  it("falls back to '未同期' when generatedAt is invalid", () => {
    const { container } = render(
      <Stats stats={{ ...baseStats, generatedAt: "not-a-date" }} />,
    );
    expect(
      container.querySelector('[data-stat="sync"] [data-role="value"]')
        ?.textContent,
    ).toBe("未同期");
  });
});
