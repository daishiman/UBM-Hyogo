import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BusinessOverviewSection } from "../BusinessOverviewSection";
import { MessageCard } from "../MessageCard";
import { PersonalSection } from "../PersonalSection";

afterEach(() => cleanup());

describe("public member detail rich sections", () => {
  it("renders business overview with optional skills and canProvide blocks", () => {
    const { container } = render(
      <BusinessOverviewSection
        businessOverview="事業概要"
        skills="TypeScript"
        canProvide="技術相談"
      />,
    );
    expect(container.querySelector('[data-component="business-overview"]')).toBeTruthy();
    expect(container.querySelector('[data-stable-key="businessOverview"]')?.textContent).toBe(
      "事業概要",
    );
    expect(container.querySelector('[data-stable-key="skills"]')?.textContent).toContain(
      "TypeScript",
    );
    expect(container.querySelector('[data-stable-key="canProvide"]')?.textContent).toContain(
      "技術相談",
    );
  });

  it("renders personal rows with stableKey attributes and empty fallback", () => {
    const { container } = render(
      <PersonalSection
        rows={[
          { stableKey: "hobbies", label: "趣味", value: "", kind: "shortText" },
          { stableKey: "motto", label: "座右の銘", value: "継続", kind: "shortText" },
        ]}
      />,
    );
    expect(container.querySelector('[data-component="personal-section"]')).toBeTruthy();
    expect(container.querySelector('[data-stable-key="hobbies"] dd')?.textContent).toBe("—");
    expect(container.querySelector('[data-stable-key="motto"] dd')?.textContent).toBe("継続");
  });

  it("renders message as serif accent card and hides empty message", () => {
    const { container, rerender } = render(<MessageCard message="よろしくお願いします" />);
    expect(container.querySelector('[data-component="member-message"]')).toBeTruthy();
    expect(container.querySelector(".accent-soft")).toBeTruthy();
    expect(container.querySelector(".serif")?.textContent).toContain("よろしくお願いします");

    rerender(<MessageCard message="" />);
    expect(screen.queryByText("よろしくお願いします")).toBeNull();
  });
});
