import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { MemberActivity } from "../MemberActivity";

afterEach(() => cleanup());

type Section = Parameters<typeof MemberActivity>[0]["sections"][number];

describe("MemberActivity", () => {
  it("returns null when no activity section exists", () => {
    const sections: Section[] = [
      { key: "basic", title: "Basic", fields: [] },
    ];
    const { container } = render(<MemberActivity sections={sections} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders activity timeline with stable-key per item", () => {
    const sections: Section[] = [
      {
        key: "activity",
        title: "活動",
        fields: [
          {
            stableKey: "act:2024",
            label: "2024",
            value: "勉強会参加",
            kind: "shortText",
            visibility: "public",
            source: "forms",
          },
        ],
      },
    ];
    const { container } = render(<MemberActivity sections={sections} />);
    expect(container.querySelector('[data-section="activity"]')).toBeTruthy();
    expect(
      container.querySelector('[data-stable-key="act:2024"]'),
    ).toBeTruthy();
  });
});
