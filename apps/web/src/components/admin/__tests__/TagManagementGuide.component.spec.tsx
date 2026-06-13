import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { TagManagementGuide } from "../TagManagementGuide";

afterEach(() => cleanup());

describe("TagManagementGuide", () => {
  it("タグ定義画面ではタグ割当への相互リンクを表示する", () => {
    render(<TagManagementGuide variant="definition" />);

    expect(screen.getByRole("region", { name: "タグ管理ガイド" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "タグ定義とタグ割当の関係" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "タグ割当へ" }).getAttribute("href")).toBe(
      "/admin/tags",
    );
  });

  it("タグ割当画面ではタグ定義への相互リンクを表示する", () => {
    render(<TagManagementGuide variant="assignment" />);

    expect(screen.getByRole("heading", { name: "タグ割当の進め方" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "タグ定義へ" }).getAttribute("href")).toBe(
      "/admin/tag-master",
    );
  });
});
