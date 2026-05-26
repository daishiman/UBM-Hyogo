import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RegisterBottomCTA } from "../RegisterBottomCTA";

afterEach(() => cleanup());

describe("RegisterBottomCTA", () => {
  it("renders an external bottom CTA", () => {
    const { container } = render(
      <RegisterBottomCTA responderUrl="https://example.com/respond" />,
    );
    const cta = container.querySelector('[data-role="register-bottom-cta"]');
    expect(cta?.getAttribute("href")).toBe("https://example.com/respond");
    expect(cta?.getAttribute("target")).toBe("_blank");
    expect(cta?.getAttribute("rel")).toContain("noopener");
    expect(cta?.getAttribute("rel")).toContain("noreferrer");
  });
});
