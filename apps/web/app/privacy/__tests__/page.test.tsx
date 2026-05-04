import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacyPage, { metadata } from "../page";

const contactFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";

describe("PrivacyPage", () => {
  it("renders the required policy sections", () => {
    render(<PrivacyPage />);

    for (const heading of [
      "取得する情報",
      "利用目的",
      "第三者提供",
      "取得した情報の管理",
      "開示・訂正・削除",
      "本ポリシーの改定",
    ]) {
      expect(screen.getByRole("heading", { name: new RegExp(heading) })).toBeTruthy();
    }
    expect(screen.getAllByText(/Cookie/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cloudflare/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Google フォーム再回答ページ" }).getAttribute("href")).toBe(
      contactFormUrl,
    );
    expect(screen.getByText(/最終改定日: 2026-05-03/)).toBeTruthy();
  });

  it("is indexable and has a canonical URL", () => {
    expect(metadata.title).toBe("プライバシーポリシー | UBM 兵庫支部会");
    expect(metadata.alternates).toEqual({ canonical: "/privacy" });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});
