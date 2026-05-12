import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { RegisterCallout } from "../RegisterCallout";

afterEach(() => cleanup());

describe("RegisterCallout", () => {
  it("renders external CTA pointing to responderUrl (TC-U-09)", () => {
    const url = "https://example.com/respond";
    const { container } = render(<RegisterCallout responderUrl={url} />);
    const cta = container.querySelector('[data-role="register-cta"]');
    expect(cta?.getAttribute("href")).toBe(url);
  });

  it("CTA is target=_blank with rel=noopener noreferrer (TC-U-10 — invariants #7)", () => {
    const { container } = render(
      <RegisterCallout responderUrl="https://x.example" />,
    );
    const cta = container.querySelector('[data-role="register-cta"]');
    expect(cta?.getAttribute("target")).toBe("_blank");
    expect(cta?.getAttribute("rel")).toContain("noopener");
    expect(cta?.getAttribute("rel")).toContain("noreferrer");
  });

  it("uses publicConsent / rulesConsent keys only (invariants #2)", () => {
    const { container } = render(
      <RegisterCallout responderUrl="https://x.example" />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("publicConsent");
    expect(text).toContain("rulesConsent");
  });
});
