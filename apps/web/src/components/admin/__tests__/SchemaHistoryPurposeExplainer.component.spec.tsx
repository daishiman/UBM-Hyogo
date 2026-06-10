import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SchemaHistoryPurposeExplainer } from "../SchemaHistoryPurposeExplainer";

afterEach(() => {
  cleanup();
});

describe("SchemaHistoryPurposeExplainer", () => {
  it("目的、3ステップ、用語集を描画する", () => {
    render(<SchemaHistoryPurposeExplainer />);
    expect(screen.getByTestId("schema-history-purpose-explainer")).toBeTruthy();
    expect(screen.getByText("この画面で分かること")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("設問の紐付け")).toBeTruthy();
    expect(screen.getByText("batchId")).toBeTruthy();
  });
});
