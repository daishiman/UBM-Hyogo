// admin-dashboard-jp-clarity: SchemaAlertCard の平易日本語化（AC-2）検証
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SchemaAlertCard } from "../SchemaAlertCard";

afterEach(() => cleanup());

describe("SchemaAlertCard", () => {
  it("SA-1: 件数つき平易日本語の見出しを描画する", () => {
    render(<SchemaAlertCard count={2} />);
    expect(screen.getByText(/要対応のフォーム項目: 2 件/)).toBeTruthy();
  });

  it("SA-2: 技術語（スキーマ / alias / schema）が DOM に存在しない（negative）", () => {
    const { container } = render(<SchemaAlertCard count={2} />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("スキーマ");
    expect(text).not.toMatch(/alias/i);
    expect(text).not.toMatch(/schema/i); // 表示テキストに技術語 schema が出ない（href は別途確認）
  });

  it("SA-3: 対応づけ画面リンク /admin/schema を維持する（回帰 guard）", () => {
    render(<SchemaAlertCard count={2} />);
    const link = screen.getByRole("link", { name: /フォーム項目の対応づけを開く/ });
    expect(link.getAttribute("href")).toBe("/admin/schema");
  });

  it('SA-4: role="alert" を維持する（回帰 guard）', () => {
    render(<SchemaAlertCard count={2} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("SA-5: count<=0 で null を返し何も描画しない（branch coverage）", () => {
    const { container } = render(<SchemaAlertCard count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("SA-6: innerHTML に HEX 直書きがなくトークン色（--ubm-color-warn）を参照する", () => {
    const { container } = render(<SchemaAlertCard count={2} />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(container.innerHTML).toContain("--ubm-color-warn");
  });
});
