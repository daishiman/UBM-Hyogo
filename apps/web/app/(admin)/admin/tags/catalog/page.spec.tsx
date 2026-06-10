import { describe, expect, it, vi } from "vitest";
import AdminTagCatalogPage from "./page";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("AdminTagCatalogPage", () => {
  it("統合後のタグ定義画面へ redirect する", () => {
    AdminTagCatalogPage();
    expect(redirect).toHaveBeenCalledWith("/admin/tag-master");
  });
});
