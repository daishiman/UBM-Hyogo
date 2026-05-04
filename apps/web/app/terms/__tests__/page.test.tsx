import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TermsPage, { metadata } from "../page";

const contactFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";

describe("TermsPage", () => {
  it("renders the required terms sections", () => {
    render(<TermsPage />);

    for (const heading of [
      "本サービスの目的",
      "利用資格",
      "禁止事項",
      "退会",
      "免責事項",
      "規約の改定",
    ]) {
      expect(screen.getByRole("heading", { name: new RegExp(heading) })).toBeTruthy();
    }
    expect(screen.getByText(/反社会的勢力/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Google フォーム再回答ページ" }).getAttribute("href")).toBe(
      contactFormUrl,
    );
    expect(screen.getByText(/最終改定日: 2026-05-03/)).toBeTruthy();
  });

  it("is indexable and has a canonical URL", () => {
    expect(metadata.title).toBe("利用規約 | UBM 兵庫支部会");
    expect(metadata.alternates).toEqual({ canonical: "/terms" });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});
