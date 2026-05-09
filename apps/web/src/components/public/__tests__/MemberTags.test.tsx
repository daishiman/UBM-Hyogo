import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { MemberTags } from "../MemberTags";

afterEach(() => cleanup());

describe("MemberTags", () => {
  it("returns null when tags is empty (TC-U-08)", () => {
    const { container } = render(<MemberTags tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one badge per tag", () => {
    const { container } = render(
      <MemberTags
        tags={[
          { code: "x", label: "X", category: "interest" },
          { code: "y", label: "Y", category: "interest" },
        ]}
      />,
    );
    expect(container.querySelectorAll("li").length).toBe(2);
    expect(container.textContent).toContain("X");
    expect(container.textContent).toContain("Y");
  });
});
