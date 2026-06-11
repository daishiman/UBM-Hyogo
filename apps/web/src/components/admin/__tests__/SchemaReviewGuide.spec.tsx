import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SchemaReviewGuide } from "../SchemaReviewGuide";

describe("SchemaReviewGuide", () => {
  it("renders the purpose guide, three-step flow, and glossary", () => {
    render(<SchemaReviewGuide />);

    expect(
      screen.getByRole("heading", {
        name: "フォームの設問変更を、過去データと繋げて整理します",
      }),
    ).toBeTruthy();
    expect(screen.getByText("フォームの設問が増減・変更されたことを自動で見つけます")).toBeTruthy();
    expect(screen.getByText(/過去の回答が新しい設問に自動で対応づきます/)).toBeTruthy();
    expect(document.querySelector('[data-component="schema-review-guide-flow"]')).toBeTruthy();
    expect(document.querySelector('[data-component="schema-review-glossary"]')).toBeTruthy();
    expect(screen.getByText("永続的な名前（技術名: stableKey）")).toBeTruthy();
    expect(screen.getByText("名前の対応づけ（技術名: alias）")).toBeTruthy();
  });
});
