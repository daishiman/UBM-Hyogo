import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { StatCard } from "../StatCard";
import { buildStats } from "../../../test-utils/fixtures/public";

afterEach(() => cleanup());

describe("StatCard", () => {
  it("renders counts and zoneBreakdown rows (happy)", () => {
    const stats = buildStats();
    const { container } = render(<StatCard stats={stats} />);

    expect(
      container.querySelector('[data-key="member-count"]')?.textContent,
    ).toBe(String(stats.memberCount));
    expect(
      container.querySelector('[data-key="public-count"]')?.textContent,
    ).toBe(String(stats.publicMemberCount));
    expect(
      container.querySelector('[data-key="meeting-count"]')?.textContent,
    ).toBe(String(stats.meetingCountThisYear));

    const zoneRows = container.querySelectorAll('[data-role="zone"] > div');
    expect(zoneRows).toHaveLength(stats.zoneBreakdown.length);
    expect(zoneRows[0]?.querySelector("dt")?.textContent).toBe(
      stats.zoneBreakdown[0]?.zone,
    );
    expect(zoneRows[0]?.querySelector("dd")?.textContent).toBe(
      String(stats.zoneBreakdown[0]?.count),
    );
  });

  it("renders empty zone list when zoneBreakdown=[] (empty)", () => {
    const stats = buildStats({ zoneBreakdown: [] });
    const { container } = render(<StatCard stats={stats} />);
    const zoneList = container.querySelector('[data-role="zone"]');
    expect(zoneList).not.toBeNull();
    expect(zoneList?.childElementCount).toBe(0);
  });

  it("renders zero counts as '0' (variant)", () => {
    const stats = buildStats({
      memberCount: 0,
      publicMemberCount: 0,
      meetingCountThisYear: 0,
      zoneBreakdown: [],
    });
    const { container } = render(<StatCard stats={stats} />);
    expect(
      container.querySelector('[data-key="member-count"]')?.textContent,
    ).toBe("0");
    expect(
      container.querySelector('[data-key="public-count"]')?.textContent,
    ).toBe("0");
    expect(
      container.querySelector('[data-key="meeting-count"]')?.textContent,
    ).toBe("0");
  });
});
