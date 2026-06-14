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
  it("renders 4 anchored stat tiles (members/zones/meetings/sync)", () => {
    const { container } = render(<Stats stats={baseStats} />);
    expect(container.querySelector('[data-stat="members"]')).toBeTruthy();
    expect(container.querySelector('[data-stat="zones"]')).toBeTruthy();
    expect(container.querySelector('[data-stat="meetings"]')).toBeTruthy();
    expect(container.querySelector('[data-stat="sync"]')).toBeTruthy();
  });

  it("renders publicMemberCount as public members value", () => {
    const { container } = render(<Stats stats={baseStats} />);
    expect(
      container.querySelector('[data-stat="members"] [data-role="value"]')
        ?.textContent,
    ).toBe("30");
  });

  it("renders constant ZONE_COUNT=3 and MEETINGS_PER_YEAR=12", () => {
    const { container } = render(<Stats stats={baseStats} />);
    expect(
      container.querySelector('[data-stat="zones"] [data-role="value"]')
        ?.textContent,
    ).toBe("3");
    expect(
      container.querySelector('[data-stat="meetings"] [data-role="value"]')
        ?.textContent,
    ).toBe("12");
  });

  it("renders sub line for every stat", () => {
    const { container } = render(<Stats stats={baseStats} />);
    expect(container.querySelectorAll("li[data-stat] [data-role=\"sub\"]"))
      .toHaveLength(4);
  });

  it("renders localized stat labels", () => {
    const { container } = render(<Stats stats={baseStats} />);
    expect(
      container.querySelector('[data-stat="members"] [data-role="label"]')
        ?.textContent,
    ).toBe("公開メンバー");
    expect(
      container.querySelector('[data-stat="zones"] [data-role="label"]')
        ?.textContent,
    ).toBe("事業フェーズ");
    expect(
      container.querySelector('[data-stat="meetings"] [data-role="label"]')
        ?.textContent,
    ).toBe("年間の支部会");
    expect(
      container.querySelector('[data-stat="sync"] [data-role="label"]')
        ?.textContent,
    ).toBe("最終データ更新");
  });

  it("renders badge-sync chip inside sync tile sub", () => {
    const { container } = render(<Stats stats={baseStats} />);
    const badge = container.querySelector(
      '[data-stat="sync"] [data-role="badge-sync"]',
    );
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain("自動で最新化");
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
