// followup-001 T-5.5: page-head 仕様
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MembersPageHead } from "../_members/MembersPageHead";

afterEach(() => cleanup());

describe("MembersPageHead (followup-001)", () => {
  it("eyebrow ADMIN / MEMBERS と h-page を表示する", () => {
    render(<MembersPageHead total={42} />);
    expect(screen.getByText("ADMIN / MEMBERS")).toBeDefined();
    expect(screen.getByRole("heading", { name: "メンバー管理" })).toBeDefined();
    expect(screen.getByText(/42 件/)).toBeDefined();
  });

  it("MVP 範囲外 CTA 2 つを disabled + title='MVP 範囲外' で出す", () => {
    render(<MembersPageHead total={0} />);
    const csv = screen.getByRole("button", { name: "CSV エクスポート" });
    const forms = screen.getByRole("button", { name: "Forms から取り込み" });
    expect(csv.hasAttribute("disabled")).toBe(true);
    expect(forms.hasAttribute("disabled")).toBe(true);
    expect(csv.getAttribute("title")).toBe("MVP 範囲外");
    expect(forms.getAttribute("title")).toBe("MVP 範囲外");
  });
});
