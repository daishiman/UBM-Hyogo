import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SchemaPurposeExplainer } from "../SchemaPurposeExplainer";

describe("SchemaPurposeExplainer", () => {
  it("renders purpose, flow, outcome, and glossary", () => {
    render(<SchemaPurposeExplainer />);

    expect(screen.getByRole("heading", { name: "このページでできること" })).toBeTruthy();
    expect(screen.getByText("変更を検知")).toBeTruthy();
    expect(screen.getByText("項目を対応づけ")).toBeTruthy();
    expect(screen.getByText("会員データへ反映")).toBeTruthy();
    expect(screen.getByText("得られる結果")).toBeTruthy();
    expect(screen.getByText("項目キー")).toBeTruthy();
    expect(screen.getByText("stableKey")).toBeTruthy();
    expect(screen.getByText("対応づけ")).toBeTruthy();
    expect(screen.getByText("resolve")).toBeTruthy();
  });
});
