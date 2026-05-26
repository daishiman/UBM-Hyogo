import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { RegisterHeroCallout } from "../RegisterHeroCallout";

afterEach(() => cleanup());

describe("RegisterHeroCallout", () => {
  it("renders external CTA pointing to responderUrl (TC-U-09)", () => {
    const url = "https://example.com/respond";
    const { container } = render(
      <RegisterHeroCallout
        responderUrl={url}
        sectionCount={6}
        fieldCount={24}
      />,
    );
    const cta = container.querySelector('[data-role="register-cta"]');
    expect(cta?.getAttribute("href")).toBe(url);
  });

  it("CTA is target=_blank with rel=noopener noreferrer (TC-U-10 — invariants #7)", () => {
    const { container } = render(
      <RegisterHeroCallout
        responderUrl="https://x.example"
        sectionCount={6}
        fieldCount={24}
      />,
    );
    const cta = container.querySelector('[data-role="register-cta"]');
    expect(cta?.getAttribute("target")).toBe("_blank");
    expect(cta?.getAttribute("rel")).toContain("noopener");
    expect(cta?.getAttribute("rel")).toContain("noreferrer");
  });

  it("uses publicConsent / rulesConsent keys only (invariants #2)", () => {
    const { container } = render(
      <RegisterHeroCallout
        responderUrl="https://x.example"
        sectionCount={6}
        fieldCount={24}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("publicConsent");
    expect(text).toContain("rulesConsent");
  });

  it("shows form metrics and stable legacy component selector", () => {
    const { container } = render(
      <RegisterHeroCallout
        responderUrl="https://x.example"
        sectionCount={6}
        fieldCount={24}
      />,
    );
    expect(container.querySelector('[data-component="register-callout"]')).toBeTruthy();
    expect(container.textContent).toContain("6");
    expect(container.textContent).toContain("24");
  });
});
