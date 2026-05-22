import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { LegalProse } from "../LegalProse";

afterEach(() => cleanup());

describe("LegalProse", () => {
  it("wraps children in <article class='prose' data-component='legal-prose'> (TC-U-11)", () => {
    const { container } = render(
      <LegalProse>
        <h1>title</h1>
      </LegalProse>,
    );
    const article = container.querySelector("article");
    expect(article?.className).toContain("prose");
    expect(article?.getAttribute("data-component")).toBe("legal-prose");
  });

  it("renders children verbatim (TC-U-12)", () => {
    const { container } = render(
      <LegalProse>
        <h2>head</h2>
        <p>body</p>
      </LegalProse>,
    );
    expect(container.querySelector("h2")?.textContent).toBe("head");
    expect(container.querySelector("p")?.textContent).toBe("body");
  });
});
