import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CallToActionCTA } from "../CallToActionCTA";

afterEach(() => cleanup());

describe("CallToActionCTA", () => {
  const RESPONDER_URL = "https://docs.google.com/forms/d/e/test/viewform";

  it("renders heading / body / cta with default props (AC-1, AC-5)", () => {
    const { container } = render(<CallToActionCTA responderUrl={RESPONDER_URL} />);
    expect(
      container.querySelector('[data-component="call-to-action-cta"]'),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "メンバー情報の掲載をお願いします" }),
    ).not.toBeNull();
    expect(screen.getByText(/Google フォーム/)).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "回答フォームを開く" }),
    ).not.toBeNull();
  });

  it("binds responderUrl to anchor href (AC-4)", () => {
    render(<CallToActionCTA responderUrl={RESPONDER_URL} />);
    const link = screen.getByRole("link", { name: "回答フォームを開く" });
    expect(link.getAttribute("href")).toBe(RESPONDER_URL);
  });

  it("sets external link safety attributes target/rel (AC-3)", () => {
    render(<CallToActionCTA responderUrl={RESPONDER_URL} />);
    const link = screen.getByRole("link", { name: "回答フォームを開く" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("shows an external-link icon inside the CTA for visual clarity", () => {
    render(<CallToActionCTA responderUrl={RESPONDER_URL} />);
    const link = screen.getByRole("link", { name: "回答フォームを開く" });
    expect(link.querySelector('[data-component="icon"]')).not.toBeNull();
  });

  it("declares dark variant via data-variant attribute", () => {
    const { container } = render(<CallToActionCTA responderUrl={RESPONDER_URL} />);
    const section = container.querySelector('[data-component="call-to-action-cta"]');
    expect(section?.getAttribute("data-variant")).toBe("dark");
  });

  it("allows overriding heading / body / ctaLabel via props", () => {
    render(
      <CallToActionCTA
        responderUrl={RESPONDER_URL}
        heading="カスタム見出し"
        body="カスタム本文"
        ctaLabel="カスタム CTA"
      />,
    );
    expect(screen.getByRole("heading", { name: "カスタム見出し" })).not.toBeNull();
    expect(screen.getByText("カスタム本文")).not.toBeNull();
    expect(screen.getByRole("link", { name: "カスタム CTA" })).not.toBeNull();
  });

  it("renders with required prop only, applies all defaults (regression guard)", () => {
    render(<CallToActionCTA responderUrl="https://x.example/" />);
    expect(
      screen.getByRole("heading", { name: "メンバー情報の掲載をお願いします" }),
    ).not.toBeNull();
    const link = screen.getByRole("link", { name: "回答フォームを開く" });
    expect(link.getAttribute("href")).toBe("https://x.example/");
  });

  it("does not leak href as plain text (xss-shaped regression guard)", () => {
    const url = "https://x.example/?q=<script>";
    render(<CallToActionCTA responderUrl={url} />);
    expect(screen.queryByText(url)).toBeNull();
    expect(screen.getByRole("link").getAttribute("href")).toBe(url);
  });

  it("eyebrow text 'FOR MEMBERS' is rendered (visual contract)", () => {
    render(<CallToActionCTA responderUrl="https://x.example/" />);
    expect(screen.getByText("FOR MEMBERS")).not.toBeNull();
  });
});
